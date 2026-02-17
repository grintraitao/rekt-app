# REKT: The Crypto Survival RPG
## Final Build Plan — Ready to Code

---

## App Summary

**One line:** A crypto wallet simulator RPG where you build a portfolio, survive real scam patterns, then graduate to a live security scanner tool.

**Two phases:**
- **Phase 1 (The Game):** Brings users in. Fun, shareable, educational.
- **Phase 2 (The Tool):** Keeps users forever. Real utility — live threat feed + scam scanner.

**Platform:** Android (Google Play) → PWA later
**Cost to publish:** $25 one-time
**Monetization:** Free forever (build reputation first)
**Tech:** React Native or Flutter (your choice)

---

## What Makes This App Valuable AFTER Completion

| Layer | What It Is | Why Users Stay |
|-------|-----------|---------------|
| **Game** (Phase 1) | 5 chapters, 30+ scam scenarios, RPG progression | Acquisition — fun, shareable, brings people in |
| **Scanner** (Phase 2) | Paste any link/contract → get risk assessment | Retention — real daily utility |
| **Threat Feed** (Phase 2) | Daily alerts about real scams happening now | Habit — reason to open every day |
| **Challenge** (Always) | Create scenarios, challenge friends | Virality — social sharing loop |

---

## Complete Screen Map (22 Screens)

### Onboarding (2 screens)
```
[01] Splash — 3 swipe screens: Hook → Promise → Action
[02] Character Select — Pick class: Ape, Analyst, Shadow, Degen
```

### Core Hub (5 screens)
```
[03] Wallet Home — Main screen. Portfolio, holdings, activity.
     TOP BAR: [🏆 Challenge] [balance] [🔔 Notif]
[04] Portfolio Detail — Token chart, balance, actions
[05] Notifications — Mixed legit + scam notifications
[06] Activity Feed — Transaction history (some scam-injected)
[07] Scam Scanner — Paste link/contract → risk report ★ NEW
```

### Gameplay (6 screens)
```
[08] Scam Scenario — NPC dialogue + choice tree
[09] Approval Popup — Real vs scam approval comparison
[10] REKT Screen — Loss result + share card
[11] Survived Screen — Win result + share card
[12] Education Post-Mortem — How the attack worked + IRL protection tips
[13] NPC Dialogue — Sensei, Scammy Sam, Rick, Wendy conversations
```

### Progression (4 screens)
```
[14] Character Profile — Stats, level, survival record, achievements
[15] Gear / Inventory — Security tools equipped
[16] World Map — 5 chapters, progress tracker
[17] Leaderboard — Global, friends, weekly rankings
```

### Post-Game (2 screens) ★ NEW
```
[18] Live Threat Feed — Real scam alerts, connected to game chapters
[19] Challenge Creator — Build a scenario, send to friends
```

### Utility (3 screens)
```
[20] Daily Reward — Claim staking yield + streak bonus
[21] Share Card — Screenshot-ready REKT/Survived cards
[22] Settings — Account, sound, language, reset
```

---

## Navigation Structure

### Bottom Tab Bar (5 tabs)
```
🏠 Wallet    🗺️ Map    🔍 Scanner    📊 Stats    ⚙️ More
```

### Top Bar (Always visible on Wallet Home)
```
┌─────────────────────────────────────┐
│  [🏆 Challenge]    $47,832    [🔔 3] │
└─────────────────────────────────────┘
```

- **🏆 Challenge** — Opens Challenge Creator (send scam scenario to friends)
- **🔔** — Opens Notifications (badge count for unread)

