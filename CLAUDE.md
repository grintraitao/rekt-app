# REKT: The Crypto Survival RPG

## What This Is
A mobile app (Android first) — crypto wallet simulator RPG where users
build a fake portfolio and survive real scam patterns. See docs/ folder
for complete game design and wireframes.

## Tech Stack
- React Native with Expo (TypeScript)
- Expo Router for navigation
- Firebase (auth, Firestore, analytics)
- Zustand for state management
- React Native Reanimated for animations

## Key Files
- docs/REKT-Final-Build-Plan.md — Full game design, economy, scam engine
- docs/REKT-Wireframes-v2-Final.html — All 22 screen wireframes

## Project Structure
src/
├── screens/          # One file per screen (01-22)
├── components/       # Reusable UI components
├── store/            # Zustand stores (player, portfolio, scenarios)
├── data/             # JSON scenario files, scam definitions
├── utils/            # Helpers, formatters
├── theme/            # Colors, fonts, spacing (cyberpunk dark theme)
└── navigation/       # Bottom tabs + stack navigators

## Design System
- Dark theme: bg #0a0a0f, surface #12121a, border #2a2a3a
- Green #00ff88 (success/primary), Red #ff3366 (danger/rekt)
- Purple #8b5cf6, Yellow #ffd700, Cyan #00d4ff
- Font: monospace for data/labels, system font for body
- All cards have border-radius: 12px, 1px border

## Code Style
- TypeScript strict mode
- Functional components with hooks only
- Zustand for all global state
- Keep components under 200 lines — split if longer
- Use React Native StyleSheet, not inline styles

## Commands
- `npx expo start` — dev server
- `npx expo run:android` — build Android
- `eas build --platform android` — production build
- `eas submit --platform android` — submit to Play Store

## Current Sprint
Sprint 1 — MVP Core (see docs/REKT-Final-Build-Plan.md Sprint 1)
Focus: Onboarding, Wallet Home, 5 Chapter 1 scenarios, REKT/Survived
screens, share cards, XP system, daily rewards.

## Don'ts
- Don't use class components
- Don't use Redux (use Zustand)
- Don't fetch real blockchain data (everything is simulated)
- Don't use Tailwind (this is React Native, use StyleSheet)
