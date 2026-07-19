/**
 * Developer Dashboard Backend - Server entrypoint with Express, MongoDB Atlas, JWT Cookies and Google OAuth Verification.
 */

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Google Auth Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// -------------------------------------------------------------
// Express Middlewares
// -------------------------------------------------------------
const allowedOrigins = [
    'http://localhost:5500',
    'http://localhost:8000',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:8000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like curl)
        if (!origin) return callback(null, true);
        
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isProd = process.env.FRONTEND_URL && (origin === process.env.FRONTEND_URL || origin.startsWith(process.env.FRONTEND_URL));

        if (isLocalhost || isProd) {
            return callback(null, true);
        } else {
            // Clean CORS rejection without throwing a 500 server error
            return callback(null, false);
        }
    },
    credentials: true, // Required to accept cookies from cross-origin requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// -------------------------------------------------------------
// MongoDB Atlas Connection
// -------------------------------------------------------------
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas successfully."))
    .catch(err => console.error("MongoDB Atlas connection error:", err));

// -------------------------------------------------------------
// Mongoose Models
// -------------------------------------------------------------
const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    picture: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const SyncDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    routines: { type: Array, default: [] },
    history: { type: Object, default: {} },
    xp: { type: Number, default: 0 },
    lastSynced: { type: Date, default: Date.now }
});

const SyncData = mongoose.model('SyncData', SyncDataSchema);

// -------------------------------------------------------------
// Authentication Middleware
// -------------------------------------------------------------
const authenticateToken = async (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ error: "Access denied. Sign-in required." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found in system database." });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("JWT Verification failed:", err);
        return res.status(403).json({ error: "Session expired or invalid token." });
    }
};

// -------------------------------------------------------------
// Routes
// -------------------------------------------------------------

// 1. Google OAuth Authentication Endpoint
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: "Missing identity credential token." });
    }

    try {
        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        // Auto-create or fetch user
        let user = await User.findOne({ googleId: sub });
        if (!user) {
            // Check if user exists by email (link Google ID if matching)
            user = await User.findOne({ email });
            if (!user) {
                user = new User({
                    googleId: sub,
                    email,
                    name,
                    picture
                });
                await user.save();
                console.log(`New user registered: ${email}`);
            } else {
                user.googleId = sub;
                user.picture = picture;
                await user.save();
            }
        } else {
            // Keep picture and name updated
            user.name = name;
            user.picture = picture;
            await user.save();
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Save JWT inside a secure HttpOnly cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: true, // Must be true on production (Vercel) to work with SameSite=None
            sameSite: 'none', // Needed for cross-origin cookie sharing (GitHub Pages to Vercel)
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
        });

        return res.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        });
    } catch (err) {
        console.error("Google Auth failure:", err);
        return res.status(500).json({ error: "Identity token verification failed." });
    }
});

// 2. Fetch Active Session
app.get('/api/auth/me', authenticateToken, (req, res) => {
    return res.json({
        loggedIn: true,
        user: {
            name: req.user.name,
            email: req.user.email,
            picture: req.user.picture
        }
    });
});

// 3. Clear Active Session (Logout)
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    return res.json({ success: true, message: "Cleared auth cookie session." });
});

// 4. Protect Database Sync: Upload data (Push)
app.post('/api/sync/push', authenticateToken, async (req, res) => {
    const { routines, history, xp } = req.body;

    try {
        let syncRecord = await SyncData.findOne({ userId: req.user._id });
        if (!syncRecord) {
            syncRecord = new SyncData({
                userId: req.user._id,
                routines,
                history,
                xp,
                lastSynced: new Date()
            });
        } else {
            syncRecord.routines = routines;
            syncRecord.history = history;
            syncRecord.xp = xp;
            syncRecord.lastSynced = new Date();
        }

        await syncRecord.save();
        return res.json({ success: true, message: "Data backed up to MongoDB Atlas." });
    } catch (err) {
        console.error("Sync push error:", err);
        return res.status(500).json({ error: "Failed to backup data." });
    }
});

// 5. Protect Database Sync: Download data (Pull)
app.get('/api/sync/pull', authenticateToken, async (req, res) => {
    try {
        const syncRecord = await SyncData.findOne({ userId: req.user._id });
        
        if (!syncRecord) {
            return res.json({
                success: true,
                message: "No remote backup found. Initializing.",
                data: null
            });
        }

        return res.json({
            success: true,
            data: {
                routines: syncRecord.routines,
                history: syncRecord.history,
                xp: syncRecord.xp
            }
        });
    } catch (err) {
        console.error("Sync pull error:", err);
        return res.status(500).json({ error: "Failed to retrieve synced data." });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.send("Developer Dashboard API Server is running.");
});

// Server boot
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
