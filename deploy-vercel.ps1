# Mari Aktif - Vercel Deployment Script (PowerShell)
# Automatic deployment to Vercel with all configurations

$ErrorActionPreference = "Stop"

# Configuration
$VERCEL_TOKEN = "xIWm1QgG4FV6EM5LXczzfESM"
$PROJECT_NAME = "web-mari-aktif"
$MONGODB_URI = "mongodb+srv://user1:mariaktif@mariaktif.vwve87d.mongodb.net/?appName=MariAktif"
$SESSION_SECRET = "7f3c9e2a1d6b4f8c5e9a2b7d4f6c1a3e8b5d9c2f7a4e6b9d1c3f8a5e7c9b2d4"
$JWT_SECRET = "a1f8c3e9d2b7f4a6c1e8d3b9f5a7c2e4b6f1d8a3c5e7f9b1d3a6c8e2f4a7b9"
$NODE_ENV = "production"
$CORS_ORIGIN = "https://$PROJECT_NAME.vercel.app"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "Mari Aktif - Vercel Auto Deploy" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Step 1: Check Vercel CLI
Write-Host "[Step 1] Checking Vercel CLI..." -ForegroundColor Yellow
$vercelCheck = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelCheck) {
    Write-Host "  Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "  ✓ Vercel CLI installed" -ForegroundColor Green
} else {
    Write-Host "  ✓ Vercel CLI found" -ForegroundColor Green
}
Write-Host ""

# Step 2: Set environment variables
Write-Host "[Step 2] Setting environment variables..." -ForegroundColor Yellow
$env:VERCEL_TOKEN = $VERCEL_TOKEN
Write-Host "  ✓ Token configured" -ForegroundColor Green
Write-Host ""

# Step 3: Pull latest code
Write-Host "[Step 3] Pulling latest code..." -ForegroundColor Yellow
git pull origin main | Out-Null
Write-Host "  ✓ Code updated" -ForegroundColor Green
Write-Host ""

# Step 4: Install dependencies
Write-Host "[Step 4] Installing dependencies..." -ForegroundColor Yellow
npm install --production | Out-Null
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy to Vercel
Write-Host "[Step 5] Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "  This may take 2-3 minutes..." -ForegroundColor Gray
Write-Host ""

vercel `
  --token $VERCEL_TOKEN `
  --prod `
  --env MONGODB_URI=$MONGODB_URI `
  --env SESSION_SECRET=$SESSION_SECRET `
  --env JWT_SECRET=$JWT_SECRET `
  --env NODE_ENV=$NODE_ENV `
  --env CORS_ORIGIN=$CORS_ORIGIN `
  --yes

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "https://$PROJECT_NAME.vercel.app" -ForegroundColor Blue
Write-Host ""

Write-Host "Database Connection:" -ForegroundColor Yellow
Write-Host "$($MONGODB_URI.Substring(0, 60))..." -ForegroundColor Blue
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open browser: https://$PROJECT_NAME.vercel.app" -ForegroundColor Gray
Write-Host "2. Check logs: vercel logs https://$PROJECT_NAME.vercel.app" -ForegroundColor Gray
Write-Host "3. View env vars: vercel env pull" -ForegroundColor Gray
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  vercel logs                              - View deployment logs" -ForegroundColor Gray
Write-Host "  vercel env pull                          - Pull environment variables" -ForegroundColor Gray
Write-Host "  vercel undeploy --token xIWm1Q...       - Remove deployment" -ForegroundColor Gray
Write-Host ""
