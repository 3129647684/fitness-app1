module.exports = {
  apps: [
    {
      name: 'bodydata-server',
      script: './server/server.js',
      cwd: './server',
      interpreter: 'node',
      watch: false,
      env: {
        PORT: 4000,
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      error_file: './server/logs/err.log',
      out_file: './server/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/bodydata-app.git',
      path: '/var/www/bodydata-app',
      'post-deploy': [
        'cd /var/www/bodydata-app/current',
        'npm install --omit=dev',
        'npm run web:build',
        'mkdir -p /var/www/bodydata-app && rm -rf /var/www/bodydata-app/* && cp -r dist/* /var/www/bodydata-app/',
        'cd server && npm install --omit=dev',
        'pm2 reload ecosystem.config.js --env production',
      ].join(' && '),
    },
  },
};
