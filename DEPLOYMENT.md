# QuickBite Deployment Guide

## 🚀 Quick Start - Test the App

### Option 1: Web (Easiest - No Setup)

Already running at: **<http://localhost:8082>**

```bash
npm run web
# Open browser to http://localhost:8082
```

### Option 2: Expo Go (Test on Your Phone)

1. Download Expo Go app (iOS App Store or Google Play)
2. Run:

```bash
npm start
```

1. Scan the QR code with Expo Go app
2. Test on your actual device

### Option 3: Android Emulator

```bash
npm run android
```

(Requires Android Studio)

### Option 4: iOS Simulator (Mac only)

```bash
npm run ios
```

(Requires Xcode)

---

## 🧪 Testing Checklist

### Basic Features

- [ ] **Home Tab** - Open app, see search UI
- [ ] **Ingredient Search** - Search "chicken, rice" → Results load
- [ ] **Recipe Search** - Search "pasta" → Results load
- [ ] **TheMealDB Fallback** - Works without Spoonacular API key
- [ ] **Recipe Detail** - Click recipe → See ingredients & steps
- [ ] **Add Ingredients** - Green "Add" buttons toggle to red "Remove"
- [ ] **Shopping List** - Added items appear with recipe tags
- [ ] **Account Creation** - Create new account, switch accounts
- [ ] **Save Recipe** - Save to account → Appears in Account tab
- [ ] **Clear Items** - Clear all/checked items from shopping list

### Error Handling

- [ ] **Offline Mode** - Kill internet, app handles gracefully
- [ ] **API Retry** - Slow network, retries with backoff
- [ ] **Error Boundary** - Crash any screen → See error UI with "Go Home"

### Performance

- [ ] **Search Speed** - Results load in < 2 seconds
- [ ] **List Scrolling** - Shopping list scrolls smoothly
- [ ] **Image Loading** - Recipe images load properly

---

## 🌐 Deploy to Production

### Option A: Deploy Web to Vercel (Free)

1. Push to GitHub:

```bash
git init
git add .
git commit -m "Initial commit: QuickBite MVP"
git remote add origin https://github.com/YOUR_USERNAME/quickbite.git
git push -u origin main
```

1. Connect to Vercel:
   - Go to <https://vercel.com>
   - Import "quickbite" repo
   - Set environment variable: `EXPO_PUBLIC_SPOONACULAR_API_KEY`
   - Deploy (takes ~2 min)

2. Share: `https://quickbite.vercel.app`

### Option B: Deploy to EAS (Expo Application Services)

1. Create Expo account:

```bash
npx eas login
npx eas project:create
```

1. Build for preview:

```bash
npx eas build --platform ios --profile preview
npx eas build --platform android --profile preview
```

1. Share build links with testers

---

## 📱 Share with Friends

### Via Expo Go (Easiest)

1. Run `npm start`
2. Share QR code (screenshot)
3. Friends scan with Expo Go app
4. They can test instantly

### Via Web Link

1. Deploy to Vercel (see above)
2. Share link: `https://quickbite.vercel.app`
3. Works on any browser (mobile/desktop)

### Via Email + GitHub

- Send GitHub link + instructions to run locally
- Works for technical friends

---

## 🔧 Environment Setup

### API Keys (Optional - TheMealDB fallback works without them)

To use Spoonacular API (premium results):

1. Sign up at <https://spoonacular.com/food-api>
2. Get free tier API key (5 queries/min)
3. Add to `.env`:

```
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_key_here
```

### Features by API

| Feature | Without API Key | With Spoonacular API |
|---------|-----------------|---------------------|
| Search | ✅ TheMealDB (300+ meals) | ✅ 370,000+ recipes |
| Ingredients | ✅ Basic | ✅ Advanced matching |
| Difficulty | ⚠️ Estimated | ✅ Accurate |
| Rate Limit | ✅ Unlimited | ⚠️ 5req/min free |

---

## 📊 Monitoring

### View Logs

```bash
# Web console
npm run web
# Open browser DevTools (F12)

# Expo CLI logs
npm start
# Check terminal for [API Retry], [TheMealDB], errors
```

### Known Issues

- ⚠️ First load may take 10-15 seconds while Metro bundles
- ⚠️ Hot reload may show stale images (hard refresh: Cmd+Shift+R)
- ⚠️ Spoonacular free tier = 5 requests/minute (TheMealDB auto-fallback)

---

## 🎯 Next Steps After Testing

1. **Gather Feedback** - What features do people want?
2. **Fix Bugs** - Note any issues from testers
3. **Add Analytics** - Track which features users use most
4. **Backend Auth** - Add real user accounts (Phase 3)
5. **Production Deploy** - Push to app stores

---

## 📞 Troubleshooting

### App won't start

```bash
npm install
npm run typecheck  # Check for errors
rm -rf node_modules/.cache
npm start
```

### Port 8082 already in use

```bash
# Kill process using that port or use a different port
npm run web -- --port 8083
```

### Blank white screen

- Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check browser console (F12) for errors
- Check terminal for Metro bundler errors

### Images not loading

- Check internet connection
- Try hard refresh
- Verify recipe IDs are valid in TheMealDB/Spoonacular

### Shopping list not persisting

- Check browser localStorage (DevTools → Application → Storage)
- Clear cache and reload
- Check console for AsyncStorage errors

---

## 🎓 Tech Stack Summary

- **Frontend**: React Native + React Native Web (single codebase)
- **Navigation**: Expo Router v6 (tabs + stack)
- **APIs**: Spoonacular (premium) + TheMealDB (free fallback)
- **Storage**: AsyncStorage (per-account persistence)
- **Testing**: Jest + TypeScript
- **Deployment**: Vercel (web) or EAS (mobile builds)

---

Generated: April 16, 2026
Version: 1.0.0-MVP