### Screen Flow
```
ONBOARDING:
  Splash (01) → Character Select (02) → Daily Reward (20) → Wallet Home (03)

BOTTOM TABS:
  Wallet (03) ↔ Map (16) ↔ Scanner (07) ↔ Stats (14) ↔ More (22)

FROM WALLET HOME:
  Tap 🏆             → Challenge Creator (19)
  Tap 🔔             → Notifications (05) → Scam Scenario (08)
  Tap token          → Portfolio Detail (04)
  Tap activity item  → Activity Feed (06)
  Daily open         → Daily Reward (20) → Wallet Home (03)

SCAM ENCOUNTER:
  Notification/Activity → Scenario (08) → Approval Popup (09)
    ├── Fall for it → REKT (10) → Education (12) → Share (21)
    └── Survive     → Survived (11) → Education (12) → Share (21)

NPC ENCOUNTERS:
  Story trigger → NPC Dialogue (13) → back to Wallet

PROGRESSION:
  Stats tab    → Profile (14) → Gear (15)
  Stats tab    → Leaderboard (17)
  Map tab      → World Map (16)

POST-GAME (after Chapter 5):
  Wallet tab   → now shows Threat Feed (18) integrated
  Scanner tab  → Scam Scanner (07) — real utility
  🏆 button    → Challenge Creator (19)
```

---

## Core Game Loop

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  EARN    │ →  │  SPEND   │ →  │  SURVIVE  │ →  │  GROW    │
│          │    │          │    │           │    │          │
│ Daily    │    │ Invest   │    │ Scams     │    │ Level up │
│ rewards, │    │ in       │    │ appear    │    │ unlock   │
│ quests,  │    │ tokens,  │    │ mixed     │    │ new      │
│ staking  │    │ NFTs,    │    │ into      │    │ district │
│ yields   │    │ DeFi     │    │ normal    │    │ new gear │
│          │    │ pools    │    │ activity  │    │ new NPC  │
└──────────┘    └──────────┘    └───────────┘    └──────────┘
     ↑                                                │
     └────────────────────────────────────────────────┘
