const app = require('./app');
require('dotenv').config();
const { initializeFirebase } = require('./modules/connectionFirestore');
const { loggers } = require('./utils/logger');

if (process.env.NODE_ENV !== 'production') {
    app.listen(process.env.PORT, () => {
        loggers.api.info(`Server running on port ${process.env.PORT}`);

        // Inicializa Firebase no startup
        try {
            initializeFirebase();
        } catch (error) {
            loggers.api.warn('Firebase failed to initialize', { error: error.message });
        }
    });
}

module.exports = app;
