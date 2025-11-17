#!/bin/bash

# Mari Aktif Deployment Script - User-Level Setup
# This prepares the app without requiring root access
# Root operations must be done separately via Hostinger panel or support

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Mari Aktif - User-Level Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get inputs
read -p "Enter domain name (e.g., mariaktif.com): " DOMAIN
read -p "Enter MongoDB URI: " MONGODB_URI

if [ -z "$DOMAIN" ] || [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}Error: Domain and MongoDB URI are required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "MongoDB: ${MONGODB_URI:0:50}..."
echo ""

# Step 1: Pull latest code
echo -e "${BLUE}[Step 1/6] Pulling latest code from GitHub...${NC}"
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"

# Step 2: Install npm dependencies
echo -e "${BLUE}[Step 2/6] Installing npm dependencies...${NC}"
npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Generate secrets
echo -e "${BLUE}[Step 3/6] Generating security secrets...${NC}"
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}✓ Secrets generated${NC}"

# Step 4: Create .env file
echo -e "${BLUE}[Step 4/6] Creating .env file...${NC}"
cat > .env << EOF
NODE_ENV=production
PORT=3000
MONGODB_URI=$MONGODB_URI
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=https://$DOMAIN
EOF
echo -e "${GREEN}✓ .env file created${NC}"
echo ""
cat .env
echo ""

# Step 5: Install PM2 (user-level with npm)
echo -e "${BLUE}[Step 5/6] Installing PM2...${NC}"
npm install -g pm2
echo -e "${GREEN}✓ PM2 installed${NC}"

# Step 6: Start app with PM2
echo -e "${BLUE}[Step 6/6] Starting application with PM2...${NC}"
pm2 start index.js --name "mari-aktif"
pm2 save
echo -e "${GREEN}✓ App started with PM2${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Application Status:${NC}"
pm2 list
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  pm2 logs           - View application logs"
echo "  pm2 status         - Check status"
echo "  pm2 stop mari-aktif  - Stop app"
echo "  pm2 restart mari-aktif - Restart app"
echo ""
echo -e "${YELLOW}IMPORTANT - Root-Level Tasks (Contact Hostinger Support):${NC}"
echo "1. Install Nginx as reverse proxy to port 3000"
echo "2. Install Certbot and generate SSL cert for $DOMAIN"
echo "3. Configure Nginx to proxy requests to http://localhost:3000"
echo "4. Enable Nginx systemctl service"
echo "5. Point A record to 46.202.186.229 in DNS"
echo ""
