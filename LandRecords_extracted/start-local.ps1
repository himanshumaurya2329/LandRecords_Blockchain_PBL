$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = $PSScriptRoot
$client = Join-Path $root 'client'
$compose = Join-Path $root 'fabric-samples\test-network\docker\docker-compose-full.yaml'
$runtime = Join-Path $client '.local\runtime'
$logs = Join-Path $client '.local\logs'
New-Item -ItemType Directory -Force -Path $runtime, $logs | Out-Null

function Test-Port([int]$Port) {
  $tcpClient = [Net.Sockets.TcpClient]::new()
  try { $tcpClient.Connect('127.0.0.1', $Port); return $true } catch { return $false } finally { $tcpClient.Dispose() }
}
function Wait-Port([int]$Port, [int]$TimeoutSeconds, [string]$Name) {
  $until = (Get-Date).AddSeconds($TimeoutSeconds)
  while (-not (Test-Port $Port) -and (Get-Date) -lt $until) { Start-Sleep -Seconds 2 }
  if (-not (Test-Port $Port)) { Write-Warning "$Name did not start yet. Check client/.local/logs." }
}
function Start-LocalProcess([string]$Name, [string]$Executable, [string[]]$Arguments, [string]$WorkingDirectory) {
  $port = switch ($Name) { 'Laya' { 8765 } 'Fabric API' { 3001 } 'Web app' { 3000 } }
  if (Test-Port $port) { Write-Host "$Name already responds on port $port."; return }
  $logName = $Name.Replace(' ', '-').ToLower()
  $outLog = Join-Path $logs "$logName.out.log"
  $errLog = Join-Path $logs "$logName.err.log"
  $process = Start-Process -FilePath $Executable -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
  Add-Content -LiteralPath (Join-Path $runtime 'processes.txt') -Value $process.Id
  Write-Host "Starting $Name..."
  Wait-Port $port 90 $Name
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker is missing. Run .\install.ps1 first.' }
& cmd.exe /c 'docker info >nul 2>nul'
if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop, wait for it to be ready, then run .\start-local.ps1 again.' }
if (-not (Test-Path $compose)) { throw 'Fabric compose file not found. Run .\install.ps1 first.' }

Write-Host 'Starting Hyperledger Fabric...' -ForegroundColor Cyan
& docker compose -f $compose up -d
if ($LASTEXITCODE -ne 0) { throw 'Fabric did not start. Check Docker Desktop and the Fabric logs.' }

$envFile = Join-Path $client '.env.local'
$mongoUriLine = (Select-String -Path $envFile -Pattern '^MONGODB_URI=' -ErrorAction SilentlyContinue | Select-Object -First 1).Line
if ($mongoUriLine -match 'mongodb://(localhost|127\.0\.0\.1):27017') {
  $mongoExists = (& docker ps -a --filter 'name=^landrecords-mongodb$' --format '{{.Names}}') -contains 'landrecords-mongodb'
  if (-not $mongoExists) {
    Write-Host 'Starting local MongoDB...' -ForegroundColor Cyan
    & docker run -d --name landrecords-mongodb --restart unless-stopped -p 27017:27017 -v landrecords_mongodb:/data/db mongo:7
    if ($LASTEXITCODE -ne 0) { throw 'Could not start local MongoDB.' }
  } else {
    & docker start landrecords-mongodb | Out-Null
  }
}

if (-not (Test-Path (Join-Path $client 'ai-service\.venv\Scripts\python.exe'))) { throw 'Laya is not installed. Run .\install.ps1 first.' }
$python = Join-Path $client 'ai-service\.venv\Scripts\python.exe'
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npm) { $npm = (Get-Command npm).Source }
Start-LocalProcess 'Laya' $python @('-u', 'ai-service\server.py') $client
Start-LocalProcess 'Fabric API' $npm @('start') (Join-Path $root 'fabric-api')
Start-LocalProcess 'Web app' $npm @('run', 'dev') $client

Write-Host ''
Write-Host 'Everything is running:' -ForegroundColor Green
Write-Host '  Web app:    http://localhost:3000'
Write-Host '  Fabric API: http://localhost:3001/health'
Write-Host '  Laya:       http://127.0.0.1:8765/health'
Write-Host "Logs: $logs"
Write-Host 'Stop with .\stop-local.ps1. This script does not open a browser.'