```

**Daily session: 3-5 minutes**
1. Claim daily rewards (30 sec)
2. Check portfolio changes (30 sec)
3. Review notifications — spot scams (1 min)
4. One story beat / quest step (2 min)
5. Check stats / leaderboard (30 sec)

---

## Economy System

### Currencies
| Currency | How to Earn | What It Buys |
|----------|------------|--------------|
| 🪙 **Coin** | Daily rewards, quests, surviving scams | In-game tokens, NFTs, DeFi investments |
| ⭐ **XP** | Every action, bonus for catching scams | Level progression |
| 🏅 **Reputation** | Story choices, helping NPCs, streaks | Unlocks NPC side quests |
| 🛡️ **Security Tokens** | Catching scams BEFORE falling | Buy security gear |

### Investment Options
| Investment | Risk | Return | Scam Exposure |
|-----------|------|--------|--------------|
| Staking ETH | Low | +0.5%/day | Low |
| Liquidity Pool | Medium | +1-3%/day | Medium — rug pulls |
| New Token ($MOON) | High | +5-20%/day OR -100% | High — honeypot |
| NFT Collection | Medium | Variable | Medium — fake mints |
| Yield Farm | High | +3-8%/day | Very High — exploits |

---

## Character System

### 4 Classes
| Class | Starting Bonus | Weakness | Unique Ability |
|-------|---------------|----------|----------------|
| 🐵 **Ape** | Fast portfolio growth | Falls for FOMO scams | Diamond Hands — survive one rug |
| 🧠 **Analyst** | High detection | Slower growth | Deep Dive — 2 free inspections/day |
| 🥷 **Shadow** | Balanced | No specialty | Incognito — blocks some social scams |
| 🎲 **Degen** | Extreme swings | Unpredictable | Gut Feeling — random auto-detect |

### 5 Stats
| Stat | Raised By | Effect |
|------|----------|--------|
| 🛡️ Security | Using security tools, revoking approvals | Reduces passive scam success |
| 👁️ Detection | Correctly identifying scams | More visual clues appear |
| 💎 Wealth | Growing portfolio, smart investments | Higher daily yields |
| 🧠 Knowledge | Reading post-mortems, education | Unlocks advanced tools |
| ❤️ HP | Daily recovery, streak bonuses | Zero = game over, restart chapter |

### Leveling
```
Lvl 1-5:   NOOB        → Genesis Block
Lvl 6-10:  TRADER       → DEX District unlocks
Lvl 11-15: COLLECTOR    → NFT Bazaar unlocks
Lvl 16-20: FARMER       → Bridge City unlocks
Lvl 21-25: VETERAN      → The Dark Pool unlocks
Lvl 26-30: SURVIVOR     → Post-game mode unlocks
```

---

## Gear System (Security Tools = Game Items)

| Gear | Slot | Game Effect | Real-World Equivalent |
|------|------|-------------|----------------------|
| Paper Wallet | Wallet | Basic protection | Writing seed phrase |
| Hardware Wallet | Wallet | Blocks remote approvals | Ledger/Trezor |
| Bookmark Bar | Utility | Auto-detects fake URLs | Bookmarking real sites |
| Contract Reader | Scanner | Shows hidden functions | Etherscan verification |
| 2FA Shield | Shield | Blocks account takeover | Google Authenticator |
| Revoke Tool | Utility | Undo 1 approval/day | revoke.cash |
| Security Bot | Companion | Random scam warnings | Wallet Defender tools |
| Cold Storage | Wallet | 50% portfolio untouchable | Cold wallet strategy |
| Burner Wallet | Utility | Safe contract interaction | Burner wallets for mints |

---

## Scam Engine

### 5 Categories, 25+ Scam Types
```
🎣 PHISHING — Fake sites, fake support DMs, fake emails, fake QR
🍯 HONEYPOTS — Can't-sell tokens, fake airdrops, fake yield, dust attacks
🤝 SOCIAL ENGINEERING — Fake friends, urgency pressure, authority, group FOMO
📜 SMART CONTRACT — Unlimited approvals, hidden functions, proxy swaps, flash loans
🎭 RUG PULLS — Fake team, manufactured hype, liquidity removal, slow drain
```

### Delivery Channels (Scams hide in normal UX)
| Channel | Legit Example | Scam Version |
|---------|--------------|--------------|
| Notification | "Staking reward claimed" | "Action required: verify wallet" |
| DM | Whale Wendy sharing tip | Scammy Sam pretending to be Wendy |
| Activity feed | "Received 3.2 ETH" | "Unknown token: claim now" |
| Approval popup | "Approve 100 USDC" | "Approve UNLIMITED USDC" |

### 5 Difficulty Levels
```
★☆☆☆☆  Obvious — "Send me your seed phrase"
★★☆☆☆  Easy — Misspelled URL (uniswap.org vs app.uniswap.org)
★★★☆☆  Medium — Unlimited approval instead of exact amount
★★★★☆  Subtle — Fake team with stock photo LinkedIn profiles
★★★★★  Expert — Hidden malicious function in governance proposal
```

### Detection Mechanics
**Passive clues** (always visible): URL misspelling, grammar errors, unrealistic promises, urgency, unknown sender

**Active investigation** (costs time/resources):
- 🔍 Inspect link — reveals real URL
- 📋 Check contract — shows approval amounts
- 👤 Verify identity — cross-reference NPC
- 📰 Search news — verify project/event
- 🧠 Ask Sensei — cryptic hint (limited uses)

---

## 5 Chapters

### Chapter 1: Genesis Block (Days 1-5)
- **Theme:** Wallet basics, seed phrases
- **Portfolio:** $0 → $5,000
- **Scams:** Obvious phishing, seed phrase requests
- **Boss:** "The Seed Phrase Trap" — fake support asks for seed phrase

### Chapter 2: DEX District (Days 6-12)
- **Theme:** Trading, swaps, token approvals
- **Portfolio:** $5,000 → $25,000
- **Scams:** Fake DEX sites, honeypot tokens, unlimited approvals
- **Boss:** "The Rug Pull" — multi-day scam, project you invested in vanishes

### Chapter 3: NFT Bazaar (Days 13-20)
- **Theme:** NFTs, Discord, communities
- **Portfolio:** $25,000 → $60,000
- **Scams:** Fake mints, hacked Discord, counterfeit NFTs
- **Boss:** "The Discord Hack" — fake emergency migration

### Chapter 4: Bridge City (Days 21-28)
- **Theme:** Cross-chain, bridges, L2s
- **Portfolio:** $60,000 → $150,000
- **Scams:** Fake bridges, approval exploits on new chains
- **Boss:** "The Bridge Exploit" — real hack + opportunistic phishing

### Chapter 5: The Dark Pool (Days 29-40)
- **Theme:** Advanced DeFi, governance, MEV
- **Portfolio:** $150,000 → $1,000,000
- **Scams:** Governance attacks, social engineering at scale
- **Boss:** "The Inside Job" — combines every scam type

---

## NPC Characters

| NPC | Role | Arc |
|-----|------|-----|
| 🧙 **Satoshi Sensei** | Mentor, gives wisdom | Was once rekt himself. You discover his past in Ch.4 |
| 😈 **Scammy Sam** | Villain, new disguise every chapter | In Ch.5, revealed as a scam network |
| 💪 **Rekt Rick** | Cautionary tale | You help him rebuild. Your choices affect his outcome |
| 🐋 **Whale Wendy** | Successful trader | Gets hacked in Ch.3 — teaches anyone can be scammed |
| 🤖 **0xBot** | AI companion | Upgradeable, sometimes wrong (don't blindly trust tools) |

---

## ★ POST-GAME: Scam Scanner (Phase 2)

### What It Does
User pastes a crypto link, contract address, or token → app returns a risk report.

### Scanner Screen Layout
```
┌─────────────────────────────┐
│  🔍 SCAM SCANNER            │
│                             │
│  ┌───────────────────────┐  │
│  │ Paste link or address │  │
│  └───────────────────────┘  │
│  [Scan 🔍]                  │
│                             │
│  ─── Recent Scans ───       │
│  ✅ app.uniswap.org   SAFE  │
│  ⚠️ 0x9f3...a1c    RISKY   │
│  🔴 moontoken.io    SCAM   │
└─────────────────────────────┘
```

### Risk Report
```
┌─────────────────────────────┐
│  RISK REPORT                │
│                             │
│  🔴 HIGH RISK  (Score: 82)  │
│                             │
│  Findings:                  │
│  🚩 Contract not verified   │
│  🚩 Top wallet holds 73%   │
│  🚩 Sell function disabled  │
│  ✅ Has liquidity ($12k)    │
│                             │
│  "You learned about this    │
│   in Chapter 2: Honeypots"  │
│                             │
│  [Share Report] [Scan New]  │
└─────────────────────────────┘
```

### Data Sources (Free APIs)
- **GoPlus Security API** — token risk, contract audit
- **Token Sniffer** — scam detection
- **DexScreener** — liquidity, price data
- **Etherscan/BSCScan** — contract verification

### Connection to Game
After scanning, the app connects findings to game chapters:
- "This token has a honeypot pattern — you survived this in Chapter 2"
- "Unverified contract detected — remember the approval exploit from Chapter 2?"

This reinforces learning AND gives the game lasting utility.

---

## ★ POST-GAME: Live Threat Feed (Phase 2)

### What It Does
Daily feed of real crypto scam/hack news, connected to game lessons.

### Threat Feed Layout
```
┌─────────────────────────────┐
│  🔔 LIVE THREATS            │
│  Updated 2h ago             │
│                             │
│  ┌────────────────────────┐ │
│  │ 🔴 $2.3M drained from  │ │
│  │ DeFi protocol via       │ │
│  │ approval exploit        │ │
│  │                         │ │
│  │ You trained for this    │ │
│  │ → Chapter 2, Scenario 4 │ │
│  │                         │ │
│  │ [Read More] [Re-play]   │ │
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │ ⚠️ New phishing wave    │ │
│  │ targeting MetaMask      │ │
│  │ users via fake emails   │ │
│  │                         │ │
│  │ Related: Chapter 1      │ │
│  │ [Read More]             │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

