# ========================================
# EGPB Ticket - Create .env.local Script
# ========================================

Write-Host "🚀 Creating .env.local file..." -ForegroundColor Green
Write-Host ""

# Generate random secrets
$NEXTAUTH_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
$JWT_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Prompt for database password
Write-Host "📝 Please enter your PostgreSQL password:" -ForegroundColor Yellow
$DB_PASSWORD = Read-Host -AsSecureString
$DB_PASSWORD_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

# Prompt for database user (default: egpb_admin)
Write-Host ""
Write-Host "📝 Database user (default: egpb_admin):" -ForegroundColor Yellow
$DB_USER = Read-Host
if ([string]::IsNullOrWhiteSpace($DB_USER)) {
    $DB_USER = "egpb_admin"
}

# Prompt for database name (default: egpb_ticket_db)
Write-Host ""
Write-Host "📝 Database name (default: egpb_ticket_db):" -ForegroundColor Yellow
$DB_NAME = Read-Host
if ([string]::IsNullOrWhiteSpace($DB_NAME)) {
    $DB_NAME = "egpb_ticket_db"
}

# Get server IP address
$IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress

if ([string]::IsNullOrWhiteSpace($IP)) {
    $IP = "localhost"
}

Write-Host ""
Write-Host "🌐 Detected IP Address: $IP" -ForegroundColor Cyan
Write-Host "📝 Use this IP for NEXTAUTH_URL? (Enter for localhost, or type custom IP):" -ForegroundColor Yellow
$CUSTOM_IP = Read-Host
if ([string]::IsNullOrWhiteSpace($CUSTOM_IP)) {
    $APP_URL = "http://localhost:3000"
} else {
    $APP_URL = "http://${CUSTOM_IP}:3000"
}

# Create .env.local content
$ENV_CONTENT = @"
# ========================================
# EGPB Ticket System - Environment Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ========================================

# ========================================
# DATABASE CONFIGURATION
# ========================================

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD_TEXT}@localhost:5432/${DB_NAME}?schema=public"
DIRECT_URL="postgresql://${DB_USER}:${DB_PASSWORD_TEXT}@localhost:5432/${DB_NAME}?schema=public"

# ========================================
# AUTHENTICATION SECRETS
# ========================================

NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
JWT_SECRET="${JWT_SECRET}"
NEXTAUTH_URL="${APP_URL}"

# ========================================
# FILE STORAGE
# ========================================

UPLOAD_DIR="D:/EGPB-Uploads"

# ========================================
# APPLICATION SETTINGS
# ========================================

NODE_ENV="development"
PORT=3000

# ========================================
# BACKUP SETTINGS
# ========================================

BACKUP_DIR="D:/EGPB-Backups"

# ========================================
# MIGRATION (Optional - for data migration from Supabase)
# ========================================

# SUPABASE_URL="https://your-project.supabase.co"
# SUPABASE_KEY="your-supabase-anon-key"

# ========================================
# NOTES
# ========================================

# ⚠️  Do NOT commit this file to git
# ✅  Keep this file secure
# ✅  Backup this file safely
# ✅  Change passwords regularly
"@

# Write to .env.local
$ENV_CONTENT | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ .env.local created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "   Database User: $DB_USER" -ForegroundColor White
Write-Host "   Database Name: $DB_NAME" -ForegroundColor White
Write-Host "   App URL: $APP_URL" -ForegroundColor White
Write-Host "   Upload Dir: D:/EGPB-Uploads" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Generated Secrets:" -ForegroundColor Cyan
Write-Host "   NEXTAUTH_SECRET: ✓ Generated (32 bytes)" -ForegroundColor Green
Write-Host "   JWT_SECRET: ✓ Generated (32 bytes)" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Create directories:" -ForegroundColor White
Write-Host "      New-Item -ItemType Directory -Path 'D:\EGPB-Uploads' -Force" -ForegroundColor Gray
Write-Host "      New-Item -ItemType Directory -Path 'D:\EGPB-Backups' -Force" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Install packages:" -ForegroundColor White
Write-Host "      npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Generate Prisma Client:" -ForegroundColor White
Write-Host "      npm run prisma:generate" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Push schema to database:" -ForegroundColor White
Write-Host "      npm run prisma:push" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Start application:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Ready to go!" -ForegroundColor Green

