module.exports = {
    apps: [{
        name: 'terraprisma-api',
        script: 'src/server.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '512M',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        // Logging
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        merge_logs: true,
        // Graceful shutdown
        kill_timeout: 5000,
        listen_timeout: 10000
    }]
};
