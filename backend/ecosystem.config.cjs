/**
 * Konfigurasi PM2 untuk CMMS API.
 * Pakai: pm2 start ecosystem.config.cjs
 * Pastikan file .env ada di folder backend (satu tingkat di atas dist/).
 */
module.exports = {
  apps: [
    {
      name: 'cmms-api',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
