# Test Case-Insensitive Username Validation

Write-Host "Testing Case-Insensitive Username Validation..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testUsername = "TESTUSER999"
$testPassword = "password123"

# Test 1: Create user with uppercase username
Write-Host "Test 1: Creating user '$testUsername'..." -ForegroundColor Yellow
$body1 = @{
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "✅ SUCCESS: User created successfully" -ForegroundColor Green
    Write-Host "   Username: $($response1.data.user.username)" -ForegroundColor Gray
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "❌ FAILED: $($errorBody.error) (Status: $statusCode)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Try to create user with lowercase version
Write-Host "Test 2: Attempting to create user 'testuser999' (lowercase)..." -ForegroundColor Yellow
$body2 = @{
    username = "testuser999"
    password = $testPassword
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $body2 -ContentType "application/json" | Out-Null
    Write-Host "❌ FAILED: User should NOT have been created (validation not working!)" -ForegroundColor Red
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($statusCode -eq 409) {
        Write-Host "✅ SUCCESS: Duplicate detected correctly" -ForegroundColor Green
        Write-Host "   Error: $($errorBody.error)" -ForegroundColor Gray
    }
    else {
        Write-Host "❌ FAILED: Unexpected error (Status: $statusCode)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Try to create user with mixed case
Write-Host "Test 3: Attempting to create user 'TestUser999' (mixed case)..." -ForegroundColor Yellow
$body3 = @{
    username = "TestUser999"
    password = $testPassword
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $body3 -ContentType "application/json" | Out-Null
    Write-Host "❌ FAILED: User should NOT have been created (validation not working!)" -ForegroundColor Red
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($statusCode -eq 409) {
        Write-Host "✅ SUCCESS: Duplicate detected correctly" -ForegroundColor Green
        Write-Host "   Error: $($errorBody.error)" -ForegroundColor Gray
    }
    else {
        Write-Host "❌ FAILED: Unexpected error (Status: $statusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected Results:" -ForegroundColor White
Write-Host "  Test 1: ✅ User created" -ForegroundColor Gray
Write-Host "  Test 2: ✅ Duplicate detected (409 error)" -ForegroundColor Gray
Write-Host "  Test 3: ✅ Duplicate detected (409 error)" -ForegroundColor Gray
