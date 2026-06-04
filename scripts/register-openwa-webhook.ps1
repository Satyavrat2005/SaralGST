# Registers / updates OpenWA webhook to point at SaralGST via ngrok.
# Usage: .\scripts\register-openwa-webhook.ps1
# Requires: .env with OPENWA_* and WHATSAPP_WEBHOOK_SECRET; ngrok running on port 3000

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFile)) { throw ".env not found" }

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim()
  }
}

$ngrok = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
$publicUrl = ($ngrok.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
if (-not $publicUrl) { throw "ngrok HTTPS tunnel not found. Run: ngrok http 3000" }

$encodedSecret = [uri]::EscapeDataString($env:WHATSAPP_WEBHOOK_SECRET)
$webhookUrl = "$publicUrl/api/whatsapp/webhook?secret=$encodedSecret"

$base = $env:OPENWA_BASE_URL.TrimEnd('/')
$sessionId = $env:OPENWA_SESSION_ID
$apiKey = $env:OPENWA_API_KEY

$headers = @{ "X-API-Key" = $apiKey; "Content-Type" = "application/json" }
$existing = Invoke-RestMethod -Uri "$base/api/sessions/$sessionId/webhooks" -Headers $headers

$body = @{
  url = $webhookUrl
  events = @("message.received")
  secret = $env:OPENWA_WEBHOOK_SECRET
  active = $true
} | ConvertTo-Json

if ($existing.Count -gt 0) {
  $id = $existing[0].id
  $result = Invoke-RestMethod -Method Put -Uri "$base/api/sessions/$sessionId/webhooks/$id" -Headers $headers -Body $body
  Write-Host "Updated webhook $id"
} else {
  $result = Invoke-RestMethod -Method Post -Uri "$base/api/sessions/$sessionId/webhooks" -Headers $headers -Body $body
  Write-Host "Created webhook $($result.id)"
}

Write-Host "Webhook URL: $webhookUrl"
