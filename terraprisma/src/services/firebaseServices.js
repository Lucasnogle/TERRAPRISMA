const { GoogleAuth } = require('google-auth-library');
const getConfig = require("../config");
const axios = require('axios');

let cachedToken = { //Cache for Firebase token (59 min)
    value: null,
    expires: 0
};

const getFirebaseAccessToken = async (credentials) => {
    if (!credentials.client_email || !credentials.private_key) {
        throw new Error('Database JSON is not a valid service account credentials file.');
    }

    if (cachedToken.value && Date.now() < cachedToken.expires) {
        console.log('Returning cached Firebase access token.');
        return cachedToken.value;
    }

    console.log('No valid cached token found. Requesting a new one.');

    try {
        const config = await getConfig();
        const auth = new GoogleAuth({
            credentials: {
                client_email: credentials.client_email,
                private_key: credentials.private_key,
            },
            scopes: [config.firebase.messaging]
        });

        const newAccessToken = await auth.getAccessToken();
        cachedToken.value = newAccessToken;
        cachedToken.expires = Date.now() + 59 * 60 * 1000;
        console.log('New token acquired and cached.');

        return newAccessToken;
    } catch (error) {
        cachedToken = { value: null, expires: 0 };
        console.error("Error getting Firebase access token:", error.message);
        throw new Error('Could not authenticate with Firebase.');
    }
};

module.exports = {
    getFirebaseAccessToken
};
