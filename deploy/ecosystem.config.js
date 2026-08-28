// PM2 进程管理配置
// 使用前请替换环境变量值，切勿将真实密钥提交到版本库

module.exports = {
  apps: [
    {
      name: 'fitness-app-server',
      script: './index.js',
      cwd: './server',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,
      max_memory_restart: '512M',

      // 环境变量（生产环境）
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        // 必填：JWT 密钥，至少32位随机字符串
        // 生成命令: openssl rand -hex 32
        JWT_SECRET: 'please-change-this-to-a-32-char-random-secret',
        // CORS 白名单，多个用逗号分隔
        CORS_ORIGIN: 'https://your-domain.com',
        // 管理员账号（首次启动创建）
        ADMIN_USERNAME: 'admin',
        // 不设置则首次启动自动生成随机密码
        // ADMIN_PASSWORD: 'your-strong-password',
      },

      // 日志配置
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
