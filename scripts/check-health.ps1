# Health Check Monitoring Script
# Checks application health and sends alerts if unhealthy

param(
    [string]$HealthUrl = "http://localhost:3000/api/health",
    [string]$TeamsWebhook = $env:TEAMS_WEBHOOK_URL,
    [switch]$SendAlert
)

Write-Host "Checking application health..." -ForegroundColor Cyan
Write-Host "URL: $HealthUrl" -ForegroundColor Gray
Write-Host ""

try {
    # Make health check request
    $response = Invoke-WebRequest -Uri $HealthUrl -TimeoutSec 10 -UseBasicParsing
    $health = $response.Content | ConvertFrom-Json
    
    # Display results
    Write-Host "Status: $($health.status.ToUpper())" -ForegroundColor $(
        if ($health.status -eq 'healthy') { 'Green' }
        elseif ($health.status -eq 'degraded') { 'Yellow' }
        else { 'Red' }
    )
    Write-Host "Timestamp: $($health.timestamp)" -ForegroundColor Gray
    Write-Host "Uptime: $([math]::Round($health.uptime / 3600, 2)) hours" -ForegroundColor Gray
    Write-Host ""
    
    # Database status
    Write-Host "Database:" -ForegroundColor White
    Write-Host "  Status: $($health.checks.database.status)" -ForegroundColor $(
        if ($health.checks.database.status -eq 'ok') { 'Green' } else { 'Red' }
    )
    if ($health.checks.database.responseTime) {
        Write-Host "  Response Time: $($health.checks.database.responseTime)ms" -ForegroundColor Gray
    }
    if ($health.checks.database.error) {
        Write-Host "  Error: $($health.checks.database.error)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Memory status
    Write-Host "Memory:" -ForegroundColor White
    Write-Host "  Used: $($health.checks.memory.used) MB" -ForegroundColor Gray
    Write-Host "  Total: $($health.checks.memory.total) MB" -ForegroundColor Gray
    Write-Host "  Usage: $($health.checks.memory.percentage)%" -ForegroundColor $(
        if ($health.checks.memory.percentage -lt 80) { 'Green' }
        elseif ($health.checks.memory.percentage -lt 90) { 'Yellow' }
        else { 'Red' }
    )
    Write-Host ""
    
    # System info
    Write-Host "System:" -ForegroundColor White
    Write-Host "  Node: $($health.checks.system.nodeVersion)" -ForegroundColor Gray
    Write-Host "  Platform: $($health.checks.system.platform)" -ForegroundColor Gray
    Write-Host ""
    
    # Send alert if unhealthy and webhook is configured
    if ($health.status -ne 'healthy' -and $SendAlert -and $TeamsWebhook) {
        $alertMessage = @{
            "@type"      = "MessageCard"
            "@context"   = "https://schema.org/extensions"
            "summary"    = "EGPB Ticket System Health Alert"
            "themeColor" = if ($health.status -eq 'degraded') { "FFA500" } else { "FF0000" }
            "title"      = "⚠️ Health Check Alert"
            "sections"   = @(
                @{
                    "activityTitle"    = "EGPB Ticket Management System"
                    "activitySubtitle" = "Status: $($health.status.ToUpper())"
                    "facts"            = @(
                        @{ "name" = "Database"; "value" = $health.checks.database.status }
                        @{ "name" = "Memory Usage"; "value" = "$($health.checks.memory.percentage)%" }
                        @{ "name" = "Uptime"; "value" = "$([math]::Round($health.uptime / 3600, 2)) hours" }
                    )
                }
            )
        } | ConvertTo-Json -Depth 10
        
        Invoke-WebRequest -Uri $TeamsWebhook -Method POST -Body $alertMessage -ContentType "application/json" | Out-Null
        Write-Host "Alert sent to Teams" -ForegroundColor Yellow
    }
    
    # Exit with appropriate code
    if ($health.status -eq 'healthy') {
        exit 0
    }
    elseif ($health.status -eq 'degraded') {
        exit 1
    }
    else {
        exit 2
    }
}
catch {
    Write-Host "Health check failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    # Send critical alert
    if ($SendAlert -and $TeamsWebhook) {
        $alertMessage = @{
            "@type"      = "MessageCard"
            "@context"   = "https://schema.org/extensions"
            "summary"    = "EGPB Ticket System Critical Alert"
            "themeColor" = "FF0000"
            "title"      = "🚨 Critical: Application Unreachable"
            "sections"   = @(
                @{
                    "activityTitle"    = "EGPB Ticket Management System"
                    "activitySubtitle" = "Cannot reach health endpoint"
                    "facts"            = @(
                        @{ "name" = "URL"; "value" = $HealthUrl }
                        @{ "name" = "Error"; "value" = $_.Exception.Message }
                    )
                }
            )
        } | ConvertTo-Json -Depth 10
        
        try {
            Invoke-WebRequest -Uri $TeamsWebhook -Method POST -Body $alertMessage -ContentType "application/json" | Out-Null
            Write-Host "Critical alert sent to Teams" -ForegroundColor Yellow
        }
        catch {
            Write-Host "Failed to send alert: $_" -ForegroundColor Red
        }
    }
    
    exit 3
}
