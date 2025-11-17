#!/bin/bash

###############################################################################
# 🚀 MARI AKTIF - COMPLETE AUTO SETUP (100% OTOMATIS)
# Run this ONCE after SSH to Hostinger
# Input: Domain name
# Output: Live HTTPS app ready!
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_banner() {
    echo -e "\n${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  🚀 MARI AKTIF - AUTO SETUP 100% OTOMATIS             ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}\n"
}

print_step() {
    echo -e "\n${BLUE}───────────────────────────────────────────────────────${NC}"
    echo -e "${GREEN}✓ $1${NC}"
    echo -e "${BLUE}───────────────────────────────────────────────────────${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check root
if [ "$EUID" -ne 0 ]; then 
    print_error "Harus run sebagai root! Gunakan: sudo bash hostinger-complete-auto.sh"
    exit 1
fi

print_banner

###############################################################################
# INPUT: Domain Name
###############################################################################
read -p "🌐 Masukkan domain (contoh: yourdomain.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    print_error "Domain tidak boleh kosong!"
    exit 1
fi

print_info "Domain yang diinput: $DOMAIN"

###############################################################################
# INPUT: MongoDB URI
###############################################################################
echo ""
read -p "🗄️  Masukkan MongoDB URI (dari MongoDB Atlas): " MONGODB_URI

if [ -z "$MONGODB_URI" ]; then
    print_error "MongoDB URI tidak boleh kosong!"
    exit 1
fi

print_info "MongoDB URI diterima ✓"

###############################################################################
# STEP 1: System Update
###############################################################################
print_step "1/12 - Update System"
apt update > /dev/null 2>&1
apt upgrade -y > /dev/null 2>&1
print_success "System updated"

###############################################################################
# STEP 2: Install Node.js 20
###############################################################################
print_step "2/12 - Install Node.js 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
apt install -y nodejs > /dev/null 2>&1
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
print_success "Node.js $NODE_VERSION installed, npm $NPM_VERSION"

###############################################################################
# STEP 3: Install Git
###############################################################################
print_step "3/12 - Install Git"
apt install -y git > /dev/null 2>&1
print_success "Git installed"

###############################################################################
# STEP 4: Clone Repository
###############################################################################
print_step "4/12 - Clone Repository"
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
print_step "5/12 - Install npm Dependencies"
cd "$REPO_PATH"
npm install > /dev/null 2>&1
print_success "Dependencies installed"

###############################################################################
# STEP 6: Generate Secrets
###############################################################################
print_step "6/12 - Generate Secrets (SESSION & JWT)"
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
print_success "Secrets generated"

###############################################################################
# STEP 7: Create .env file
###############################################################################
print_step "7/12 - Setup .env Configuration"

cat > "$REPO_PATH/.env" << EOF
NODE_ENV=production
PORT=3000
MONGODB_URI=$MONGODB_URI
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=https://$DOMAIN
EOF

print_success ".env configured"

###############################################################################
# STEP 8: Install PM2
###############################################################################
print_step "8/12 - Install PM2 (Process Manager)"
npm install -g pm2 > /dev/null 2>&1
print_success "PM2 installed"

###############################################################################
# STEP 9: Start App with PM2
###############################################################################
print_step "9/12 - Start Aplikasi dengan PM2"
cd "$REPO_PATH"
pm2 delete mari-aktif 2>/dev/null || true
pm2 start index.js --name "mari-aktif" > /dev/null 2>&1
pm2 startup > /dev/null 2>&1
pm2 save > /dev/null 2>&1
print_success "Aplikasi running dengan PM2"

###############################################################################
# STEP 10: Install Nginx & Certbot
###############################################################################
print_step "10/12 - Install Nginx & Let's Encrypt"
apt install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1
systemctl start nginx > /dev/null 2>&1
systemctl enable nginx > /dev/null 2>&1
print_success "Nginx & Certbot installed"

###############################################################################
# STEP 11: Generate SSL Certificate
###############################################################################
print_step "11/12 - Generate SSL Certificate ($DOMAIN)"
systemctl stop nginx 2>/dev/null || true
certbot certonly --standalone --non-interactive --agree-tos --register-unsafely-without-email -d "$DOMAIN" -d "www.$DOMAIN" > /dev/null 2>&1
systemctl start nginx > /dev/null 2>&1
print_success "SSL certificate generated"

###############################################################################
# STEP 12: Configure Nginx with SSL
###############################################################################
print_step "12/12 - Configure Nginx with SSL"
NGINX_CONFIG="/etc/nginx/sites-available/default"
cp "$NGINX_CONFIG" "${NGINX_CONFIG}.bak" 2>/dev/null || true

cat > "$NGINX_CONFIG" << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
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
    
    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
    }
}
EOF

# Test Nginx config
if nginx -t > /dev/null 2>&1; then
    systemctl reload nginx > /dev/null 2>&1
    print_success "Nginx configured with SSL"
else
    print_error "Nginx config error! Revert backup..."
    cp "${NGINX_CONFIG}.bak" "$NGINX_CONFIG"
    systemctl reload nginx > /dev/null 2>&1
    exit 1
fi

###############################################################################
# Enable SSL Auto-Renewal
###############################################################################
systemctl enable certbot.timer > /dev/null 2>&1
systemctl start certbot.timer > /dev/null 2>&1

###############################################################################
# SUMMARY & NEXT STEPS
###############################################################################
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}✅ SETUP 100% OTOMATIS COMPLETE!${NC}                    ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ System updated${NC}"
echo -e "${GREEN}✓ Node.js 20 installed${NC}"
echo -e "${GREEN}✓ Repository cloned${NC}"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo -e "${GREEN}✓ .env configured${NC}"
echo -e "${GREEN}✓ PM2 started aplikasi${NC}"
echo -e "${GREEN}✓ Nginx installed & configured${NC}"
echo -e "${GREEN}✓ SSL certificate generated${NC}"
echo -e "${GREEN}✓ SSL auto-renewal enabled${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}🔧 KONFIGURASI:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "📍 Domain: ${CYAN}$DOMAIN${NC}"
echo -e "🗄️  MongoDB: ${CYAN}Connected${NC}"
echo -e "🔐 SSL: ${CYAN}Let's Encrypt (Auto-renew enabled)${NC}"
echo -e "🚀 App: ${CYAN}Running via PM2${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "\n${YELLOW}📋 LANGKAH TERAKHIR (HANYA 1):${NC}\n"

echo -e "${CYAN}Go to Hostinger Dashboard:${NC}"
echo "  1. Buka: https://hostinger.com/cp/domains"
echo "  2. Pilih domain: $DOMAIN"
echo "  3. DNS Settings"
echo "  4. Add A Record:"
echo "     • Name: @"
echo "     • Value: 46.202.186.229"
echo "     • TTL: 3600"
echo "  5. Save"
echo ""
echo -e "${YELLOW}⏳ Wait 10-30 minutes untuk DNS propagation${NC}"
echo ""

echo -e "\n${BLUE}📊 CURRENT STATUS:${NC}\n"
pm2 status
echo ""
echo -e "${BLUE}Nginx Status:${NC}"
systemctl status nginx --no-pager | head -3
echo ""

echo -e "\n${GREEN}✅ Selesai!${NC}"
echo -e "${YELLOW}Setelah DNS propagate, buka: https://$DOMAIN${NC}\n"
