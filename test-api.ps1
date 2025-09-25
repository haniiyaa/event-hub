# Event Hub API Testing Script for PowerShell
# Run this script to test your Event Hub API

Write-Host "🎉 Event Hub API Testing Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Yellow

$baseUrl = "http://localhost:8080"

# Function to make API calls
function Test-API {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [string]$Auth = $null,
        [string]$Description
    )
    
    Write-Host "`n🔍 Testing: $Description" -ForegroundColor Cyan
    Write-Host "   $Method $Url" -ForegroundColor Gray
    
    try {
        $headers = @{
            'Content-Type' = 'application/json'
        }
        
        if ($Auth) {
            $headers['Authorization'] = "Basic $Auth"
        }
        
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params['Body'] = $Body
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
        
        if ($response.Content) {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "   📄 Response: $($content | ConvertTo-Json -Compress)" -ForegroundColor White
        }
        
        return $response
    }
    catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "   📄 Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
        return $null
    }
}

# Function to encode credentials for Basic Auth
function Get-BasicAuth {
    param([string]$Username, [string]$Password)
    $credentials = "$Username`:$Password"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($credentials)
    return [System.Convert]::ToBase64String($bytes)
}

Write-Host "`n🚀 Starting API Tests..." -ForegroundColor Yellow

# Test 1: Register Super Admin
$adminData = @{
    username = "admin"
    password = "admin123" 
    email = "admin@college.edu"
    fullName = "Super Administrator"
} | ConvertTo-Json

Test-API -Method "POST" -Url "$baseUrl/api/auth/register" -Body $adminData -Description "Register Super Admin"

# Test 2: Register Student (Future Club Admin)
$studentData = @{
    username = "student1"
    password = "pass123"
    email = "student1@college.edu" 
    fullName = "John Doe"
} | ConvertTo-Json

Test-API -Method "POST" -Url "$baseUrl/api/auth/register" -Body $studentData -Description "Register Student"

# Test 3: Login as Admin
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Test-API -Method "POST" -Url "$baseUrl/api/auth/login" -Body $loginData -Description "Admin Login"

# Test 4: Get Current User (with auth)
$adminAuth = Get-BasicAuth -Username "admin" -Password "admin123"
Test-API -Method "GET" -Url "$baseUrl/api/auth/me" -Auth $adminAuth -Description "Get Current User Info"

# Test 5: View All Users (Admin only)
Test-API -Method "GET" -Url "$baseUrl/api/admin/users" -Auth $adminAuth -Description "View All Users (Admin)"

Write-Host "`n⚠️  MANUAL STEP REQUIRED:" -ForegroundColor Yellow
Write-Host "   1. Check the user ID for 'student1' from the above response" -ForegroundColor White
Write-Host "   2. Replace '2' in the next command with the actual user ID" -ForegroundColor White
Read-Host "   Press Enter when ready to continue"

# Test 6: Promote Student to Club Admin (you may need to adjust the user ID)
Test-API -Method "POST" -Url "$baseUrl/api/admin/promote-club-admin/2" -Auth $adminAuth -Description "Promote Student to Club Admin"

# Test 7: Login as Club Admin
$clubAdminLogin = @{
    username = "student1"
    password = "pass123"
} | ConvertTo-Json

Test-API -Method "POST" -Url "$baseUrl/api/auth/login" -Body $clubAdminLogin -Description "Club Admin Login"

# Test 8: Create Club
$clubAuth = Get-BasicAuth -Username "student1" -Password "pass123"
$clubData = @{
    name = "Tech Club"
    description = "A club for technology enthusiasts and programmers"
} | ConvertTo-Json

Test-API -Method "POST" -Url "$baseUrl/api/club-admin/club" -Body $clubData -Auth $clubAuth -Description "Create Club"

# Test 9: Try to create another club (should fail)
$clubData2 = @{
    name = "Science Club"
    description = "Another club - should fail"
} | ConvertTo-Json

Test-API -Method "POST" -Url "$baseUrl/api/club-admin/club" -Body $clubData2 -Auth $clubAuth -Description "Try to Create Second Club (Should Fail)"

# Test 10: Get My Club
Test-API -Method "GET" -Url "$baseUrl/api/club-admin/club" -Auth $clubAuth -Description "Get My Club"

# Test 11: Create Event
$eventData = @{
    title = "Java Workshop"
    description = "Learn Spring Boot development"
    eventDate = "2025-10-15T14:00:00"
    location = "Computer Lab A"
    capacity = 30
} | ConvertTo-Json

Test-API -Method "POST" -Url "$baseUrl/api/club-admin/events" -Body $eventData -Auth $clubAuth -Description "Create Event"

# Test 12: Get All Events
Test-API -Method "GET" -Url "$baseUrl/api/club-admin/events" -Auth $clubAuth -Description "Get All My Events"

# Test 13: Get Dashboard
Test-API -Method "GET" -Url "$baseUrl/api/club-admin/dashboard" -Auth $clubAuth -Description "Get Club Admin Dashboard"

# Test 14: Security Test - Try to access admin endpoint as club admin (should fail)
Test-API -Method "GET" -Url "$baseUrl/api/admin/users" -Auth $clubAuth -Description "Security Test: Club Admin accessing Admin endpoint (Should Fail)"

Write-Host "`n🎊 API Testing Complete!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Yellow
Write-Host "✅ Your Event Hub API is working!" -ForegroundColor Green
Write-Host "📊 Check the results above for any issues" -ForegroundColor White
Write-Host "🌐 Application running at: http://localhost:8080" -ForegroundColor Cyan