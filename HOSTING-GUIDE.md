# 🚀 PANDUAN HOSTING MARI AKTIF - LENGKAP

## 1️⃣ RAILWAY (Recommended - Paling Mudah)

### Kelebihan:
- ✅ Setup 5 menit
- ✅ HTTPS gratis & auto
- ✅ Free tier: $5/bulan
- ✅ MongoDB included
- ✅ Zero config deployment

### Langkah-Langkah:

**Step 1: Persiapan GitHub**
```bash
# Di local folder project
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/web-mari-aktif.git
git push -u origin main
```

**Step 2: Deploy ke Railway**
1. Buka https://railway.app
2. Login dengan GitHub
3. Klik "New Project" → "Deploy from GitHub"
4. Pilih repository: `web-mari-aktif`
5. Railway auto-detect Node.js
6. Tunggu ~2 menit... Done! ✅

**Step 3: Setup Environment Variables**
1. Di Railway Dashboard
2. Klik project → "Variables"
3. Tambah:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   SESSION_SECRET=generate_dari_command_di_bawah
   JWT_SECRET=generate_dari_command_di_bawah
   CORS_ORIGIN=https://your-railway-url.up.railway.app
   PORT=3000
   ```

**Generate Secrets:**
```bash
# Run 2x untuk SESSION_SECRET dan JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Step 4: Connect MongoDB Atlas**
1. Buka https://mongodb.com/cloud/atlas
2. Sign up (free tier 512MB)
3. Create cluster "mari-aktif"
4. Buat user: admin / password
5. Get connection string:
   ```
   mongodb+srv://admin:password@mari-aktif.xxxxx.mongodb.net/mari_aktif?retryWrites=true&w=majority
   ```
6. Paste ke Railway MONGODB_URI variable

**Step 5: Selesai!**
- Railway auto-generate URL: `https://web-mari-aktif-production-xxxxx.up.railway.app`
- SSL sudah aktif otomatis
- Auto-deploy saat push ke main branch

**Cost:** ~$15/bulan (free tier available)

---

## 2️⃣ HOSTINGER (Budget-Friendly - VPS)

### Kelebihan:
- ✅ Murah: $6-8/bulan VPS
- ✅ Full Node.js support
- ✅ Domain included (cheap)
- ✅ Free SSL
- ✅ Support 24/7 Indonesia friendly

### Kekurangan:
- ⚠️ Setup manual (lebih kompleks)
- ⚠️ Tidak auto-deploy
- ⚠️ Perlu basic VPS knowledge

### Langkah-Langkah:

**Step 1: Beli VPS**
1. Buka https://hostinger.com
2. Pilih VPS Regular ($6-8/bulan)
3. Setup dengan Node.js support
4. Tunggu activation

**Step 2: SSH ke Server**
```bash
ssh root@your-ip
# Password dari email Hostinger
```

**Step 3: Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs git
```

**Step 4: Deploy Application**
```bash
cd /home
git clone https://github.com/YOUR_USERNAME/web-mari-aktif.git
cd web-mari-aktif
npm install
```

**Step 5: Setup MongoDB**
- Gunakan MongoDB Atlas (free)
- Get connection string
- Add ke .env file

**Step 6: Setup PM2 & Nginx**
```bash
npm install -g pm2
pm2 start index.js --name "mari-aktif"
apt install -y nginx certbot python3-certbot-nginx
```

**Step 7: Configure SSL**
```bash
certbot certonly --standalone -d your-domain.com
# Update Nginx config dengan SSL
systemctl restart nginx
```

**Cost:** $6-8/bulan + domain ~$9/tahun (total sangat murah!)

**Recommended untuk:** Indonesia-based projects, budget-conscious, full control

📖 **Guide lengkap:** `QUICK-START-HOSTINGER.md`

---

## 3️⃣ RENDER (Alternatif - Mudah)

### Kelebihan:
- ✅ Free tier available
- ✅ HTTPS gratis
- ✅ Auto-deploy dari GitHub
- ✅ Email notifications

### Langkah-Langkah:

**Step 1: Deploy**
1. Buka https://render.com
2. Login dengan GitHub
3. Klik "New +" → "Web Service"
4. Connect GitHub repository
5. Configure:
   - Name: `mari-aktif`
   - Build command: `npm install`
   - Start command: `npm start`
   - Plan: Free
6. Deploy!

**Step 2: Environment Variables**
1. Di Render Dashboard → Settings
2. Add environment variables (sama seperti Railway)

**Step 3: MongoDB**
- Gunakan MongoDB Atlas (sama seperti Railway)

**Cost:** Free-$7/bulan

---

## 3️⃣ VERCEL (Untuk Next.js - Skip untuk sekarang)

**Note:** Vercel utamanya untuk Next.js. Untuk Express bisa tapi kurang optimal.

---

## 4️⃣ HEROKU (Legacy - Bisa tapi Mahal)

### Info:
- ✅ Bisa deploy Express
- ⚠️ Free tier dihapus (Nov 2022)
- Bayar minimum $7/bulan

Langkahnya sama seperti Railway tapi di Heroku dashboard.

---

## 5️⃣ DIGITALOCEAN / LINODE (VPS - Full Control)

### Kelebihan:
- ✅ Full control
- ✅ Harga terjangkau: $4-6/bulan
- ✅ Cocok untuk production

### Langkah-Langkah:

**Step 1: Create Droplet**
1. Buka https://digitalocean.com
2. Klik "Create Droplet"
3. OS: Ubuntu 22.04
4. Size: Basic ($4/bulan)
5. Region: Singapore/Indonesia
6. Klik "Create Droplet"

**Step 2: SSH ke Server**
```bash
# Di terminal lokal
ssh root@your_droplet_ip

