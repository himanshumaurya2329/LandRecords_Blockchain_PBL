# PowerShell script to cleanly stop the Land Records network & processes on Windows

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Stopping E-Land Records Network Services" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Stop Fabric Docker containers (keeps ledger data safe)
Write-Host "1. Stopping Fabric Docker containers..." -ForegroundColor Yellow
$containers = @(
  "peer0.org1.example.com",
  "peer0.org2.example.com",
  "peer0.org3.example.com",
  "orderer.example.com",
  "couchdb0", "couchdb1", "couchdb4",
  "ca_org1", "ca_org2", "ca_org3", "ca_orderer"
)

foreach ($c in $containers) {
  docker stop $c 2>$null | Out-Null
}

# Stop any chaincode containers
$devPeers = docker ps -q --filter "name=dev-peer" 2>$null
if ($devPeers) {
  docker stop $devPeers 2>$null | Out-Null
}

Write-Host "✅ Docker containers stopped." -ForegroundColor Green

# 2. Free up Port 3000 (Next.js) & Port 3001 (Fabric API) if running
Write-Host "2. Checking ports 3000 & 3001..." -ForegroundColor Yellow

function Stop-PortProcess($port) {
  $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
  if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
      if ($p -gt 0) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "  -> Killed process $p on port $port" -ForegroundColor Magenta
      }
    }
  }
}

Stop-PortProcess 3000
Stop-PortProcess 3001

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Everything stopped! Your data/ledger is safe." -ForegroundColor Green
Write-Host "   To start again later: run ./start-only.sh" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Cyan
