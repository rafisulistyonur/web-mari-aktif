# 🚀 GitHub Actions Auto-Deploy Setup

## ✅ Workflow Files Created

### 1. **deploy-vercel.yml** - Main Deployment Workflow
- Triggers on: `push to main/develop`, `pull requests`
- Actions:
  - ✅ Checks out code
  - ✅ Installs Node.js 20
  - ✅ Installs dependencies (npm ci)
  - ✅ Runs tests (if available)
  - ✅ Deploys to Vercel
  - ✅ Comments on PRs with status
  - ✅ Notifies on success/failure

### 2. **code-quality.yml** - Code Quality Checks
- Triggers on: `push to main/develop`, `pull requests`
- Checks:
  - ✅ Security vulnerabilities (npm audit)
  - ✅ Code linting (if eslint configured)
  - ✅ Tests
  - ✅ Node modules size

---

## 📋 Setup Instructions

### Step 1: Generate Vercel Tokens

1. Go to **https://vercel.com/account/tokens**
2. Click **Create Token**
3. Name: `GITHUB_ACTIONS` (or any name)
4. Scopes: Full access recommended
5. Copy the token

### Step 2: Get Vercel Organization & Project IDs

```bash
# Run this in your local project directory
# (after connecting to Vercel)
vercel env pull

# Or go to Vercel Dashboard:
# Dashboard → Your Project → Settings → Copy Project ID
# Dashboard → Settings → Copy Team/Org ID
```

Alternatively:
1. Open **https://vercel.com/dashboard**
2. Select your project
3. Go to **Settings** tab
4. Copy:
   - **Project ID** (under "Project ID")
   - **Team/Org ID** (under "Team Settings" if team project)

### Step 3: Add Secrets to GitHub

1. Go to your GitHub repo: https://github.com/SiswaRey/web-mari-aktif
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

   | Name | Value |
   |------|-------|
   | `VERCEL_TOKEN` | Your Vercel token from Step 1 |
   | `VERCEL_ORG_ID` | Your Organization/Team ID from Step 2 |
   | `VERCEL_PROJECT_ID` | Your Project ID from Step 2 |
   | `GITHUB_TOKEN` | Auto-generated (leave as is) |

**⚠️ IMPORTANT:**
- Keep these tokens SECRET!
- Never commit them to Git
- GitHub Actions will inject them automatically

---

## 🔄 Auto-Deploy Workflow

### When it Triggers:
1. **Push to `main` branch** → Auto-deploy to Vercel
2. **Push to `develop` branch** → Deploy to preview
3. **Pull Request to `main`** → Run quality checks

### What Happens:

```
User pushes code → GitHub detects push
   ↓
GitHub Actions triggered
   ↓
Run Code Quality Checks
   ├─ Install dependencies
   ├─ Security audit
   ├─ Run tests
   └─ Lint code
   ↓
Deploy to Vercel (if checks pass)
   ├─ Build application
   ├─ Deploy to Vercel infrastructure
   └─ Generate URL
   ↓
Notify Results
   ├─ Comment on PR (if PR)
   ├─ Show logs
   └─ Success/Failure status
   ↓
Your app is LIVE! 🎉
```

---

## 📝 Commit Changes

Before setting up secrets, commit the workflow files:

```bash
# Stage changes
git add .github/workflows/

# Commit
git commit -m "feat: Add GitHub Actions auto-deploy to Vercel"

# Push
git push origin main
```

---

## ✨ Testing the Workflow

### Make a test commit:

```bash
# Make a small change
echo "# Updated $(date)" >> README.md

# Commit and push
git add README.md
git commit -m "test: Trigger GitHub Actions workflow"
git push origin main
```

### Monitor deployment:

1. Go to **https://github.com/SiswaRey/web-mari-aktif/actions**
2. Watch the workflow run
3. See logs, build output, deployment status

---

## 🔍 Check Deployment Status

### View Workflow Runs:
- **GitHub:** https://github.com/SiswaRey/web-mari-aktif/actions
- **Vercel:** https://vercel.com/dashboard

### View Logs:
1. Click on workflow run in GitHub Actions
2. Click on job to see detailed logs
3. Look for deployment URL

### Access Your Live App:
- Main deployment: https://web-mari-aktif.vercel.app
- Check Vercel dashboard for preview URLs

---

## 🚨 Troubleshooting

### Workflow Failed - "Secrets not set"
**Solution:** Make sure all 3 secrets are added in GitHub Settings

### Vercel Deployment Failed
**Check:**
1. Workflow logs for error message
2. Vercel build logs: https://vercel.com/dashboard
3. Ensure `.env` variables are set in Vercel project settings

### Workflow Stuck/Not Running
**Solution:**
1. Check if `.github/workflows/*.yml` files exist
2. Verify YAML syntax (no indentation errors)
3. Restart workflow: GitHub Actions → Run workflow manually

### Test Still Fails
**Debug:**
```bash
npm install
npm test
npm run lint
npm audit
```

---

## 📊 Workflow Files Location

```
web-mari-aktif/
├── .github/
│   └── workflows/
│       ├── deploy-vercel.yml      ← Main deployment
│       └── code-quality.yml       ← Quality checks
```

---

## 🎯 Next Steps

1. ✅ Commit workflow files
2. ✅ Add secrets to GitHub
3. ✅ Test with a push
4. ✅ Monitor first deployment
5. ✅ Celebrate! 🚀

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| Push code | `git push origin main` |
| Check workflows | https://github.com/SiswaRey/web-mari-aktif/actions |
| View deployment | https://vercel.com/dashboard |
| View live app | https://web-mari-aktif.vercel.app |
| View logs | Click workflow → Click job → See logs |

---

## ⚙️ Environment Variables for Vercel

Make sure these are set in Vercel project settings:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=...
JWT_SECRET=...
CORS_ORIGIN=https://web-mari-aktif.vercel.app
```

Go to: **Vercel Dashboard → Settings → Environment Variables**

---

**Setup Complete! Your app now auto-deploys to Vercel on every push to main! 🎉**
