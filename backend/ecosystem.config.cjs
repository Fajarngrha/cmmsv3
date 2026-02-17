/**
 * Konfigurasi PM2 untuk CMMS API.
 * Selalu jalankan dari folder backend: cd backend && pm2 start ecosystem.config.cjs
 * File .env (DATABASE_URL / DB_*) harus ada di folder backend.
 */
module.exports = {
  apps: [
    {
      name: 'cmms-apiv3',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
