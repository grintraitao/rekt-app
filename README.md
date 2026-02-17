# REKT: The Crypto Survival RPG

A mobile app (Android first) — crypto wallet simulator RPG where users build a fake portfolio and survive real scam patterns.

## Tech Stack

- React Native with Expo (TypeScript)
- Expo Router for navigation
- Firebase (auth, Firestore, analytics)
- Zustand for state management
- React Native Reanimated for animations

## Getting Started

### Prerequisites

- Node.js
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
git clone https://github.com/grintraitao/rekt-app.git
cd rekt-app/rekt
npm install
```

### Running

```bash
npx expo start          # dev server
npx expo run:android    # build Android
```

## Project Structure

```
src/
├── screens/          # One file per screen
├── components/       # Reusable UI components
├── store/            # Zustand stores (player, portfolio, scenarios)
├── data/             # JSON scenario files, scam definitions
├── utils/            # Helpers, formatters
├── theme/            # Colors, fonts, spacing (cyberpunk dark theme)
└── navigation/       # Bottom tabs + stack navigators
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
