/**
 * Spotify Integration Placeholder.
 */
const SpotifyIntegration = {
    async fetchData(username) { return { username, status: "standby" }; },
    renderCard(container, data) {
        container.innerHTML = `<h2 class="card-title">🎵 SPOTIFY MEDIA</h2><div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 0.8rem;">Spotify Integration [User: ${data.username.toUpperCase()}] loaded in standby mode.</div>`;
    }
};
window.IntegrationManager.register('spotify', SpotifyIntegration);
