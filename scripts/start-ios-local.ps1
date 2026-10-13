param(
  [string]$LanAddress = "",
  [int]$BackendPort = 9001,
  [switch]$HttpOnly
)

$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $workspace ".codex-runtime\ios-local"
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null

if (-not $LanAddress) {
  $candidate = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*" -and
      $_.InterfaceAlias -notmatch "Loopback|vEthernet|WSL|Docker"
    } |
    Sort-Object InterfaceMetric |
    Select-Object -First 1
  $LanAddress = $candidate.IPAddress
}

if ($LanAddress -notmatch "^(?:\d{1,3}\.){3}\d{1,3}$") {
  throw "No usable LAN IPv4 address was found. Pass one with -LanAddress."
}

$scheme = if ($HttpOnly) { "http" } else { "https" }
$siteUrl = "${scheme}://${LanAddress}:3000"
$backendUrl = "http://127.0.0.1:$BackendPort"

$backendListener = Get-NetTCPConnection -State Listen -LocalPort $BackendPort -ErrorAction SilentlyContinue
if (-not $backendListener) {
  $backendOut = Join-Path $runtimeDirectory "medusa.out.log"
  $backendErr = Join-Path $runtimeDirectory "medusa.err.log"
  $backend = Start-Process -FilePath "npm.cmd" -ArgumentList @("--prefix", "medusa-backend", "run", "dev", "--", "-H", "127.0.0.1", "-p", "$BackendPort") -WorkingDirectory $workspace -WindowStyle Hidden -RedirectStandardOutput $backendOut -RedirectStandardError $backendErr -PassThru
  Set-Content -LiteralPath (Join-Path $runtimeDirectory "medusa.pid") -Value $backend.Id
}

$deadline = (Get-Date).AddSeconds(60)
do {
  try {
    $health = Invoke-WebRequest -UseBasicParsing -Uri "$backendUrl/health" -TimeoutSec 2
    if ($health.StatusCode -eq 200) { break }
  } catch {}
  Start-Sleep -Milliseconds 500
} while ((Get-Date) -lt $deadline)

if (-not $health -or $health.StatusCode -ne 200) {
  throw "Medusa did not become healthy. Check .codex-runtime/ios-local/medusa.err.log."
}

$existingNext = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue
if ($existingNext) {
  throw "Port 3000 is already in use. Stop the existing Next.js server, then run npm run dev:ios again."
}

$env:MEDUSA_BACKEND_URL = $backendUrl
$env:NEXT_PUBLIC_MEDUSA_BACKEND_URL = "$siteUrl/medusa"
$env:NEXT_PUBLIC_SITE_URL = $siteUrl
$nextOut = Join-Path $runtimeDirectory "next.out.log"
$nextErr = Join-Path $runtimeDirectory "next.err.log"
$nextArgs = @("next", "dev", "-H", "0.0.0.0", "-p", "3000")
if (-not $HttpOnly) { $nextArgs += "--experimental-https" }
$next = Start-Process -FilePath "npx.cmd" -ArgumentList $nextArgs -WorkingDirectory $workspace -WindowStyle Hidden -RedirectStandardOutput $nextOut -RedirectStandardError $nextErr -PassThru
Set-Content -LiteralPath (Join-Path $runtimeDirectory "next.pid") -Value $next.Id

Write-Host "Starting UP N SMOKE for iOS..."
Write-Host "iPhone/iPad URL: $siteUrl/employee/pickups/scan"
Write-Host "Both devices must be on the same local network."
if (-not $HttpOnly) {
  Write-Host "On first visit, accept/trust the local development certificate before allowing camera access."
}
