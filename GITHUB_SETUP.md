# 🚀 Push QuickBite to GitHub

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `quickbite`
3. Description: `🍽️ Recipe search & shopping list app. Search by ingredients or recipe name, save favorites, build shopping lists.`
4. Choose:
   - ✅ Public (so it's visible for your portfolio)
   - ❌ DO NOT initialize with README/license (we have our own)
5. Click **Create repository**

---

## Step 2: Add Remote & Push

Copy-paste these commands (replace `YOUR_USERNAME` with your GitHub username):

```bash
cd c:\Users\Jorda\OneDrive\Desktop\quickbite

git remote add origin https://github.com/YOUR_USERNAME/quickbite.git
git branch -M main
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/jorda/quickbite.git
git branch -M main
git push -u origin main
```

---

## Step 3: Verify

- Go to https://github.com/YOUR_USERNAME/quickbite
- Verify all files are there
- Check that README.md displays nicely

---

## 🎯 After Pushing to GitHub

### Option A: Deploy Web to Vercel (Recommended for portfolio)
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Paste: `https://github.com/YOUR_USERNAME/quickbite.git`
4. Follow prompts:
   - Framework: Expo
   - Environment variables:
     - Add `EXPO_PUBLIC_SPOONACULAR_API_KEY` (optional, leave empty for TheMealDB fallback)
5. Click Deploy
6. Get live URL: `https://quickbite.vercel.app`

**Share this URL on your portfolio!**

### Option B: Build for iOS/Android with EAS
```bash
npx eas build --platform ios --profile preview
npx eas build --platform android --profile preview
```

---

## 📱 Share with Others

After deployment, share:

**Web**: https://quickbite.vercel.app  
**GitHub**: https://github.com/YOUR_USERNAME/quickbite

---

## 🆘 If You Get Stuck

### Git says "fatal: remote already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/quickbite.git
```

### Permission denied (publickey)
- Make sure you've added SSH key to GitHub
- Or use HTTPS instead of SSH

### Push is rejected
```bash
git push --force -u origin main  # Only if you know what you're doing!
```

---

## 📊 What to Include in GitHub Bio/Portfolio

```
🚀 QuickBite - Recipe Search & Shopping List App

A cross-platform (iOS/Android/Web) recipe discovery app built with React Native, TypeScript, and Expo Router.

Features:
- 🔍 Dual search (ingredients + recipe name)
- 💾 Smart shopping list with recipe grouping
- ❤️ Save favorites per account
- 🔄 Automatic fallback to free API
- ⚡ Resilient with retry logic & error boundaries
- 🧪 25+ unit tests with 100% pass rate

Tech: React Native, TypeScript, Expo Router, Spoonacular API, TheMealDB

Links:
- Live: https://quickbite.vercel.app
- GitHub: https://github.com/YOUR_USERNAME/quickbite
```

---

**Ready? Follow Step 1-2 above and you're live! 🎉**
