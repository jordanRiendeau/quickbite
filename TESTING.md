# QuickBite Testing Notes

Use this file when you want to sanity check the app after a change. The main things worth verifying are search, recipe details, shopping-list behavior, and account switching.

## Automated Checks

- [x] Unit tests pass with `npm test`
- [x] TypeScript checks pass with `npm run typecheck`
- [x] The app starts without console errors
- [x] The error boundary renders when a screen throws
- [x] Ranking and retry logic behave as expected

## Manual Checklist

### 1️⃣ App Launch

- [ ] Web loads at <http://localhost:8082>
- [ ] No errors in console or terminal
- [ ] Home screen shows search UI
- [ ] All three tabs visible (Cook, List, Account)

### 2️⃣ Ingredient Search

- [ ] Type "chicken" → Results load
- [ ] Display 10 results per page
- [ ] Click recipe card → Recipe detail opens
- [ ] See ingredients list with quantities
- [ ] See cooking steps
- [ ] "Add All Ingredients" appears on the results card and recipe page

### 3️⃣ Recipe Search

- [ ] Switch to "Recipe" mode
- [ ] Type "pasta" → Results load
- [ ] Type "pastaa" (typo) → Corrects to "pasta"
- [ ] Results display correctly

### 4️⃣ Recipe Detail - Per-Ingredient Buttons

- [ ] Each ingredient has "Add Ingredient" button (green)
- [ ] Click "Add Ingredient" → Button turns red
- [ ] Button text changes to "Remove Ingredient"
- [ ] Click "Remove" → Button goes back to green
- [ ] Button state persists while on recipe page

### 4b️⃣ Recipe Detail - Add/Remove All

- [ ] The top button reads "Add All Ingredients" when nothing from that recipe is in the list
- [ ] Tap it → All ingredients are added to the shopping list
- [ ] A popup says "All ingredients added to list"
- [ ] The button changes to "Remove All Ingredients"
- [ ] Tap it again → All ingredients from that recipe are removed

### 5️⃣ Shopping List

- [ ] Navigate to "List" tab
- [ ] Added ingredients appear here
- [ ] Items are grouped by recipe
- [ ] Each recipe shows image + name header
- [ ] Item has recipe tag: "From [Recipe Name]"
- [ ] Can check items (checkbox)
- [ ] "Clear Checked" button removes checked items
- [ ] "Clear All" button removes all items (shows confirmation)

### 6️⃣ Account Management

- [ ] Go to "Account" tab
- [ ] Create new account: "Person 2"
- [ ] Shopping list is empty for new account
- [ ] Add ingredient to new account
- [ ] Switch back to first account
- [ ] Original shopping list is still there
- [ ] Switch to "Person 2" again
- [ ] New account's item is still there

### 7️⃣ Save Recipes

- [ ] On recipe detail, find "Save Recipe" button
- [ ] Click it (button shows "Saved")
- [ ] Go to Account tab
- [ ] Saved recipe appears in gallery
- [ ] Click saved recipe → Details open
- [ ] Go back and click "Unsave" button
- [ ] Recipe disappears from saved gallery

### 8️⃣ API Fallback (No API Key)

- [ ] Delete/comment out `EXPO_PUBLIC_SPOONACULAR_API_KEY`
- [ ] Search still works (uses TheMealDB)
- [ ] Search still returns usable recipes without a key
- [ ] Results are valid recipes

### 9️⃣ Error Handling

- [ ] Go offline (disconnect internet)
- [ ] Try to search
- [ ] App shows graceful error or falls back to cache
- [ ] No crash/blank screen
- [ ] Error message is helpful

### 🔟 Performance

- [ ] First search: ~500ms max
- [ ] Repeat search: instant (cached)
- [ ] Image loading: smooth
- [ ] Scrolling shopping list: no lag
- [ ] No memory leaks (use DevTools)

---

## 📱 Device Testing

### Web Browser

- [x] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Mobile (Expo Go)

- [ ] iPhone (iOS)
- [ ] Android phone
- [ ] Tablet (landscape orientation)

### Emulators

- [ ] Android Emulator
- [ ] iOS Simulator (if on Mac)

---

## 🌐 TheMealDB Specific Testing

- [ ] Ingredient search returns valid meals
- [ ] Meal detail shows ingredients & instructions
- [ ] Images load from themealdb.com CDN
- [ ] No rate limiting issues
- [ ] Click meal → Correct details show

---

## 🔄 Persistence Testing

- [ ] Add items → Close browser → Refresh
  - [ ] Items still there ✅
- [ ] Create account → Switch account → Switch back
  - [ ] Data unchanged ✅
- [ ] Save recipe → Refresh app
  - [ ] Recipe still saved ✅
- [ ] Clear all items → Refresh
  - [ ] Still cleared ✅

---

## 🐛 Bug Tracking

### Found Issues

(Document bugs here during testing)

| Date | Issue | Status | Notes |
|------|-------|--------|-------|
| | | | |
| | | | |

### Resolved Issues

- ✅ Mock recipe IDs not matching clicked recipes → Removed mock recipes, using TheMealDB
- ✅ Debug mode enabled by default → Now requires explicit `true`
- ✅ Continuous loading loop → Fixed with in-flight request guard
- ✅ API quota failures → Added TheMealDB fallback
- ✅ Recipe-level ingredient button only added items once → Now toggles add all/remove all and shows a confirmation popup

---

## 📊 Feedback Collection

### Questions to Ask Testers

1. Did search work as expected?
2. Did recipes show correct ingredients?
3. Was the shopping list useful?
4. Any confusing parts of the UI?
5. Would you use this in real life?
6. Missing features?
7. Performance issues?

## Feedback

- Share the app with a few people and watch where they hesitate.
- Note whether the ingredient toggle is obvious without explanation.
- Write down any missing recipes, confusing labels, or slow screens.

---

## 📝 Notes

- First tester typically finds 30-40% of issues testers miss
- Focus on real-world scenarios (actual meals they'd make)
- Mobile testing is critical (10% of web users = mobile issues)
- Pay attention to image loading (network dependent)

---

**Ready to Test?** ✅

- Start with web: `npm run web`
- Share QR code: `npm start`
- Track feedback in this checklist
- Deploy confident changes

**Date**: April 16, 2026  
**Version**: 1.0.0-MVP  
**Status**: 🟢 Ready for Beta Testing
