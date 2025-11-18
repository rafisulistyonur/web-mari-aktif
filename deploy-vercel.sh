#!/bin/bash

# Mari Aktif - Automatic Vercel Deployment Script
# This script deploys the app to Vercel with all configurations

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Mari Aktif - Vercel Auto Deploy${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
VERCEL_TOKEN="xIWm1QgG4FV6EM5LXczzfESM"
PROJECT_NAME="web-mari-aktif"
MONGODB_URI="mongodb+srv://user1:mariaktif@mariaktif.vwve87d.mongodb.net/?appName=MariAktif"
SESSION_SECRET="7f3c9e2a1d6b4f8c5e9a2b7d4f6c1a3e8b5d9c2f7a4e6b9d1c3f8a5e7c9b2d4"
JWT_SECRET="a1f8c3e9d2b7f4a6c1e8d3b9f5a7c2e4b6f1d8a3c5e7f9b1d3a6c8e2f4a7b9"
NODE_ENV="production"

echo -e "${YELLOW}Step 1: Checking Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi
echo -e "${GREEN}✓ Vercel CLI ready${NC}"
echo ""

echo -e "${YELLOW}Step 2: Setting Vercel token...${NC}"
export VERCEL_TOKEN="$VERCEL_TOKEN"
echo -e "${GREEN}✓ Token set${NC}"
echo ""

echo -e "${YELLOW}Step 3: Pulling latest code...${NC}"
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"
npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 5: Deploying to Vercel...${NC}"
vercel \
  --token "$VERCEL_TOKEN" \
  --prod \
  --env MONGODB_URI="$MONGODB_URI" \
  --env SESSION_SECRET="$SESSION_SECRET" \
  --env JWT_SECRET="$JWT_SECRET" \
  --env NODE_ENV="$NODE_ENV" \
  --env CORS_ORIGIN="https://${PROJECT_NAME}.vercel.app"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Your app is live at:${NC}"
echo -e "${BLUE}https://${PROJECT_NAME}.vercel.app${NC}"
echo ""
echo -e "${YELLOW}MongoDB connected to:${NC}"
echo -e "${BLUE}${MONGODB_URI:0:60}...${NC}"
echo ""
echo -e "${YELLOW}Useful Vercel Commands:${NC}"
echo "  vercel logs              - View deployment logs"
echo "  vercel env pull          - Pull environment variables"
echo "  vercel undeploy          - Remove deployment"
echo ""