### Data Sources
- **Rekt.news** RSS — DeFi hacks/exploits
- **Web3 is Going Great** — incident tracker
- **Twitter/X API** — trending scam alerts
- Or manually curated weekly (viable for solo dev at small scale)

### "Re-play" Feature
When a real-world scam matches a game scenario, users can re-play that scenario. This:
- Refreshes their knowledge
- Drives re-engagement with completed content
- Connects game to reality

---

## ★ Challenge System

### Top Bar Button (🏆)
Always visible on Wallet Home. Tapping opens Challenge Creator.

### How It Works
```
1. Player creates a scam scenario (choose type + difficulty)
2. App generates a shareable link
3. Friend opens link → plays the scenario in-app
4. Result: "Your friend got REKT!" or "Your friend survived!"
5. Both players see comparison stats
```

### Challenge Creator Screen
```
┌─────────────────────────────┐
│  🏆 CREATE CHALLENGE        │
│                             │
│  Pick your scam type:       │
│  [Phishing] [Honeypot]     │
│  [Social] [Contract] [Rug]  │
│                             │
│  Difficulty:                │
│  ★☆☆☆☆  ★★★☆☆  ★★★★★      │
│                             │
│  Custom message (optional): │
│  ┌───────────────────────┐  │
│  │ "Bet you can't spot   │  │
│  │  this one 😈"          │  │
│  └───────────────────────┘  │
│                             │
│  [Create & Share 🔗]        │
│                             │
│  ─── My Challenges ───      │
│  "Honeypot Trap" → 4/7 rekt │
│  "Fake DM" → 2/5 rekt      │
└─────────────────────────────┘
```

