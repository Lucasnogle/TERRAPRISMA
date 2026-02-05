module.exports = {
    apps: [
        {
            name: 'terraprisma-api',
            script: 'src/server.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: { NODE_ENV: 'production' },
        },
        {
            name: 'terraprisma-cron',
            script: 'src/cron.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: { NODE_ENV: 'production' },
        },
        {
            name: 'terraprisma-worker',
            script: 'src/worker.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: { NODE_ENV: 'production' },
        },
    ],
};
