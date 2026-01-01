# PowerShell script to test API endpoints
$BASE_URL = "https://einen-backend-430199503919.asia-south1.run.app"

Write-Host "Testing API Endpoints" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "Base URL: $BASE_URL" -ForegroundColor Yellow
Write-Host ""

# Test 1: Login
Write-Host "1. Testing Login endpoint (POST /login)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"email":"test@example.com","password":"test123"}' `
        -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: List Messages
Write-Host "2. Testing List Messages endpoint (POST /list-messages)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/list-messages" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"page":1,"limit":10}' `
        -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Alarm Details
Write-Host "3. Testing Alarm Details endpoint (POST /buildings/alarm-details)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/buildings/alarm-details" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"community":"","building":""}' `
        -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: All Buildings
Write-Host "4. Testing All Buildings endpoint (GET /building/all)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/building/all" `
        -Method GET `
        -Headers @{"Content-Type"="application/json"} `
        -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: All Communities
Write-Host "5. Testing All Communities endpoint (GET /community/all)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/community/all" `
        -Method GET `
        -Headers @{"Content-Type"="application/json"} `
        -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "====================" -ForegroundColor Cyan
Write-Host "Tests Complete" -ForegroundColor Cyan