### Challenge Result (Receiver)
```
┌─────────────────────────────┐
│  🏆 CHALLENGE from ApeKing  │
│                             │
│  "Bet you can't spot this   │
│   one 😈"                    │
│                             │
│  💀 YOU GOT REKT            │
│                             │
│  ApeKing's stats:           │
│  4 out of 7 friends rekt    │
│                             │
│  [Challenge Back 🏆]        │
│  [Share Result 📸]          │
└─────────────────────────────┘
```

---

## Engagement Systems

### Streak
```
Day 7:    🔥 "One week un-rekt!"     + bonus coins
Day 14:   🔥🔥 "Two weeks!"          + rare gear
Day 30:   🔥🔥🔥 "Monthly survivor!" + exclusive badge
Day 100:  💎 "Diamond Hands"         + prestige title

Breaks ONLY if you get rekt. NOT if you skip a day.
```

### Achievements
| Category | Examples |
|----------|---------|
| Survival | 7-day streak, survived all Ch.1 scams, never lost to phishing |
| Detection | Spotted 10 scams, found hidden contract function, ID'd Scammy Sam |
| Wealth | First $10k, portfolio ATH $100k, $1M club |
| Story | Helped Rick rebuild, unmasked Scammy Sam, saved Whale Wendy |
| Social | Challenged 5 friends, rekt 10 challengers, 100% challenge survival |
| Scanner | Scanned 50 contracts, flagged 10 real scams, shared 5 reports |

### Share System
Both REKT and Survived outcomes generate a screenshot card:
```
💀 GOT REKT          🛡️ SURVIVED
-$34,201              $47,832 saved
Attack: Fake Airdrop  Blocked: Fake DM
73% fell for this     Top 27% of players
── REKT ──            ── REKT ──
```

---

## Tech Architecture

### Stack
```
App:       React Native (Android first)
           OR Flutter
           OR PWA → wrap with Capacitor for Play Store

Backend:   Firebase (free tier)
           ├── Auth (anonymous + Google login)
           ├── Firestore (player data, progress, challenges)
           ├── Cloud Functions (daily rewards, scam scheduling)
           └── Remote Config (A/B test scenarios)

Scanner:   Free APIs
           ├── GoPlus Security API
           ├── Token Sniffer API
           └── DexScreener API

Threat Feed: RSS parsing
           ├── rekt.news feed
           └── Manual curation (weekly)

Content:   JSON-driven scenario files
           └── Easy to add new scams without code changes

Analytics: Firebase Analytics + BigQuery
```

