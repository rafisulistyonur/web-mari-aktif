#!/usr/bin/env pwsh

###############################################################################
# 🚀 MARI AKTIF - AUTO DEPLOY (Windows PowerShell)
# Run this script from PowerShell to deploy everything automatically
###############################################################################

# Colors
$Green = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Red = [ConsoleColor]::Red
$Cyan = [ConsoleColor]::Cyan

function Write-Banner {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
    Write-Host "║  🚀 MARI AKTIF AUTO DEPLOY - WINDOWS POWERSHELL       ║" -ForegroundColor $Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "───────────────────────────────────────────────────────" -ForegroundColor $Cyan
    Write-Host "✓ $Message" -ForegroundColor $Green
    Write-Host "───────────────────────────────────────────────────────" -ForegroundColor $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Cyan
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

Write-Banner

###############################################################################
# Get Input
###############################################################################
Write-Host "Informasi Hostinger Kamu:" -ForegroundColor $Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "IP Address: 46.202.186.229" -ForegroundColor $Green
Write-Host "Port: 65002" -ForegroundColor $Green
Write-Host "Username: u974484471" -ForegroundColor $Green
Write-Host "Password: K9v!T3qx#P4mZ2@f" -ForegroundColor $Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Write-Host ""
$Domain = Read-Host "🌐 Masukkan domain (contoh: yourdomain.com)"

if ([string]::IsNullOrEmpty($Domain)) {
    Write-Error "Domain tidak boleh kosong!"
    exit 1
}

Write-Success "Domain: $Domain"

Write-Host ""
$MongoDBURI = Read-Host "🗄️  Masukkan MongoDB URI dari MongoDB Atlas"

if ([string]::IsNullOrEmpty($MongoDBURI)) {
    Write-Error "MongoDB URI tidak boleh kosong!"
    exit 1
}

Write-Success "MongoDB URI diterima ✓"

###############################################################################
# Build SSH Command
###############################################################################
Write-Step "Mempersiapkan deployment command"

# Escape domain dan URI untuk bash
$EscapedDomain = $Domain -replace '"', '\"'
$EscapedURI = $MongoDBURI -replace '"', '\"' -replace '\$', '\$'

# SSH Command
$SSHCommand = @"
cd /root && \
rm -rf web-mari-aktif && \
git clone https://github.com/SiswaRey/web-mari-aktif.git && \
cd web-mari-aktif && \
chmod +x hostinger-complete-auto.sh && \
echo "$EscapedDomain" | sudo bash hostinger-complete-auto.sh << 'EOF'
$EscapedDomain
$EscapedURI
EOF
"@

Write-Info "SSH Command siap untuk dijalankan"

###############################################################################
# Connect SSH dan Run
###############################################################################
Write-Step "Connect ke Hostinger dan jalankan deployment"

Write-Host "Command yang dijalankan:" -ForegroundColor $Yellow
Write-Host $SSHCommand -ForegroundColor $Cyan
Write-Host ""

# Run SSH with command
Write-Info "Connecting ke server... (mungkin minta password)"
Write-Host ""

# Try with timeout dan error handling
try {
    $proc = Start-Process -FilePath ssh `
        -ArgumentList "-p", "65002", "u974484471@46.202.186.229", $SSHCommand `
        -PassThru `
        -NoNewWindow
    
    $proc.WaitForExit()
    
    if ($proc.ExitCode -eq 0) {
        Write-Success "Deployment selesai!"
    } else {
        Write-Error "Deployment gagal dengan exit code: $($proc.ExitCode)"
    }
}
catch {
    Write-Error "Error: $_"
    exit 1
}

###############################################################################
# Summary
###############################################################################
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║  ✅ DEPLOYMENT COMPLETE!                             ║" -ForegroundColor $Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""

Write-Host "📋 Langkah terakhir:" -ForegroundColor $Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "1. Buka Hostinger Dashboard: https://hostinger.com/cp"
Write-Host "2. Go to Domains → $Domain → DNS Settings"
Write-Host "3. Add A Record:"
Write-Host "   • Name: @"
Write-Host "   • Value: 46.202.186.229"
Write-Host "   • TTL: 3600"
Write-Host "4. Save & wait 10-30 minutes untuk DNS propagation"
Write-Host ""
Write-Host "5. Setelah DNS ready, buka: https://$Domain"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

Write-Host "✨ Mari Aktif siap live! 🚀" -ForegroundColor $Green
Write-Host ""