# First login, change password
# Lalu update system
apt update && apt upgrade -y
```

**Step 3: Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
node -v  # Verifikasi
```

**Step 4: Install Git & Clone Project**
```bash
apt install -y git
cd /home
git clone https://github.com/YOUR_USERNAME/web-mari-aktif.git
cd web-mari-aktif
npm install
```

**Step 5: Setup .env**
```bash
nano .env

# Paste:
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=xxx
JWT_SECRET=xxx
CORS_ORIGIN=https://your-domain.com
```

**Step 6: Install PM2 (Process Manager)**
```bash
npm install -g pm2
pm2 start index.js --name "mari-aktif"
pm2 startup
pm2 save
```

**Step 7: Install Nginx**
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

**Step 8: Setup SSL dengan Certbot**
```bash
apt install -y certbot python3-certbot-nginx
certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

**Step 9: Configure Nginx**
```bash
nano /etc/nginx/sites-available/default

# Paste isi dari nginx.conf file project Anda
# Ganti: your-domain.com dengan domain asli

systemctl restart nginx
```

**Step 10: Auto-renew SSL**
```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

**Cost:** $4-6/bulan

---

## 6️⃣ AWS (Enterprise - Kompleks)

### Info:
- ✅ Paling scalable
- ⚠️ Rumit setup
- ⚠️ Harga bisa mahal kalau salah config

Untuk sekarang skip, hanya kalau production skala enterprise.

---

## 📊 PERBANDINGAN HOSTING

| Platform | Setup | Cost | SSL | Scaling | Rekomendasi |
|----------|-------|------|-----|---------|-------------|
| **Railway** | ⭐⭐ | $5/mo | ✅ | ✅ Auto | **TERBAIK untuk pemula** |
| **Hostinger** | ⭐⭐⭐⭐ | $6/mo | ✅ | ⚠️ Manual | **TERBAIK untuk budget** |
| **Render** | ⭐⭐ | Free-7 | ✅ | ✅ Auto | ✅ Bagus alternatif |
| **Heroku** | ⭐⭐⭐ | $7/mo | ✅ | ⚠️ Manual | ⚠️ Mahal |
| **DigitalOcean** | ⭐⭐⭐⭐ | $4/mo | ✅ | ⚠️ Manual | **TERBAIK untuk value** |
| **AWS** | ⭐⭐⭐⭐⭐ | Variable | ✅ | ✅ Auto | ⚠️ Complex |

---

## 🎯 REKOMENDASI SAYA

### Untuk Pemula:
→ **RAILWAY** (paling mudah, lepas-landas 5 menit)

### Untuk Budget:
→ **HOSTINGER** (murah, $6/mo + domain, full control)

### Untuk Production Stabil:
→ **DIGITALOCEAN** (best balance, murah, reliable)

---

## ✅ CHECKLIST SEBELUM DEPLOY

- [ ] `.env` file dibuat dengan secrets yang kuat
- [ ] MongoDB connection tested
- [ ] `package.json` updated dengan scripts
- [ ] Code di-commit & push ke GitHub
- [ ] Domain registered (kalau pakai domain custom)
- [ ] Repository public (atau private dengan access)
- [ ] Test lokal: `npm run prod`
- [ ] SSL certificate ready (auto di Railway/Render)

---

## 🔍 TESTING SETELAH DEPLOY

```bash
# Test HTTPS
curl -I https://your-domain.com

# Check SSL Grade
# Buka: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

# Check Security Headers
# Buka: https://securityheaders.com/?q=your-domain.com

# Monitor
# Dashboard hosting platform
```

---

## 🆘 TROUBLESHOOTING

### Connection Error
```
Solusi: Check MONGODB_URI di .env
       Check firewall MongoDB whitelist IP
```

### HTTPS Not Working
```
Solusi: Wait 5-10 menit after deploy
       Check certificate status di dashboard
```

### App Crash
```
Solusi: Check logs di hosting dashboard
       npm run prod (test lokal)
       Update environment variables
```

### Slow Performance
```
Solusi: Upgrade plan hosting
       Enable gzip (sudah di nginx.conf)
       Check MongoDB performance
```

---

## 💡 PRO TIPS

1. **Custom Domain**
   - Di domain registrar (namecheap, niagahoster, etc)
   - Pointing ke Railway/DigitalOcean IP
   - Auto SSL via Let's Encrypt

2. **Email Notifications**
   - Setup di hosting dashboard
   - Alert kalau deploy gagal

3. **Monitoring**
   - Railway/Render: built-in
   - DigitalOcean: setup Datadog/New Relic

4. **Backup Database**
   - MongoDB Atlas: auto backup
   - Manual: `mongodump` setiap hari

5. **CI/CD**
   - Auto-deploy saat push ke main
   - Test sebelum production
   - Rollback kalau error

---

## 📞 NEXT STEPS

1. **Pilih platform** (Railway recommended)
2. **Setup .env** dengan credentials
3. **Push ke GitHub**
4. **Connect ke hosting platform**
5. **Wait deployment** ✅
6. **Test HTTPS** ✅
7. **Setup custom domain** (optional)

Mana yang mau dipilih? 🚀
