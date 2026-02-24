module.exports = {
  apps: [
    {
      name: 'ticket-app',
      // ⚠️ หลัง build standalone แล้ว ให้เปลี่ยนเป็น:
      // script: '.next/standalone/server.js',
      // ตอนนี้ยังใช้แบบเดิมไปก่อน จนกว่าจะ build standalone เสร็จ
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0 -p 3000',
      cwd: process.cwd(), // ใช้ current directory
      instances: 1, // จำนวน instances (ใช้ 'max' สำหรับ cluster mode)
      exec_mode: 'fork', // หรือ 'cluster' สำหรับ multi-core

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        UPLOAD_DIR: 'F:\\EGPB-Uploads',
        // DATABASE_URL จะถูกโหลดจาก .env file อัตโนมัติ
      },

      // Auto restart settings
      autorestart: true,
      watch: false, // ไม่ต้อง watch ใน production
      max_memory_restart: '2G', // Restart ถ้าใช้ memory เกิน 2GB
      max_restarts: 10, // จำนวนครั้งสูงสุดที่จะ restart ถ้ามีปัญหา
      min_uptime: '10s', // ต้องรันได้อย่างน้อย 10 วินาที ถึงจะถือว่าเป็น restart ที่สำเร็จ

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000, // รอ 5 วินาทีก่อน force kill
      wait_ready: true, // รอให้ app พร้อมก่อนถือว่า start สำเร็จ
      listen_timeout: 10000, // รอสูงสุด 10 วินาทีให้ app listen port
    },
  ],
};