### Data Model (Firestore)
```
users/
  {userId}/
    profile: { name, class, level, xp, stats, streak, hp }
    portfolio: { holdings[], totalValue, dailyChange }
    progress: { currentChapter, completedScenarios[], achievements[] }
    gear: { equipped[], available[] }
    scanHistory: [{ url, riskScore, date }]

scenarios/
  {scenarioId}/
    chapter, difficulty, type, dialogueTree, outcomes

challenges/
  {challengeId}/
    creatorId, scenarioId, message, results[]

threats/
  {threatId}/
    title, description, relatedChapter, date, source
```

---

## Build Priority

### Sprint 1: MVP Core (Week 1-2)
```
✅ Onboarding — 3 splash screens + character select
✅ Wallet Home — fake portfolio, holdings, activity feed
✅ Top bar — Challenge button + notification bell
✅ Bottom nav — 5 tabs (Scanner = "coming soon")
✅ 5 scam scenarios — Chapter 1 complete
✅ Scam flow — scenario → approval → REKT/survived → education
✅ XP + level system
✅ Daily reward claim
✅ Share card generation
```

### Sprint 2: Depth (Week 3-4)
```
⬜ Character class effects (different scam types per class)
⬜ Gear system — 3 basic items
⬜ NPC dialogues — Sensei + Scammy Sam
⬜ Streak tracking + achievements
⬜ Chapter 2 scenarios (5-7 scams)
⬜ World Map screen
⬜ Leaderboard (Firebase)
```

### Sprint 3: Post-Game (Week 5-6)
```
⬜ Scam Scanner — integrate GoPlus API
⬜ Risk report screen
⬜ Connection to game chapters ("you trained for this")
⬜ Challenge Creator — scenario selection + share link
⬜ Challenge result screen
```

### Sprint 4: Retention (Week 7-8)
```
⬜ Live Threat Feed — RSS integration
⬜ Re-play feature (replay scenarios from feed)
⬜ Chapters 3-5 scenarios
⬜ Full NPC story arcs
⬜ Weekly events system
⬜ New Game+ mode
```

---

## Launch Checklist

### Google Play Store
- [ ] Developer account ($25 one-time)
- [ ] App icon (512x512) + feature graphic (1024x500)
- [ ] Screenshots — 4+ per device size
- [ ] Privacy policy (host on GitHub Pages — free)
- [ ] App description + keywords
- [ ] Content rating questionnaire
- [ ] Target audience declaration
- [ ] Review time: ~hours to 2 days

### Marketing (Free)
- [ ] Post "I got REKT" share cards on Crypto Twitter
- [ ] Submit to Product Hunt
- [ ] Post in r/cryptocurrency, r/web3, r/CryptoScamAlert
- [ ] Share in Telegram/Discord crypto communities
- [ ] Medium/blog post: "I built a crypto scam simulator"
- [ ] Ask Herond community to try it

---

## Success Metrics

### Week 1 (Launch)
- 100+ downloads
- Users complete Chapter 1
- 10+ share cards posted on social media

### Month 1
- 1,000+ downloads
- 40% Day-7 retention
- Scanner used 100+ times

### Month 3
- 5,000+ downloads
- Challenge feature driving 30% of new installs
- Threat feed viewed daily by 20% of users

### Month 6
- 10,000+ downloads
- Recognized in crypto security community
- B2B inquiries from wallets/exchanges

---

## The Value Equation

```
GAME (Phase 1)          = Acquisition + Education
   ↓ user finishes
SCANNER + FEED (Phase 2) = Retention + Daily Utility
   ↓ user shares
CHALLENGE                = Virality + Growth
   ↓ friend downloads
GAME (Phase 1)          = New user acquisition
   ↓ cycle repeats
```

**The game teaches. The scanner applies. The feed retains. The challenge grows.**

You're not building a course. You're building a crypto security platform that starts as a game.

---

*Ready to build. Ship the MVP in 2 weeks. Iterate from there.*
