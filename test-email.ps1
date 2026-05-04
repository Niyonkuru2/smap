# Test email endpoint
$url = "https://smpmps-test-1.onrender.com/admin/debug/test-email"
$body = @{
    testEmail = "josianeuwamahoro55@gmail.com"
} | ConvertTo-Json

Write-Host "Testing email endpoint..."
Write-Host "URL: $url"
Write-Host "Body: $body"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ SUCCESS!"
    Write-Host $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ ERROR:"
    Write-Host $_.Exception.Response.StatusCode
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $responseBody = $streamReader.ReadToEnd()
    Write-Host $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
