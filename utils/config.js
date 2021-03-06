if (typeof window === "undefined") {
    /**
     * Settings exposed to the server.
     */
    module.exports = {
        FIREBASE_SERVICE_ACCT: process.env.FIREBASE_SERVICE_ACCT,
        SONOS_CLIENT_ID: process.env.SONOS_CLIENT_ID,
        SONOS_CLIENT_SECRET: process.env.SONOS_CLIENT_SECRET,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
        DISCORD_BOT_PERMISSION: process.env.DISCORD_BOT_PERMISSION,
    };
} else {
    /**
     * Settings exposed to the client.
     */
    module.exports = {};
}