#!/bin/bash

# Mari Aktif Deployment Script for Regular User Account
# This script deploys to Hostinger VPS using regular user with su escalation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Mari Aktif - Hostinger Auto Deployment${NC}"
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

# Step 1: Update system packages (with su)
echo -e "${BLUE}[Step 1/12] Updating system packages...${NC}"
echo "K9v!T3qx#P4mZ2@f" | su -c "apt update && apt upgrade -y"

# Step 2: Install Node.js 20
echo -e "${BLUE}[Step 2/12] Installing Node.js 20...${NC}"
echo "K9v!T3qx#P4mZ2@f" | su -c "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs"

# Step 3: Install Git (if not already installed)
echo -e "${BLUE}[Step 3/12] Installing Git...${NC}"
echo "K9v!T3qx#P4mZ2@f" | su -c "apt install -y git"

# Step 4: Clone repository
echo -e "${BLUE}[Step 4/12] Cloning repository...${NC}"
if [ ! -d "web-mari-aktif" ]; then
    git clone https://github.com/SiswaRey/web-mari-aktif.git
fi
cd web-mari-aktif

# Step 5: Install npm dependencies
echo -e "${BLUE}[Step 5/12] Installing npm dependencies...${NC}"
npm install --production

# Step 6: Generate secrets if needed
echo -e "${BLUE}[Step 6/12] Generating security secrets...${NC}"
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# Step 7: Create .env file
echo -e "${BLUE}[Step 7/12] Creating .env file...${NC}"
cat > .env << EOF
NODE_ENV=production
PORT=3000
MONGODB_URI=$MONGODB_URI
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=https://$DOMAIN
EOF
echo -e "${GREEN}✓ .env created${NC}"

# Step 8: Install PM2 globally
echo -e "${BLUE}[Step 8/12] Installing PM2 process manager...${NC}"
echo "K9v!T3qx#P4mZ2@f" | su -c "npm install -g pm2"

# Step 9: Start application with PM2
echo -e "${BLUE}[Step 9/12] Starting application with PM2...${NC}"
echo "K9v!T3qx#P4mZ2@f" | su -c "pm2 start index.js --name 'mari-aktif' && pm2 startup && pm2 save"

# Step 10: Install Nginx and Certbot
echo -e "${BLUE}[Step 10/12] Installing Nginx and Certbot...${NC}"
echo "K9v!T3qx#P4mZ2@f" | su -c "apt install -y nginx certbot python3-certbot-nginx"

# Step 11: Generate SSL certificate
echo -e "${BLUE}[Step 11/12] Generating SSL certificate...${NC}"
echo "K9v!T3qx#P4mZ2@f" | su -c "certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN"

# Step 12: Configure Nginx
echo -e "${BLUE}[Step 12/12] Configuring Nginx...${NC}"
cat > nginx.conf << EOF
upstream app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
EOF

echo "K9v!T3qx#P4mZ2@f" | su -c "cp nginx.conf /etc/nginx/sites-available/$DOMAIN && ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN && nginx -t && systemctl restart nginx"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Point your domain A record to: 46.202.186.229"
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "3. Access your app at: https://$DOMAIN"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  pm2 logs             - View application logs"
echo "  pm2 status           - Check PM2 status"
echo "  systemctl status nginx - Check Nginx status"
echo ""
