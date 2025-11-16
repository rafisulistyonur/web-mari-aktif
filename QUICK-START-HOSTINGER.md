# 🚀 QUICK START - HOSTINGER (Premium Hosting)

## ⏱️ Total Setup Time: 30 Menit

### Kelebihan Hostinger:
- ✅ Support Node.js
- ✅ Harga terjangkau (~$2-4/bulan domain)
- ✅ Unlimited bandwidth
- ✅ Free SSL (Let's Encrypt)
- ✅ Support 24/7
- ⚠️ VPS/Dedicated Server recommended untuk production

### Tipe Hostinger yang Cocok:
| Paket | CPU | RAM | Harga | Cocok Untuk |
|-------|-----|-----|-------|------------|
| **Shared** | Shared | 512MB | $2-3 | Static/PHP only |
| **VPS Regular** | 1 Core | 2GB | $6-8 | Node.js small |
| **VPS Plus** | 2 Cores | 4GB | $10-12 | Node.js medium |
| **Dedicated** | 4+ Cores | 8GB+ | $20+ | Production |

**Rekomendasi:** VPS Regular ($6-8/bulan) untuk Node.js

---

## STEP 1: Beli Hosting di Hostinger (5 menit)

1. Buka: https://hostinger.com
2. Klik "Hosting" → "VPS Hosting"
3. Pilih plan:
   - **VPS Regular** ($6/bulan) untuk development/small production
   - Setup payment & domain
4. Tunggu activation (~15 menit)

### Dapatkan Access:
- Email dari Hostinger berisi:
  - VPS IP address (e.g., 123.45.67.89)
  - Root password
  - Control panel URL

---

## STEP 2: Setup MongoDB Atlas (1 menit)

Sama seperti platform lain:

1. Buka: https://mongodb.com/cloud/atlas
2. Create cluster "mari-aktif"
3. Add user: admin / password
4. Whitelist IP: `0.0.0.0/0` (atau IP server Hostinger)
5. Copy connection string

---

## STEP 3: Login ke VPS via SSH (1 menit)

### Via Terminal/PowerShell:
```bash
ssh root@123.45.67.89

# Password: (dari email Hostinger)
# Done! Sekarang di server
```

---

## STEP 4: Update System (2 menit)

```bash
apt update && apt upgrade -y
```

---

## STEP 5: Install Node.js (2 menit)

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
apt install -y nodejs

# Verify
node -v    # v20.x.x
npm -v     # 10.x.x
```

---

## STEP 6: Install Git & Clone Project (2 menit)

```bash
apt install -y git

# Clone your repository
cd /home
git clone https://github.com/YOUR_USERNAME/web-mari-aktif.git
cd web-mari-aktif

# Install dependencies
npm install
```

---

## STEP 7: Setup Environment Variables (1 menit)

```bash
# Create .env file
nano .env

# Paste:
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://admin:PASSWORD@mari-aktif.xxxxx.mongodb.net/mari_aktif?retryWrites=true&w=majority
SESSION_SECRET=generate_dari_command_below
JWT_SECRET=generate_dari_command_below
CORS_ORIGIN=https://your-domain.com
```

### Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Save:
```
Ctrl+X → Y → Enter
```

---

## STEP 8: Install PM2 (Process Manager) (1 menit)

```bash
npm install -g pm2

# Start application
pm2 start index.js --name "mari-aktif"

# Setup startup
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs
```

---

## STEP 9: Install Nginx (1 menit)

```bash
apt install -y nginx

systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

---

## STEP 10: Setup SSL dengan Let's Encrypt (2 menit)

```bash
apt install -y certbot python3-certbot-nginx

# Generate certificate (ganti your-domain.com)
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Agree to terms and confirm email
```

---

## STEP 11: Configure Nginx (2 menit)

```bash
# Backup original
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak

# Edit
nano /etc/nginx/sites-available/default

# DELETE all, PASTE:
```

```nginx
# Redirect HTTP ke HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
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
    server_name your-domain.com www.your-domain.com;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
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
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Proxy ke Node.js
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
    }
}
```

### Save:
```
Ctrl+X → Y → Enter
```

### Test & restart:
```bash
nginx -t
systemctl restart nginx
```

---

## STEP 12: Setup Auto SSL Renewal (1 menit)

```bash
systemctl enable certbot.timer
systemctl start certbot.timer

# Verify
systemctl status certbot.timer
```

---

## STEP 13: Setup Domain Pointing (at Hostinger Dashboard)

1. Buka Hostinger Control Panel
2. Go to Domains
3. DNS Settings untuk domain Anda
4. Update nameservers atau add A record:
   - **Type:** A
   - **Name:** @
   - **Value:** VPS IP (123.45.67.89)

Atau jika domain di registrar lain:
- **Type:** A Record
- **Name:** your-domain.com
- **Value:** 123.45.67.89
- **Type:** CNAME
- **Name:** www
- **Value:** your-domain.com

---

## ✅ DONE!

Application live di:
```
🌐 https://your-domain.com
🔒 SSL/HTTPS: Active (Let's Encrypt)
🚀 Process Manager: PM2
🔄 Auto-startup: Enabled
```

---

## 🔄 UPDATE WORKFLOW

Setiap kali ada update:

### Local:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Di Hostinger VPS:
```bash
ssh root@123.45.67.89

cd /home/web-mari-aktif

git pull origin main
npm install  # jika ada new deps
pm2 restart mari-aktif

pm2 status
```

---

## 🧪 TESTING

### Test HTTPS:
```bash
curl https://your-domain.com/login
```

### Check SSL:
```
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
# Expected: A+ Grade
```

### Monitor Logs:
```bash
ssh root@123.45.67.89
pm2 logs mari-aktif
```

---

## 📊 MONTHLY COST

| Item | Cost |
|------|------|
| Hostinger VPS | $6-8 |
| Domain (yearly) | ~$9 |
| MongoDB Atlas | Free |
| SSL | Free |
| **TOTAL** | **~$15-17/year** (terjangkau!) |

---

## ✅ HOSTINGER ADVANTAGES

✅ Murah (termasuk domain)
✅ Support Node.js
✅ Full control (VPS)
✅ Free SSL
✅ Support 24/7
✅ Easy management
✅ Combined hosting + domain

---

## ⚠️ HOSTINGER DISADVANTAGES

⚠️ Setup lebih manual (vs Railway)
⚠️ Need basic VPS knowledge
⚠️ Manual updates & maintenance
⚠️ Gak auto-deploy (harus git pull manual)
⚠️ Gak auto-scaling (tapi bisa upgrade plan)

---

## 🆘 TROUBLESHOOTING HOSTINGER

### SSH Connection Error
```
Solusi: 
1. Verify IP dari email Hostinger
2. Check firewall (allow port 22)
3. Reset password di Hostinger panel
```

### App tidak jalan
```bash
pm2 status
pm2 logs mari-aktif
# Check error messages
```

### Domain tidak connect
```
Solusi:
1. Verify A record di DNS
2. Wait 24 hours untuk propagation
3. Check DNS: nslookup your-domain.com
```

### SSL Error
```bash
# Check certificate
ls -la /etc/letsencrypt/live/your-domain.com/

# Renew
certbot renew --dry-run
```

---

## 💡 PRO TIPS HOSTINGER

1. **Backup Regular**
   ```bash
   # Backup database
   mongodump --uri="mongodb+srv://..." --out=./backup
   ```

2. **Monitor Memory**
   ```bash
   free -h
   top
   ```

3. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   pm2 restart mari-aktif
   ```

4. **Check Logs**
   ```bash
   pm2 logs
   tail -f /var/log/nginx/error.log
   ```

5. **Firewall** (if needed)
   ```bash
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ufw enable
   ```

---

## 📈 SCALING (Jika perlu upgrade)

Hostinger VPS bisa di-scale up:
- Upgrade dari Regular → Plus (2 cores, 4GB)
- Cost increase: ~$4-6 per bulan
- No downtime upgrade (usually)

Atau migrasi ke:
- **DigitalOcean** (lebih mudah scaling)
- **AWS/GCP** (enterprise)

---

## 🎯 HOSTINGER vs ALTERNATIVES

| Aspek | Hostinger | Railway | DigitalOcean |
|-------|-----------|---------|--------------|
| Setup | Manual | Auto | Semi-auto |
| Cost | $6-8/mo | $5-15/mo | $4-6/mo |
| SSL | Free | Free | Free |
| Auto-deploy | Manual | Auto | Manual |
| Support | 24/7 | Community | Community |
| Best for | Value seekers | Beginners | Developers |

---

## 📞 HOSTINGER SUPPORT

- Website: https://hostinger.com
- Live Chat: 24/7 available
- Help Center: https://hostinger.com/help
- Knowledge Base: https://hostinger.com/kb

---

## ✨ SUMMARY

Hostinger cocok untuk:
- ✅ Budget-conscious projects
- ✅ Small to medium production
- ✅ Indonesia-based (good ping)
- ✅ Combined domain + hosting

Tidak cocok untuk:
- ❌ Auto-scaling needs
- ❌ Zero-downtime deployments
- ❌ Enterprise SLA requirements

---

**Setup Hostinger success! 🚀**

Total time: 30 minutes
Total cost: $6-8/bulan (VPS) + domain

Lebih murah dari Railway/DigitalOcean tapi perlu setup manual!
