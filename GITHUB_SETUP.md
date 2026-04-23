# 🚀 QuickBite GitHub Workflow

## If You Already Have a GitHub Repo (Use This)

1. Confirm your remote:

```bash
cd c:\Users\Jorda\OneDrive\Desktop\quickbite
git remote -v
```

1. If `origin` is correct, push latest work:

```bash
git add .
git commit -m "Update project planning and setup docs"
git push origin main
```

1. If `origin` is wrong, update it:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/quickbite.git
git push -u origin main
```

1. Verify on GitHub:

- Go to <https://github.com/YOUR_USERNAME/quickbite>
- Confirm latest commit is visible
- Confirm `README.md` renders correctly

---

## If You Do Not Have a Repo Yet (Optional)

1. Go to <https://github.com/new>
2. Repository name: `quickbite`
3. Description: `Recipe search and shopping list app built with Expo and TypeScript.`
4. Choose Public or Private
5. Do not initialize with README/license (project already has files)
6. Connect and push:

```bash
cd c:\Users\Jorda\OneDrive\Desktop\quickbite
git remote add origin https://github.com/YOUR_USERNAME/quickbite.git
git branch -M main
git push -u origin main
```

---

## 🎯 After Repo Is Ready on GitHub

### Option A: Deploy Web to Vercel (Recommended for portfolio)

1. Go to <https://vercel.com/new>
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

### Option C: Create a GitHub Project Board (Execution System)

Use this board name:

`QuickBite 90-Day Execution (Q2 2026)`

Create these columns (left to right):

1. **Backlog**
2. **Ready**
3. **In Progress**
4. **In Review**
5. **Blocked**
6. **Done**

Create these labels:

- `area:product`
- `area:frontend`
- `area:backend`
- `area:devops`
- `area:qa`
- `priority:p0`
- `priority:p1`
- `priority:p2`
- `type:feature`
- `type:bug`
- `type:tech-debt`
- `kpi:activation`
- `kpi:retention`
- `kpi:reliability`
- `kpi:performance`

Create these milestones:

1. **M1 - Measure & Stabilize (Day 0-30)**
2. **M2 - Scale Foundation (Day 31-60)**
3. **M3 - Release Candidate (Day 61-90)**

Add these issues as starter cards:

### M1 - Measure & Stabilize (Day 0-30)

1. **Define product analytics event taxonomy**
   - Labels: `area:product`, `type:feature`, `priority:p0`, `kpi:activation`
   - Exit criteria: event schema approved for search, recipe open, ingredient add, save recipe, account switch.

2. **Instrument analytics for key funnel events**
   - Labels: `area:frontend`, `type:feature`, `priority:p0`, `kpi:activation`
   - Exit criteria: dashboard shows activation funnel from first search to first ingredient add.

3. **Run beta with 20-50 testers and collect structured feedback**
   - Labels: `area:qa`, `type:feature`, `priority:p0`, `kpi:retention`
   - Exit criteria: at least 20 completed tester submissions and top 3 friction points documented.

4. **Enforce CI quality gates for pull requests**
   - Labels: `area:devops`, `type:tech-debt`, `priority:p0`, `kpi:reliability`
   - Exit criteria: PRs require lint, typecheck, and tests to merge.

5. **Create weekly reliability report (errors, fallback frequency, crashes)**
   - Labels: `area:devops`, `type:feature`, `priority:p1`, `kpi:reliability`
   - Exit criteria: weekly report generated and reviewed.

### M2 - Scale Foundation (Day 31-60)

1. **Write auth and sync architecture decision record (ADR)**
   - Labels: `area:backend`, `type:feature`, `priority:p0`, `kpi:retention`
   - Exit criteria: decision signed with data model and migration strategy.

2. **Implement top 3 UX fixes from beta insights**
   - Labels: `area:frontend`, `type:feature`, `priority:p0`, `kpi:activation`
   - Exit criteria: fixes shipped and activation improves week-over-week.

3. **Reduce search latency to p95 under 1.5s**
   - Labels: `area:frontend`, `type:tech-debt`, `priority:p1`, `kpi:performance`
   - Exit criteria: measured p95 meets target for active beta cohort.

### M3 - Release Candidate (Day 61-90)

1. **Prepare v1 release checklist and freeze criteria**
   - Labels: `area:qa`, `type:feature`, `priority:p0`, `kpi:reliability`
   - Exit criteria: no open P0/P1 bugs and regression checks pass.

2. **Finalize web and mobile release playbooks**
   - Labels: `area:devops`, `type:feature`, `priority:p1`
   - Exit criteria: documented runbooks for web deploy and mobile preview distribution.

3. **Run KPI review and publish next-quarter roadmap**
   - Labels: `area:product`, `type:feature`, `priority:p1`, `kpi:retention`, `kpi:activation`
   - Exit criteria: KPI outcomes documented and next quarter priorities approved.

### Triage Rules (Recommended)

Use this priority formula for backlog ordering:

`Score = (Impact x Confidence) / Effort`

Where each value is 1-5.

- `4.0+` = Fast-track into **Ready**
- `2.5-3.9` = Keep in **Backlog**
- `<2.5` = Defer unless strategic

Cap active work-in-progress to 3 cards maximum to protect execution quality.

---

## 📱 Share with Others

After deployment, share:

**Web**: <https://quickbite.vercel.app>  
**GitHub**: <https://github.com/YOUR_USERNAME/quickbite>

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
git pull --rebase origin main
git push origin main
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

**Ready? Use the "already have a repo" path above and continue with deployment + project board setup.**
