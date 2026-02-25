# Cut Tracker

A modern calorie and fat loss tracker with a SaaS-like dashboard aesthetic. Built with Next.js 14, TypeScript, Tailwind CSS v3, and shadcn/ui.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Storage**: IndexedDB (with localStorage fallback)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Node Version

Requires Node.js 18.17+ or 20+. We recommend using [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install 20
nvm use 20
```

---

## Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/cut-tracker.git
cd cut-tracker

# 2. Install dependencies
npm install

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel via GitHub

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cut-tracker.git
git push -u origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repo (`cut-tracker`)
4. Leave all settings as default (Vercel auto-detects Next.js)
5. Click **Deploy**

Vercel will auto-deploy on every push to `main`.

---

## Troubleshooting: Tailwind Not Applied in Production

If you see unstyled HTML after deployment, check these things in order:

### 1. `globals.css` has Tailwind directives

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2. `layout.tsx` imports globals.css

```ts
// app/layout.tsx
import "./globals.css";
```

### 3. `tailwind.config.ts` has correct content paths

```ts
content: [
  "./pages/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
  "./app/**/*.{ts,tsx}",
  "./lib/**/*.{ts,tsx}",
],
```

### 4. `postcss.config.mjs` uses correct format

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
export default config;
```

### 5. Tailwind v3 (not v4) is installed

```bash
npm ls tailwindcss
# should show: tailwindcss@3.x.x
```

### 6. Clear Next.js cache

```bash
rm -rf .next
npm run build
```

### 7. On Vercel, trigger a fresh deploy

In Vercel dashboard → Deployments → click "Redeploy" with "Use existing build cache" unchecked.

---

## Features

- **Today Dashboard** — Hero calories card, macro progress bars, quick-add buttons
- **Log** — Browse any day, add/delete meals & training, log metrics
- **Insights** — Recharts graphs for calories, protein, weight, and deficit accumulation
- **Settings** — Edit profile, targets, schedule, export/import/reset data
- **Local-first** — All data stored in IndexedDB (no backend, no auth)
- **Export** — JSON backup + CSV daily summary

## Data Model

All data is persisted locally in your browser's IndexedDB:

- `UserProfile` — name, goals, targets, schedule
- `DayLog` — meals, trainings, metrics, notes per date
- `FoodItem` — food library with macros
- `MealTemplate` — reusable meal templates (includes breakfast template)

---

## License

MIT
