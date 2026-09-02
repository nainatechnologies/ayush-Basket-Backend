module.exports = {
  apps: [
    {
      name: 'ayushbasket-api',
      script: 'src/server.js',
      instances: 'max', // Utilizes all available CPU cores
      exec_mode: 'cluster', // Enables clustering for better performance
      watch: false, // Do not watch for file changes in production
      max_memory_restart: '1G', // Restarts the app if it exceeds 1GB of memory
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
    }
  ]
};
