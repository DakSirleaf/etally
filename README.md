# eTally
**A time tracker for eCat** — Progressive Web App

Built with React + TypeScript + Vite + Tailwind CSS + Framer Motion

---

## Deploy to Vercel (No terminal needed)

1. Create a new GitHub repo named `etally`
2. Drag the contents of this folder into GitHub Desktop → commit → push
3. Go to [vercel.com](https://vercel.com) → New Project → Import your `etally` repo
4. Vercel auto-detects Vite. Click **Deploy**
5. Live in ~90 seconds ✓

**Vercel build settings** (auto-detected, no changes needed):
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

---

## Install as PWA on iPhone
1. Open the Vercel URL in Safari
2. Tap Share → **Add to Home Screen**
3. App installs with full-screen mode, no browser chrome

## Features
- REG / OT shift toggle with live calculation
- Swipe left on log entries to delete
- Offline capable (service worker)
- Data persists on device via localStorage
