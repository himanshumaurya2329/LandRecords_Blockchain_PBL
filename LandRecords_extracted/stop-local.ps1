$ErrorActionPreference = 'SilentlyContinue'
$root = $PSScriptRoot
$runtime = Join-Path $root 'client\.local\runtime\processes.txt'
if (Test-Path $runtime) {
  foreach ($line in Get-Content -LiteralPath $runtime) {
    if ($line -match '^\d+$') { & taskkill.exe /PID ([int]$line) /T /F | Out-Null }
  }
  Remove-Item -LiteralPath $runtime -Force
}
$compose = Join-Path $root 'fabric-samples\test-network\docker\docker-compose-full.yaml'
if (Get-Command docker -ErrorAction SilentlyContinue) {
  & docker compose -f $compose stop | Out-Null
  & docker stop landrecords-mongodb | Out-Null
}
Write-Host 'Project services stopped. Docker volumes and database data were kept.' -ForegroundColor Green
