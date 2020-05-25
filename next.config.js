require("dotenv").config();

module.exports = {
    env: {
        FIREBASE_SERVICE_ACCT: process.env.FIREBASE_SERVICE_ACCT,
        SONOS_CLIENT_ID: process.env.SONOS_CLIENT_ID,
        SONOS_CLIENT_SECRET: process.env.SONOS_CLIENT_SECRET,
        SONOS_REDIRECT_URI: process.env.SONOS_REDIRECT_URI,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI_VENMO: process.env.GOOGLE_REDIRECT_URI_VENMO,
    },
};