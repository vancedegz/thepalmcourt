#requires -Version 5.1
<#
  Deploy Pickleball Courts app to Virtualmin
  Usage: .\deploy.ps1 -Host "your-server.com" -User "youruser" -Path "/home/youruser/pickleball-courts"
#>
param(
  [Parameter(Mandatory=$true)]
  [string]$Host,
  [Parameter(Mandatory=$true)]
  [string]$User,
  [Parameter(Mandatory=$true)]
  [string]$RemotePath,
  [string]$Key = "~/.ssh/id_rsa"
)

$ErrorActionPreference = "Stop"
Write-Host "=== Pickleball Courts Deployment ===" -ForegroundColor Cyan

# Build
Write-Host "`n[1/4] Building Next.js standalone..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# Prisma generate
Write-Host "`n[2/4] Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) { throw "Prisma generate failed" }

# Sync files via SSH/rsync (requires rsync in PATH or WSL)
Write-Host "`n[3/4] Syncing files to server..." -ForegroundColor Yellow
$rsync = Get-Command rsync -ErrorAction SilentlyContinue
if (-not $rsync) {
  Write-Host "rsync not found. Trying scp fallback..." -ForegroundColor Yellow
  # Fallback: use scp recursively via tar
  $tarPath = ".\deploy-temp.tar.gz"
  tar -czf $tarPath .
  scp -i $Key $tarPath "${User}@${Host}:${RemotePath}/deploy-temp.tar.gz"
  ssh -i $Key "${User}@${Host}" "cd $RemotePath && tar -xzf deploy-temp.tar.gz && rm deploy-temp.tar.gz"
  Remove-Item $tarPath
} else {
  # Use rsync for efficient sync
  $excludeArgs = @(
    "--exclude=.env",
    "--exclude=.git",
    "--exclude=.github",
    "--exclude=.next/cache",
    "--exclude=node_modules/.cache",
    "--exclude=deploy.ps1",
    "--exclude=deploy-temp.tar.gz"
  )
  & rsync -avz -e "ssh -i $Key" $excludeArgs . "${User}@${Host}:${RemotePath}/"
  if ($LASTEXITCODE -ne 0) { throw "rsync failed" }
}

# Run remote commands
Write-Host "`n[4/4] Running remote setup..." -ForegroundColor Yellow
$remoteScript = @"
cd $RemotePath
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
[ -s "\$NVM_DIR/bash_completion" ] && \. "\$NVM_DIR/bash_completion"
npm install --production
npx prisma generate
npx prisma migrate deploy
mkdir -p logs
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save
"@

ssh -i $Key "${User}@${Host}" $remoteScript
if ($LASTEXITCODE -ne 0) { throw "Remote setup failed" }

Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "App running at: http://${Host}:3000" -ForegroundColor Cyan
