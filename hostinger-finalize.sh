#!/bin/bash

###############################################################################
# 🔐 MARI AKTIF - POST-DEPLOYMENT CONFIGURATION SCRIPT
# Run this AFTER running hostinger-deploy.sh
# This script handles .env, SSL, and Nginx configuration
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Colors for prompts
read_input() {
    echo -e "${YELLOW}➜ $1${NC}"
    read -r REPLY
}

###############################################################################
# STEP 1: Configure .env
###############################################################################
print_step "Step 1: Configure .env File"

ENV_FILE="/home/web-mari-aktif/.env"

if [ ! -f "$ENV_FILE" ]; then
    print_info "Creating .env from template..."
    cp "/home/web-mari-aktif/.env.example" "$ENV_FILE"
fi

print_info "Current .env configuration:"
echo ""
cat "$ENV_FILE" | grep -E "^[^#]"
echo ""

read_input "Enter your MongoDB Atlas URI (or press Enter to skip):"
MONGODB_URI="$REPLY"

if [ -n "$MONGODB_URI" ]; then
    sed -i "s|^MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|" "$ENV_FILE"
    print_success "MongoDB URI updated"
fi

read_input "Enter your domain (e.g., yourdomain.com, or press Enter to skip):"
DOMAIN="$REPLY"

if [ -n "$DOMAIN" ]; then
    CORS_ORIGIN="https://$DOMAIN"
    sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=$CORS_ORIGIN|" "$ENV_FILE"
    print_success "CORS_ORIGIN set to $CORS_ORIGIN"
fi

# Generate secrets if not already set
print_info "Generating random secrets for SESSION_SECRET and JWT_SECRET..."
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" "$ENV_FILE"
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"

print_success ".env file configured"
print_info "Updated .env:"
echo ""
cat "$ENV_FILE" | grep -E "^[^#]"
echo ""

###############################################################################
# STEP 2: Generate SSL Certificate
###############################################################################
print_step "Step 2: Generate SSL Certificate with Let's Encrypt"

if [ -z "$DOMAIN" ]; then
    read_input "Enter your domain (e.g., yourdomain.com):"
    DOMAIN="$REPLY"
fi

if [ -n "$DOMAIN" ]; then
    print_info "Generating SSL certificate for: $DOMAIN"
    
    # Make sure Nginx is stopped for standalone mode
    systemctl stop nginx
    
    certbot certonly --standalone -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" 2>&1 || true
    
    # Restart Nginx
    systemctl start nginx
    
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        print_success "SSL certificate generated for $DOMAIN"
    else
        print_info "⚠️  SSL certificate generation may need manual verification"
    fi
else
    print_info "Skipping SSL certificate generation (domain not provided)"
fi

###############################################################################
# STEP 3: Update Nginx Configuration
###############################################################################
print_step "Step 3: Configure Nginx"

NGINX_CONFIG="/etc/nginx/sites-available/default"

if [ -n "$DOMAIN" ]; then
    print_info "Updating Nginx configuration for: $DOMAIN"
    
    # Replace placeholders
    sed -i "s|YOUR_DOMAIN_HERE|$DOMAIN|g" "$NGINX_CONFIG"
    
    # Test Nginx configuration
    if nginx -t 2>&1 | grep -q "successful"; then
        print_success "Nginx configuration is valid"
        
        # Reload Nginx
        systemctl reload nginx
        print_success "Nginx reloaded"
    else
        print_info "⚠️  Nginx configuration test failed. Please review:"
        print_info "nano $NGINX_CONFIG"
        nginx -t
    fi
else
    print_info "Skipping Nginx update (domain not provided)"
fi

###############################################################################
# STEP 4: Enable SSL Auto-Renewal
###############################################################################
print_step "Step 4: Enable SSL Auto-Renewal"

systemctl enable certbot.timer
systemctl start certbot.timer

print_success "SSL auto-renewal enabled"
systemctl status certbot.timer --no-pager | head -3

###############################################################################
# STEP 5: Verify Deployment
###############################################################################
print_step "Step 5: Verify Deployment"

print_info "Application Status:"
pm2 status

echo ""
print_info "Nginx Status:"
systemctl status nginx --no-pager | head -3

echo ""
print_info "Testing application..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000/login || print_info "localhost:3000 not responding yet"

###############################################################################
# FINAL STEPS
###############################################################################
print_step "Deployment Configuration Complete!"

echo -e "${YELLOW}✅ FINAL MANUAL STEPS:${NC}\n"

echo "1️⃣  Point your domain to this server at Hostinger Dashboard:"
echo "   A Record: $DOMAIN → 46.202.186.229"
echo ""

echo "2️⃣  Wait 10-30 minutes for DNS propagation"
echo ""

echo "3️⃣  Test your deployment:"
echo "   • HTTPS: https://$DOMAIN"
echo "   • SSL Grade: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "   • Check logs: pm2 logs mari-aktif"
echo ""

echo -e "${GREEN}Your application should now be live!${NC}\n"
