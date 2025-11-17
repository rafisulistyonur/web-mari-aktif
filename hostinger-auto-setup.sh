#!/bin/bash

###############################################################################
# 🚀 MARI AKTIF - HOSTINGER AUTO SETUP (ALL IN ONE)
# Run this script once after SSH to Hostinger
# Everything runs automatically!
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} 🚀 $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"
}

print_step() {
    echo -e "${GREEN}✓ STEP: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check root
if [ "$EUID" -ne 0 ]; then 
    print_error "Harus run sebagai root! Gunakan: sudo bash hostinger-auto-setup.sh"
    exit 1
fi

print_header "MARI AKTIF AUTO SETUP MULAI"

###############################################################################
# STEP 1: System Update
###############################################################################
print_step "Update System (apt update & upgrade)"
apt update > /dev/null 2>&1
apt upgrade -y > /dev/null 2>&1
print_success "System updated"

###############################################################################
# STEP 2: Install Node.js 20
###############################################################################
print_step "Install Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
apt install -y nodejs > /dev/null 2>&1
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
print_success "Node.js installed: $NODE_VERSION, npm: $NPM_VERSION"

###############################################################################
# STEP 3: Install Git
###############################################################################
print_step "Install Git"
apt install -y git > /dev/null 2>&1
print_success "Git installed"

###############################################################################
# STEP 4: Clone Repository
###############################################################################
print_step "Clone Repository"
REPO_PATH="/home/web-mari-aktif"

if [ -d "$REPO_PATH" ]; then
    print_info "Repository sudah ada, update code..."
    cd "$REPO_PATH"
    git pull origin main > /dev/null 2>&1
else
    print_info "Clone repository baru..."
    cd /home
    git clone https://github.com/SiswaRey/web-mari-aktif.git > /dev/null 2>&1
fi

print_success "Repository ready: $REPO_PATH"

###############################################################################
# STEP 5: Install Dependencies
###############################################################################
print_step "Install npm dependencies"
cd "$REPO_PATH"
npm install > /dev/null 2>&1
print_success "Dependencies installed"

###############################################################################
# STEP 6: Create .env from template
###############################################################################
print_step "Setup .env file"
if [ ! -f "$REPO_PATH/.env" ]; then
    if [ -f "$REPO_PATH/.env.example" ]; then
        cp "$REPO_PATH/.env.example" "$REPO_PATH/.env"
        print_success ".env created from template"
    else
        print_error ".env.example tidak ditemukan!"
        exit 1
    fi
else
    print_info ".env sudah ada, skip..."
fi

###############################################################################
# STEP 7: Install PM2 Global
###############################################################################
print_step "Install PM2 (Process Manager)"
npm install -g pm2 > /dev/null 2>&1
print_success "PM2 installed"

###############################################################################
# STEP 8: Start App with PM2
###############################################################################
print_step "Start aplikasi dengan PM2"
cd "$REPO_PATH"
pm2 delete mari-aktif 2>/dev/null || true
pm2 start index.js --name "mari-aktif" > /dev/null 2>&1
pm2 startup > /dev/null 2>&1
pm2 save > /dev/null 2>&1
print_success "Aplikasi running dengan PM2"

###############################################################################
# STEP 9: Install Nginx
###############################################################################
print_step "Install Nginx"
apt install -y nginx > /dev/null 2>&1
systemctl start nginx > /dev/null 2>&1
systemctl enable nginx > /dev/null 2>&1
print_success "Nginx installed & running"

###############################################################################
# STEP 10: Install Certbot
###############################################################################
print_step "Install Let's Encrypt (Certbot)"
apt install -y certbot python3-certbot-nginx > /dev/null 2>&1
print_success "Certbot installed"

###############################################################################
# STEP 11: Create Nginx config template
###############################################################################
print_step "Setup Nginx configuration"
NGINX_CONFIG="/etc/nginx/sites-available/default"
cp "$NGINX_CONFIG" "${NGINX_CONFIG}.bak" 2>/dev/null || true

cat > "$NGINX_CONFIG" << 'EOF'
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
    
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN_HERE/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN_HERE/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
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
EOF

print_success "Nginx config template created"

###############################################################################
# SUMMARY & NEXT STEPS
###############################################################################
print_header "✅ AUTOMATED SETUP COMPLETE!"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ System updated${NC}"
echo -e "${GREEN}✓ Node.js 20 installed${NC}"
echo -e "${GREEN}✓ Git & repository cloned${NC}"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo -e "${GREEN}✓ PM2 started aplikasi${NC}"
echo -e "${GREEN}✓ Nginx installed${NC}"
echo -e "${GREEN}✓ Certbot installed${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}📋 LANGKAH SELANJUTNYA (MANUAL):${NC}\n"

echo "1️⃣  EDIT .env FILE"
echo "    Command: nano $REPO_PATH/.env"
echo "    Isi nilai:"
echo "    • MONGODB_URI = connection string dari MongoDB Atlas"
echo "    • CORS_ORIGIN = https://yourdomain.com"
echo "    • SESSION_SECRET & JWT_SECRET = sudah auto-generate"
echo ""

echo "2️⃣  EDIT NGINX CONFIG (ganti domain)"
echo "    Command: nano $NGINX_CONFIG"
echo "    Ganti: YOUR_DOMAIN_HERE → yourdomain.com"
echo ""

echo "3️⃣  GENERATE SSL CERTIFICATE"
echo "    Command: certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com"
echo ""

echo "4️⃣  TEST & RESTART NGINX"
echo "    Commands:"
echo "    • nginx -t          (verify config)"
echo "    • systemctl restart nginx"
echo ""

echo "5️⃣  ENABLE SSL AUTO-RENEW"
echo "    Commands:"
echo "    • systemctl enable certbot.timer"
echo "    • systemctl start certbot.timer"
echo ""

echo "6️⃣  POINT DOMAIN AT HOSTINGER DASHBOARD"
echo "    A Record: yourdomain.com → 46.202.186.229"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📊 CURRENT STATUS:${NC}"
echo ""
pm2 status
echo ""
echo -e "${GREEN}Nginx Status:${NC}"
systemctl status nginx --no-pager | head -3
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${GREEN}✅ Setup otomatis selesai!${NC}"
echo -e "${YELLOW}Sekarang tinggal ikuti 6 langkah manual di atas.${NC}\n"
