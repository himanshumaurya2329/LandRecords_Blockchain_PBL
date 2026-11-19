$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = $PSScriptRoot

function Refresh-Path {
  $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $user = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$machine;$user"
}

function Install-WingetPackage([string]$Id) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "winget is required to install missing tools. Install $Id, then rerun install.ps1."
  }
  Write-Host "Installing $Id..." -ForegroundColor Cyan
  & winget install --id $Id --exact --accept-package-agreements --accept-source-agreements --silent
  if ($LASTEXITCODE -ne 0) { throw "winget could not install $Id (exit $LASTEXITCODE). Install it manually, then rerun." }
  Refresh-Path
}

function Ensure-Command([string]$Name, [string]$PackageId) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { Install-WingetPackage $PackageId }
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { throw "$Name was installed. Restart PowerShell and run install.ps1 again." }
}

Write-Host 'Land Records: installing project dependencies' -ForegroundColor Green
Ensure-Command 'node' 'OpenJS.NodeJS.LTS'
Ensure-Command 'npm' 'OpenJS.NodeJS.LTS'
Ensure-Command 'python' 'Python.Python.3.12'
Ensure-Command 'docker' 'Docker.DockerDesktop'
Ensure-Command 'bash' 'Git.Git'

$nodeVersion = [version]((& node --version).TrimStart('v'))
if ($nodeVersion -lt [version]'20.9') { throw "Node.js 20.9 or newer is required; found $nodeVersion." }
$pythonVersion = (& python -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")').Trim()
if ([version]$pythonVersion -lt [version]'3.12') { throw "Python 3.12 or newer is required; found $pythonVersion." }

if (-not (Test-Path (Join-Path $root 'client\.env.local'))) {
  @"
MONGODB_URI=mongodb://127.0.0.1:27017/elandrecords
NEXT_PUBLIC_FABRIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
# Pinata and SMTP are optional for local development.
"@ | Set-Content -LiteralPath (Join-Path $root 'client\.env.local') -Encoding utf8
  Write-Host 'Created client/.env.local with local MongoDB defaults.' -ForegroundColor Yellow
}
if (-not (Test-Path (Join-Path $root 'fabric-api\.env'))) {
  Copy-Item -LiteralPath (Join-Path $root 'fabric-api\.env.example') -Destination (Join-Path $root 'fabric-api\.env')
  Write-Host 'Created fabric-api/.env from its template.' -ForegroundColor Yellow
}

$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npm) { $npm = (Get-Command npm).Source }
foreach ($folder in @('fabric-api', 'chaincode/land-registration', 'client')) {
  Write-Host "Installing Node dependencies: $folder" -ForegroundColor Cyan
  Push-Location (Join-Path $root $folder)
  try {
    & $npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed in $folder (exit $LASTEXITCODE)." }
  } finally { Pop-Location }
}

$client = Join-Path $root 'client'
$venvPython = Join-Path $client 'ai-service\.venv\Scripts\python.exe'
if (-not (Test-Path $venvPython)) {
  Write-Host 'Creating the isolated Laya Python environment...' -ForegroundColor Cyan
  & python -m venv (Join-Path $client 'ai-service\.venv')
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the Laya virtual environment.' }
}
$venvPython = Join-Path $client 'ai-service\.venv\Scripts\python.exe'
Write-Host 'Installing local Laya and PDF dependencies...' -ForegroundColor Cyan
& $venvPython -m pip install -r (Join-Path $client 'ai-service\requirements.txt') --extra-index-url https://download.pytorch.org/whl/cpu
if ($LASTEXITCODE -ne 0) { throw 'Laya dependency installation failed.' }
Write-Host 'Downloading the pinned Laya System 1 checkpoint (about 843 MB)...' -ForegroundColor Cyan
& $venvPython -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='convaiinnovations/laya-typed-decisions', revision='1a793eb568e6718f15941d08f85432581df534e3')"
if ($LASTEXITCODE -ne 0) { throw 'Laya model download failed. Rerun install.ps1 after checking the network connection.' }

$fabricTools = @('peer.exe', 'cryptogen.exe', 'configtxgen.exe', 'osnadmin.exe')
$missingFabricTools = $fabricTools | Where-Object { -not (Test-Path (Join-Path $root "fabric-samples\bin\$_")) }
if ($missingFabricTools.Count -gt 0) {
  Write-Host 'Installing the Fabric 2.5 command-line tools...' -ForegroundColor Cyan
  $fabricInstaller = Join-Path $env:TEMP 'landrecords-install-fabric.sh'
  Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh' -OutFile $fabricInstaller
  & bash -c 'cd "$(cygpath -u "$1")"; bash "$(cygpath -u "$2")" --fabric-version 2.5.16 --ca-version 1.5.17 binary' _ $root $fabricInstaller
  if ($LASTEXITCODE -ne 0) { throw 'Hyperledger Fabric tool installation failed.' }
}

& docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  $desktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
  if (Test-Path $desktop) {
    Write-Host 'Starting Docker Desktop; wait for it to finish starting...' -ForegroundColor Cyan
    Start-Process -FilePath $desktop
    $deadline = (Get-Date).AddMinutes(3)
    do {
      Start-Sleep -Seconds 5
      & docker info 2>$null | Out-Null
    } while ($LASTEXITCODE -ne 0 -and (Get-Date) -lt $deadline)
  }
}
if ($LASTEXITCODE -ne 0) { throw 'Docker is installed but not ready. Open Docker Desktop, wait for it to start, then rerun install.ps1.' }

# A new network is initialized only when there are no project containers,
# network, or persistent peer/orderer volumes. Existing ledgers are preserved.
$containers = @(& docker ps -a --format '{{.Names}}')
$volumes = @(& docker volume ls --format '{{.Name}}')
$networks = @(& docker network ls --filter name=fabric_test --format '{{.Name}}')
$hasFabricState = ($containers | Where-Object { $_ -match '^(peer0\.org[123]\.example\.com|orderer[23]?\.example\.com|ca_org[123])$' }).Count -gt 0 -or
  ($volumes | Where-Object { $_ -match '(peer0\.org[123]\.example\.com|orderer[23]?\.example\.com)' }).Count -gt 0 -or
  ($networks | Where-Object { $_ -eq 'fabric_test' }).Count -gt 0

if (-not $hasFabricState) {
  Write-Host 'No saved Fabric ledger was found. Initializing the project network once...' -ForegroundColor Cyan
  $compatDir = Join-Path $env:TEMP 'landrecords-docker-compose'
  New-Item -ItemType Directory -Force -Path $compatDir | Out-Null
  $wrapper = Join-Path $compatDir 'docker-compose'
  $wrapperText = '#!/usr/bin/env bash' + "`n" + 'exec docker compose "$@"' + "`n"
  [IO.File]::WriteAllText($wrapper, $wrapperText, [Text.UTF8Encoding]::new($false))
  $setupScript = Join-Path $root 'setup-network.sh'
  & bash -c 'chmod +x "$1"; repo="$(cygpath -u "$2")"; export PATH="$(dirname "$1"):$repo/fabric-samples/bin:$PATH"; cd "$repo"; bash setup-network.sh' _ $wrapper $root
  if ($LASTEXITCODE -ne 0) { throw 'Fabric network setup failed. See the message above and rerun install.ps1 after fixing the issue.' }
} else {
  Write-Host 'Existing Fabric containers or ledger volumes found; keeping them unchanged.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Install complete.' -ForegroundColor Green
Write-Host 'Next: run .\start-local.ps1 to start MongoDB (if configured locally), Fabric, Laya, the API, and the web app.' -ForegroundColor Green
