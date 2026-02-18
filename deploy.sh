#!/bin/bash

###############################################################################
# Deployment Script สำหรับ Next.js Standalone Build
# ใช้สำหรับ deploy บน Nutanix VM (Linux)
###############################################################################

set -e  # หยุดทันทีถ้ามี error

# สี สำหรับ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ตัวแปร configuration
APP_NAME="ticket-form-app"
APP_DIR="$(pwd)"
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="$APP_DIR/logs/deployment.log"

# ฟังก์ชัน logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"
}

# สร้าง directories ที่จำเป็น
mkdir -p "$BACKUP_DIR"
mkdir -p "$APP_DIR/logs"

###############################################################################
# ขั้นตอนที่ 1: ตรวจสอบ prerequisites
###############################################################################
log "🔍 ตรวจสอบ prerequisites..."

# ตรวจสอบ Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js ไม่ได้ติดตั้ง กรุณาติดตั้ง Node.js ก่อน"
    exit 1
fi
log_success "Node.js version: $(node --version)"

# ตรวจสอบ npm
if ! command -v npm &> /dev/null; then
    log_error "npm ไม่ได้ติดตั้ง"
    exit 1
fi
log_success "npm version: $(npm --version)"

# ตรวจสอบ PM2
if ! command -v pm2 &> /dev/null; then
    log_warning "PM2 ไม่ได้ติดตั้ง กำลังติดตั้ง PM2..."
    npm install -g pm2
    log_success "ติดตั้ง PM2 สำเร็จ"
else
    log_success "PM2 version: $(pm2 --version)"
fi

###############################################################################
# ขั้นตอนที่ 2: ตรวจสอบ database migration
###############################################################################
log "🔍 ตรวจสอบ database migration..."

if npx prisma migrate status 2>&1 | grep -q "pending"; then
    log_warning "⚠️  พบ database migration ที่ยังไม่ได้ apply!"
    log_warning "    ถ้า rollback อาจต้อง rollback database ด้วย"
    read -p "ต้องการดำเนินการต่อไหม? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "ยกเลิกการ deploy"
        exit 0
    fi
fi

###############################################################################
# ขั้นตอนที่ 3: Backup version เก่า
###############################################################################
log "💾 สำรองข้อมูล version เก่า..."

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

if [ -d ".next" ]; then
    mkdir -p "$BACKUP_PATH"
    cp -r .next "$BACKUP_PATH/"
    cp ecosystem.config.js "$BACKUP_PATH/" 2>/dev/null || true
    log_success "สำรองข้อมูลไปที่: $BACKUP_PATH"
else
    log_warning "ไม่พบ .next directory (อาจเป็นการ deploy ครั้งแรก)"
fi

###############################################################################
# ขั้นตอนที่ 4: Install dependencies
###############################################################################
log "📦 ติดตั้ง dependencies..."

npm ci --production=false
log_success "ติดตั้ง dependencies สำเร็จ"

###############################################################################
# ขั้นตอนที่ 5: Build standalone
###############################################################################
log "🔨 Building Next.js standalone..."

npm run build

if [ ! -d ".next/standalone" ]; then
    log_error "Build ล้มเหลว: ไม่พบ .next/standalone directory"
    log_error "กรุณาตรวจสอบว่า next.config.ts มี output: 'standalone'"
    exit 1
fi

log_success "Build standalone สำเร็จ"

###############################################################################
# ขั้นตอนที่ 6: Copy static files และ public
###############################################################################
log "📁 คัดลอก static files..."

# Copy static files
if [ -d ".next/static" ]; then
    cp -r .next/static .next/standalone/.next/
    log_success "คัดลอก static files สำเร็จ"
fi

# Copy public folder
if [ -d "public" ]; then
    cp -r public .next/standalone/
    log_success "คัดลอก public folder สำเร็จ"
fi

###############################################################################
# ขั้นตอนที่ 7: อัพเดท PM2 config
###############################################################################
log "⚙️  อัพเดท PM2 configuration..."

# สร้าง temporary config file
cat > ecosystem.config.temp.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ticket-app',
      script: '.next/standalone/server.js',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s',
      
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
EOF

mv ecosystem.config.temp.js ecosystem.config.js
log_success "อัพเดท PM2 config สำเร็จ"

###############################################################################
# ขั้นตอนที่ 8: Reload PM2 (Zero Downtime)
###############################################################################
log "🔄 Reloading PM2 (zero downtime)..."

# ตรวจสอบว่า PM2 มี process รันอยู่หรือไม่
if pm2 list | grep -q "ticket-app"; then
    log "พบ process เก่า กำลัง reload..."
    pm2 reload ecosystem.config.js --update-env
else
    log "ไม่พบ process เก่า กำลัง start ใหม่..."
    pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save

log_success "PM2 reload สำเร็จ"

###############################################################################
# ขั้นตอนที่ 9: ตรวจสอบสถานะ
###############################################################################
log "🔍 ตรวจสอบสถานะ application..."

sleep 3  # รอให้ app start

# ตรวจสอบ PM2 status
if pm2 list | grep -q "online"; then
    log_success "✅ Application รันสำเร็จ!"
    pm2 list
else
    log_error "❌ Application ไม่สามารถ start ได้"
    log_error "กำลัง rollback..."
    
    # Rollback
    if [ -d "$BACKUP_PATH/.next" ]; then
        rm -rf .next
        cp -r "$BACKUP_PATH/.next" .
        pm2 reload ecosystem.config.js
        log_warning "Rollback สำเร็จ กลับไปใช้ version เก่า"
    fi
    
    exit 1
fi

###############################################################################
# ขั้นตอนที่ 10: ทำความสะอาด backup เก่า (เก็บไว้แค่ 5 versions)
###############################################################################
log "🧹 ทำความสะอาด backup เก่า..."

cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm -rf
cd "$APP_DIR"

log_success "เก็บ backup ไว้ล่าสุด 5 versions"

###############################################################################
# เสร็จสิ้น
###############################################################################
echo ""
log_success "========================================="
log_success "🎉 Deployment สำเร็จ!"
log_success "========================================="
echo ""
log "📊 ตรวจสอบ logs:"
log "   - PM2 logs: pm2 logs ticket-app"
log "   - Error logs: tail -f logs/pm2-error.log"
log "   - Output logs: tail -f logs/pm2-out.log"
echo ""
log "🔧 คำสั่งที่เป็นประโยชน์:"
log "   - ดู status: pm2 status"
log "   - ดู monitoring: pm2 monit"
log "   - Restart: pm2 restart ticket-app"
log "   - Stop: pm2 stop ticket-app"
echo ""
log "💾 Backup location: $BACKUP_PATH"
echo ""
