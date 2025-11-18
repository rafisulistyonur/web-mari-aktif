#!/bin/bash

###############################################################################
# 🚀 MARI AKTIF HOSTINGER AUTOMATED DEPLOYMENT SCRIPT
# This script automates most of the Hostinger VPS setup
# Run on Hostinger VPS after SSH connection
###############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ STEP: $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "This script must be run as root (use: sudo bash hostinger-deploy.sh)"
    exit 1
fi

###############################################################################
# STEP 1: Update System
###############################################################################
print_step "System Update (apt update && apt upgrade)"

apt update
apt upgrade -y

print_success "System updated"

###############################################################################
# STEP 2: Install Node.js 20
###############################################################################
print_step "Install Node.js 20"

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
apt install -y nodejs

# Verify installation
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

print_success "Node.js installed: $NODE_VERSION"
print_success "npm installed: $NPM_VERSION"

###############################################################################
# STEP 3: Install Git
###############################################################################
print_step "Install Git"

apt install -y git

print_success "Git installed"

###############################################################################
# STEP 4: Clone Repository (if not already cloned)
###############################################################################
print_step "Clone Repository"

REPO_PATH="/home/web-mari-aktif"

if [ -d "$REPO_PATH" ]; then
    print_info "Repository already exists at $REPO_PATH, updating..."
    cd "$REPO_PATH"
    git pull origin main
else
    print_info "Cloning repository to $REPO_PATH..."
    cd /home
    git clone https://github.com/SiswaRey/web-mari-aktif.git
    cd "$REPO_PATH"
fi

print_success "Repository ready at $REPO_PATH"

###############################################################################
# STEP 5: Install Dependencies
###############################################################################
print_step "Install Node Dependencies"

cd "$REPO_PATH"
npm install

print_success "Dependencies installed"

###############################################################################
# STEP 6: Setup .env File
###############################################################################
print_step "Setup Environment Variables (.env)"

if [ -f "$REPO_PATH/.env" ]; then
    print_info ".env file already exists, skipping..."
else
    if [ -f "$REPO_PATH/.env.example" ]; then
        cp "$REPO_PATH/.env.example" "$REPO_PATH/.env"
        print_info "Created .env from .env.example"
        print_info ""
        print_info "⚠️  MANUAL STEP REQUIRED:"
        print_info "Edit $REPO_PATH/.env and update these values:"
        print_info "  • MONGODB_URI (your MongoDB Atlas connection string)"
        print_info "  • CORS_ORIGIN (your domain, e.g., https://yourdomain.com)"
        print_info "  • SESSION_SECRET and JWT_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
        print_info ""
        print_info "Command to edit:"
        print_info "  nano $REPO_PATH/.env"
        echo -e "\n${RED}⏸️  PAUSED: Please edit .env manually, then run this script again!${NC}\n"
        exit 0
    else
        print_error ".env.example not found!"
        exit 1
    fi
fi

print_success ".env file configured"

###############################################################################
# STEP 7: Install PM2 (Global Process Manager)
###############################################################################
print_step "Install PM2 (Process Manager)"

npm install -g pm2

print_success "PM2 installed globally"

###############################################################################
# STEP 8: Start Application with PM2
###############################################################################
print_step "Start Application with PM2"

cd "$REPO_PATH"

# Stop any existing instance
pm2 delete mari-aktif 2>/dev/null || true

# Start new instance
pm2 start index.js --name "mari-aktif"

# Setup PM2 startup
pm2 startup
pm2 save

print_success "Application started with PM2"
pm2 status

###############################################################################
# STEP 9: Install Nginx
###############################################################################
print_step "Install Nginx"

apt install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx

print_success "Nginx installed and started"

###############################################################################
# STEP 10: Install Let's Encrypt (Certbot)
###############################################################################
print_step "Install Let's Encrypt (Certbot)"

apt install -y certbot python3-certbot-nginx

print_success "Certbot installed"

###############################################################################
# STEP 11: Create Nginx Configuration Template
###############################################################################
print_step "Create Nginx Configuration"

NGINX_CONFIG="/etc/nginx/sites-available/default"

# Backup original
cp "$NGINX_CONFIG" "${NGINX_CONFIG}.bak"

# Create template (user needs to update domain name)
cat > "$NGINX_CONFIG" << 'NGINX_TEMPLATE'
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name YOUR_DOMAIN_HERE www.YOUR_DOMAIN_HERE;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name YOUR_DOMAIN_HERE www.YOUR_DOMAIN_HERE;
    
    # SSL Certificates (update domain name)
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN_HERE/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN_HERE/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }
}
NGINX_TEMPLATE

print_info "Nginx configuration created with placeholder"
print_info "⚠️  MANUAL STEP REQUIRED: Replace 'YOUR_DOMAIN_HERE' with your domain"
print_info ""
print_info "Command to edit:"
print_info "  nano $NGINX_CONFIG"
print_info ""
print_info "Then test with: nginx -t"
print_info "And restart with: systemctl restart nginx"

print_success "Nginx configuration template created"

###############################################################################
# SUMMARY
###############################################################################
echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ AUTOMATED SETUP COMPLETE!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

print_info "✓ System updated"
print_info "✓ Node.js 20 installed"
print_info "✓ Git installed"
print_info "✓ Repository cloned"
print_info "✓ Dependencies installed"
print_info "✓ PM2 installed and app running"
print_info "✓ Nginx installed"
print_info "✓ Certbot installed"

echo -e "\n${YELLOW}⚠️  REMAINING MANUAL STEPS:${NC}\n"

echo "1️⃣  Edit .env file:"
echo "   nano $REPO_PATH/.env"
echo "   Update: MONGODB_URI, CORS_ORIGIN, SESSION_SECRET, JWT_SECRET"
echo ""

echo "2️⃣  Edit Nginx configuration:"
echo "   nano $NGINX_CONFIG"
echo "   Replace: YOUR_DOMAIN_HERE with your actual domain"
echo ""

echo "3️⃣  Generate SSL certificate (replace your-domain.com):"
echo "   certbot certonly --standalone -d your-domain.com -d www.your-domain.com"
echo ""

echo "4️⃣  Test and restart Nginx:"
echo "   nginx -t"
echo "   systemctl restart nginx"
echo ""

echo "5️⃣  Enable SSL auto-renewal:"
echo "   systemctl enable certbot.timer"
echo "   systemctl start certbot.timer"
echo ""

echo "6️⃣  At Hostinger Dashboard:"
echo "   Add A record: Your-Domain → 46.202.186.229"
echo ""

echo -e "${GREEN}Application Status:${NC}"
pm2 status
echo ""
echo -e "${GREEN}Nginx Status:${NC}"
systemctl status nginx --no-pager | head -3
echo ""

print_success "Setup script completed! Follow manual steps above to finish deployment."
