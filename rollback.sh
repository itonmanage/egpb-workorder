#!/bin/bash

###############################################################################
# Rollback Script สำหรับ Next.js Standalone Deployment
# ใช้สำหรับ rollback ไปยัง version ก่อนหน้า
###############################################################################

set -e

# สี สำหรับ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="$(pwd)"
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="$APP_DIR/logs/rollback.log"

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

###############################################################################
# แสดงรายการ backup ที่มี
###############################################################################
log "📋 รายการ backup ที่มีอยู่:"
echo ""

if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR)" ]; then
    log_error "ไม่พบ backup ใดๆ ใน $BACKUP_DIR"
    exit 1
fi

# แสดงรายการ backup พร้อมหมายเลข
backups=($(ls -t "$BACKUP_DIR"))
count=1

for backup in "${backups[@]}"; do
    backup_date=$(echo "$backup" | sed 's/backup_//' | sed 's/_/ /')
    backup_size=$(du -sh "$BACKUP_DIR/$backup" | cut -f1)
    echo -e "${BLUE}[$count]${NC} $backup_date (Size: $backup_size)"
    ((count++))
done

echo ""

###############################################################################
# เลือก backup ที่จะ rollback
###############################################################################
read -p "เลือกหมายเลข backup ที่ต้องการ rollback (1-${#backups[@]}): " choice

if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#backups[@]}" ]; then
    log_error "หมายเลขไม่ถูกต้อง"
    exit 1
fi

selected_backup="${backups[$((choice-1))]}"
backup_path="$BACKUP_DIR/$selected_backup"

log "📦 เลือก backup: $selected_backup"

###############################################################################
# ยืนยันการ rollback
###############################################################################
echo ""
log_warning "⚠️  คำเตือน: การ rollback จะเปลี่ยน application code กลับไปยัง version เก่า"
log_warning "    Database จะไม่ถูกแตะต้อง"
echo ""

read -p "ยืนยันการ rollback? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log "ยกเลิกการ rollback"
    exit 0
fi

###############################################################################
# ตรวจสอบ database migration
###############################################################################
log "🔍 ตรวจสอบ database migration..."

if npx prisma migrate status 2>&1 | grep -q "pending"; then
    log_warning "⚠️  พบ database migration ที่ยังไม่ได้ apply!"
    log_warning "    Version เก่าอาจไม่รองรับ database schema ปัจจุบัน"
    log_warning "    คุณอาจต้อง rollback database migration ด้วยตนเอง"
    echo ""
    read -p "ต้องการดำเนินการต่อไหม? (yes/no): " continue_confirm
    
    if [ "$continue_confirm" != "yes" ]; then
        log "ยกเลิกการ rollback"
        exit 0
    fi
fi

###############################################################################
# Backup version ปัจจุบันก่อน rollback
###############################################################################
log "💾 สำรองข้อมูล version ปัจจุบันก่อน rollback..."

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CURRENT_BACKUP="$BACKUP_DIR/before_rollback_$TIMESTAMP"

if [ -d ".next" ]; then
    mkdir -p "$CURRENT_BACKUP"
    cp -r .next "$CURRENT_BACKUP/"
    cp ecosystem.config.js "$CURRENT_BACKUP/" 2>/dev/null || true
    log_success "สำรองข้อมูล version ปัจจุบันไปที่: $CURRENT_BACKUP"
fi

###############################################################################
# ทำการ rollback
###############################################################################
log "🔄 กำลัง rollback..."

# ลบ .next directory ปัจจุบัน
if [ -d ".next" ]; then
    rm -rf .next
    log_success "ลบ .next directory เก่า"
fi

# คัดลอก backup กลับมา
if [ -d "$backup_path/.next" ]; then
    cp -r "$backup_path/.next" .
    log_success "คัดลอก .next จาก backup"
else
    log_error "ไม่พบ .next directory ใน backup"
    exit 1
fi

# คัดลอก ecosystem.config.js ถ้ามี
if [ -f "$backup_path/ecosystem.config.js" ]; then
    cp "$backup_path/ecosystem.config.js" .
    log_success "คัดลอก ecosystem.config.js จาก backup"
fi

###############################################################################
# Reload PM2
###############################################################################
log "🔄 Reloading PM2..."

if pm2 list | grep -q "ticket-app"; then
    pm2 reload ecosystem.config.js --update-env
    log_success "PM2 reload สำเร็จ"
else
    log_warning "ไม่พบ PM2 process กำลัง start ใหม่..."
    pm2 start ecosystem.config.js
fi

pm2 save

###############################################################################
# ตรวจสอบสถานะ
###############################################################################
log "🔍 ตรวจสอบสถานะ application..."

sleep 3

if pm2 list | grep -q "online"; then
    log_success "✅ Rollback สำเร็จ!"
    pm2 list
else
    log_error "❌ Application ไม่สามารถ start ได้หลัง rollback"
    log_error "กรุณาตรวจสอบ logs: pm2 logs ticket-app"
    exit 1
fi

###############################################################################
# เสร็จสิ้น
###############################################################################
echo ""
log_success "========================================="
log_success "🎉 Rollback สำเร็จ!"
log_success "========================================="
echo ""
log "📊 ตรวจสอบ application:"
log "   - PM2 status: pm2 status"
log "   - PM2 logs: pm2 logs ticket-app"
log "   - Application URL: http://localhost:3000"
echo ""
log "💾 Version ปัจจุบันถูกสำรองไว้ที่: $CURRENT_BACKUP"
echo ""
