# 🚀 MARI AKTIF - HOSTINGER DEPLOYMENT GUIDE
# Quick reference for connecting and running deployment scripts

## ✅ PREREQUISITES

Before running these commands, ensure:
- ✅ GitHub repository is up to date and pushed
- ✅ You have MongoDB Atlas connection string
- ✅ You have your domain name ready
- ✅ You have SSH access to Hostinger VPS

---

## 🔑 YOUR HOSTINGER CREDENTIALS

**Saved from your earlier message:**
- **IP Address:** 46.202.186.229
- **SSH Port:** 65002
- **Username:** u974484471
- **Password:** K9v!T3qx#P4mZ2@f

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Connect to Hostinger via SSH (PowerShell)

```powershell
# Open PowerShell and run:
ssh -p 65002 u974484471@46.202.186.229

# When prompted, enter password:
# K9v!T3qx#P4mZ2@f

# You should see a prompt like:
# u974484471@vps123456:~$
```

**If SSH fails:**
- Verify IP: 46.202.186.229
- Verify Port: 65002
- Check Hostinger Dashboard → SSH Access (confirm it's active)
- Try resetting password in Hostinger panel

---

### Step 2: Download & Run Deployment Script

Once connected via SSH, run these commands:

```bash
# Go to home directory
cd /root

# Download the deployment script from GitHub
git clone https://github.com/SiswaRey/web-mari-aktif.git
cd web-mari-aktif

# Make deployment script executable
chmod +x hostinger-deploy.sh

# Run with sudo
sudo bash hostinger-deploy.sh
```

**What this script does (automated):**
✅ Updates system packages
✅ Installs Node.js 20
✅ Installs Git
✅ Clones your repository
✅ Installs npm dependencies
✅ Installs PM2 (process manager)
✅ Starts your application
✅ Installs Nginx
✅ Installs Certbot (SSL)
✅ Creates Nginx configuration template

**Output will pause asking for:**
⏸️ Edit .env file (MONGODB_URI, CORS_ORIGIN, etc.)

---

### Step 3: Configure Environment Variables

When the script pauses, you'll need to edit .env:

```bash
# Edit .env file
nano /home/web-mari-aktif/.env

# You'll see something like:
# NODE_ENV=production
# PORT=3000
# MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster.mongodb.net/...
# SESSION_SECRET=your_secret_here
# JWT_SECRET=your_secret_here
# CORS_ORIGIN=https://your-domain.com
```

**What to update:**

1. **MONGODB_URI** - Your MongoDB Atlas connection string
   - Get from: https://www.mongodb.com/cloud/atlas
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

2. **CORS_ORIGIN** - Your domain with HTTPS
   - Example: `https://yourdomain.com`

3. **SESSION_SECRET** - Keep the auto-generated value or generate new:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **JWT_SECRET** - Keep the auto-generated value or generate new:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

**To save in nano:**
```
Ctrl+X  →  Y  →  Enter
```

After saving, the main script will complete.

---

### Step 4: Run Finalization Script

After the first script completes, run the finalization script:

```bash
# Make executable
chmod +x hostinger-finalize.sh

# Run with sudo
sudo bash hostinger-finalize.sh
```

**What this script does:**
✅ Configures .env file
✅ Generates SSL certificate from Let's Encrypt
✅ Updates Nginx configuration with your domain
✅ Tests Nginx configuration
✅ Enables SSL auto-renewal
✅ Verifies deployment

This script will prompt you for:
- MongoDB URI
- Domain name (e.g., yourdomain.com)
- Generates random SESSION_SECRET and JWT_SECRET
- Creates SSL certificate

---

### Step 5: Point Domain to VPS (Hostinger Dashboard)

⚠️ **MANUAL STEP - Cannot be automated**

1. Log in to Hostinger Control Panel: https://hostinger.com
2. Go to **Domains** section
3. Find your domain → **DNS Settings**
4. Add or Update **A Record**:
   - **Type:** A
   - **Name:** @ (or your domain)
   - **Value:** 46.202.186.229
   - **TTL:** 3600 (default)

5. Save and wait 10-30 minutes for DNS propagation

**To check DNS propagation:**
```bash
nslookup yourdomain.com
# Should return: 46.202.186.229
```

---

### Step 6: Verify Deployment

After DNS propagates (~30 minutes), test your deployment:

```bash
# Test HTTPS access
curl https://yourdomain.com/login

# Check application status
pm2 status
pm2 logs mari-aktif

# Check Nginx
systemctl status nginx

# Check SSL certificate
ls -la /etc/letsencrypt/live/yourdomain.com/
```

**Test SSL Grade:**
Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
- Expected: **A+ Grade**

---

## 📊 DEPLOYMENT TIMELINE

| Step | Time | Action |
|------|------|--------|
| 1 | 2 min | SSH connection |
| 2 | 5 min | Download & start deploy script |
| 3 | 10 min | Script runs automation |
| 4 | 5 min | Edit .env file |
| 5 | 2 min | Finalization script runs |
| 6 | 2 min | Update DNS at Hostinger |
| 7 | 30 min | Wait for DNS propagation |
| **TOTAL** | **~60 minutes** | **LIVE! 🚀** |

---

## 🔍 TROUBLESHOOTING

### SSH Connection Failed

```powershell
# 1. Verify credentials
ssh -p 65002 -v u974484471@46.202.186.229

# 2. If "Permission denied", reset password in Hostinger panel

# 3. If "Connection timed out", check:
#    - Port 65002 is open in Hostinger firewall
#    - VPS is active in Hostinger panel
```

### Deployment Script Fails

```bash
# Check what went wrong
sudo bash hostinger-deploy.sh

# Check system resources
free -h
df -h

# Check logs
tail -f /var/log/apt/history.log
```

### Application Not Starting

```bash
# Check PM2 status
pm2 status
pm2 logs mari-aktif

# Manually check if Node.js works
node -v
npm -v

# Check if port 3000 is available
lsof -i :3000
```

### Nginx Not Working

```bash
# Test configuration
nginx -t

# Check status
systemctl status nginx
systemctl restart nginx

# Check logs
tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# Check certificate
ls -la /etc/letsencrypt/live/yourdomain.com/

# Renew manually
certbot renew --dry-run

# Force renew
certbot renew --force-renewal
```

### DNS Not Propagating

```bash
# Check current DNS
nslookup yourdomain.com
dig yourdomain.com

# Flush local DNS cache (PowerShell on Windows)
ipconfig /flushdns

# Wait and try again (can take up to 48 hours)
```

---

## 📱 COMMAND REFERENCE

**While SSH'd into Hostinger:**

```bash
# Check app status
pm2 status                          # All running apps
pm2 logs mari-aktif                # App logs (Ctrl+C to exit)
pm2 monit                          # Monitor CPU/Memory

# Check services
systemctl status nginx             # Nginx status
systemctl status certbot.timer    # SSL renewal status

# Check system
free -h                           # Memory usage
df -h                            # Disk usage
top                              # System processes

# Manage app
pm2 restart mari-aktif           # Restart app
pm2 stop mari-aktif              # Stop app
pm2 start mari-aktif             # Start app
pm2 delete mari-aktif            # Remove from PM2

# Update code (after pushing to GitHub)
cd /home/web-mari-aktif
git pull origin main
npm install  # if dependencies changed
pm2 restart mari-aktif
```

---

## ✅ SUCCESS CHECKLIST

After deployment, verify:

- [ ] SSH connection works
- [ ] First deployment script completed
- [ ] .env file properly configured
- [ ] Second finalization script completed
- [ ] Domain A record set in Hostinger
- [ ] DNS propagated (nslookup returns correct IP)
- [ ] HTTPS works (https://yourdomain.com)
- [ ] SSL Grade is A+ (ssllabs.com)
- [ ] Application responds to requests
- [ ] Database connected (check PM2 logs)
- [ ] Nginx is running
- [ ] PM2 auto-startup is enabled

---

## 🎉 YOU'RE LIVE!

When everything works:
- 🌐 **https://yourdomain.com** - Your live application
- 🔒 **SSL/HTTPS** - Secure connection active
- ⚡ **Node.js** - Running via PM2
- 🔄 **Auto-restart** - PM2 enabled
- 🔐 **SSL Renewal** - Automatic via Certbot
- 📊 **Logs** - Monitor with `pm2 logs`

---

## 📞 QUICK HELP

**Script won't run?**
```bash
chmod +x hostinger-deploy.sh
chmod +x hostinger-finalize.sh
```

**Permission denied?**
```bash
sudo bash hostinger-deploy.sh
sudo bash hostinger-finalize.sh
```

**Need to restart everything?**
```bash
pm2 restart mari-aktif
systemctl restart nginx
```

**Want to see what's happening?**
```bash
pm2 logs mari-aktif      # Application logs
tail -f /var/log/nginx/error.log   # Nginx errors
```

---

**Good luck! 🚀 You've got this!**

For detailed guides, see: QUICK-START-HOSTINGER.md
