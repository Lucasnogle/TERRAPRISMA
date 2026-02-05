require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    sqlServer: {
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        server: process.env.DATABASE_SERVER,
        database: process.env.DATABASE_DATABASE,
        options: { encrypt: true, trustServerCertificate: true },
    },

    mongoDB: {
        uri: process.env.MONGO_URI,
        dbName: process.env.MONGO_DB_NAME,
    },

    mySQL: {
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        host: process.env.MYSQL_HOST,
        database: process.env.MYSQL_DB,
        port: process.env.MYSQL_PORT,
    },

    aws: {
        accessKey: process.env.AWS_ACCESS_KEY,
        secretKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION,
        bucketName: process.env.AWS_S3_BUCKET_NAME,
    },

    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
        databaseId: process.env.FIREBASE_DATABASE_ID,
    },

    // Segunda Leve - OpenAI
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },

    // Segunda Leve - SMTP (Email)
    smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM || '"Segunda Leve" <noreply@segundaleve.com>',
    },

    // Job Queue Settings
    job: {
        maxAttempts: parseInt(process.env.JOB_MAX_ATTEMPTS) || 3,
        runningTimeoutMinutes: parseInt(process.env.JOB_RUNNING_TIMEOUT_MINUTES) || 10,
        pollIntervalMs: parseInt(process.env.JOB_POLL_INTERVAL_MS) || 2000,
    },

    // Cron timezone
    timezone: process.env.TIMEZONE || 'America/Sao_Paulo',

    // Logging
    logLevel: process.env.LOG_LEVEL || 'INFO',
};
