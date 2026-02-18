# REKT — Phase 4: Game Logic Engine
## Complete Claude Code Prompt Guide (12 Prompts)

---

## 📋 What Phase 4 Covers

Phase 3 built the screens. Phase 4 makes them WORK — this is the brain
of the game: stores, engines, data, formulas, and the flow that ties
everything into a playable experience.

```
PROMPT ORDER:

STATE MANAGEMENT (4 stores):
  Prompt 1  → playerStore (class, stats, HP, XP, leveling)
  Prompt 2  → portfolioStore (holdings, economy, investments)
  Prompt 3  → scenarioStore (scenario loading, dialogue, choices)
  Prompt 4  → gameStore (chapters, progress, achievements, streaks)

SCENARIO ENGINE:
  Prompt 5  → Scenario JSON schema + engine/runner
  Prompt 6  → Chapter 1 scenarios (5 scams)
  Prompt 7  → Scam delivery system (notifications, activity, DMs)

GAME SYSTEMS:
  Prompt 8  → XP + leveling + stat formulas
  Prompt 9  → Economy engine (daily yields, investments, rewards)
  Prompt 10 → Gear system + class abilities
  Prompt 11 → Achievement + streak tracker

WIRING:
  Prompt 12 → Connect all stores to all screens
```

---

## ⚠️ RULES

1. **Run `/clear` before each prompt** — stores are complex, keep context clean
2. **Always say**: "Reference docs/REKT-Final-Build-Plan.md for the full game design"
3. **Test stores independently** — after each store, ask Claude to write a quick test
4. **These prompts should run AFTER Phase 3** — screens must exist first

---

## PROMPT 1 — playerStore (Core Player State)

```
Create src/store/playerStore.ts using Zustand with persist middleware
(use AsyncStorage for React Native).

Reference the Character System and Stats sections in 
docs/REKT-Final-Build-Plan.md.

TYPE DEFINITIONS:

type PlayerClass = 'ape' | 'analyst' | 'shadow' | 'degen';

interface ClassConfig {
  id: PlayerClass;
  name: string;
  emoji: string;
  description: string;
  startingBonus: string;
  weakness: string;
  uniqueAbility: string;
  statModifiers: {
    security: number;   // -10 to +10
    detection: number;
    wealth: number;
    knowledge: number;
    hp: number;
  };
}

interface PlayerStats {
  security: number;    // 0-100, raised by using security tools
  detection: number;   // 0-100, raised by correctly identifying scams
  wealth: number;      // 0-100, raised by growing portfolio
  knowledge: number;   // 0-100, raised by reading post-mortems
  hp: number;          // 0-100, zero = game over, restart chapter
}

interface PlayerState {
  // Identity
  username: string;
  playerClass: PlayerClass | null;
  hasOnboarded: boolean;

  // Progression
  level: number;         // 1-30
  xp: number;            // current XP
  xpToNextLevel: number; // XP needed for next level
  title: string;         // NOOB, TRADER, COLLECTOR, FARMER, VETERAN, SURVIVOR

  // Stats
  stats: PlayerStats;
  
  // Resources
  coins: number;             // 🪙 main currency
  securityTokens: number;    // 🛡️ earned by catching scams
  reputation: number;        // 🅰️ from story choices

  // Streak
  streak: number;
  lastClaimDate: string | null;  // ISO date string

  // Gear
  equippedGear: string[];     // gear IDs
  unlockedGear: string[];     // available to equip

  // Abilities (class-specific)
  abilityUsesRemaining: number;  // resets daily
  diamondHandsUsed: boolean;     // Ape's one-time rug survival
}

CLASS CONFIGURATIONS (store as constant):

APE:    { statModifiers: { security: -5, detection: -10, wealth: +15, knowledge: 0, hp: 0 } }
ANALYST:{ statModifiers: { security: +5, detection: +15, wealth: -10, knowledge: +5, hp: 0 } }
SHADOW: { statModifiers: { security: +5, detection: +5, wealth: 0, knowledge: 0, hp: +5 } }
DEGEN:  { statModifiers: { security: -10, detection: -5, wealth: +10, knowledge: 0, hp: +10 } }

ACTIONS (store methods):

// Setup
setUsername(name: string)
selectClass(playerClass: PlayerClass) — applies stat modifiers
completeOnboarding()

// XP & Leveling
addXP(amount: number) — check if level up triggered
levelUp() — recalculate title, xpToNextLevel, unlock new content

// Stats
updateStat(stat: keyof PlayerStats, amount: number) — clamp 0-100
takeDamage(amount: number) — reduce HP, check game over
healHP(amount: number) — restore HP, clamp at 100
isGameOver() — returns true if HP <= 0

// Resources
addCoins(amount: number)
spendCoins(amount: number) — return false if insufficient
addSecurityTokens(amount: number)
addReputation(amount: number)

// Streak
claimDailyReward() — increment streak if eligible, update lastClaimDate
breakStreak() — called when player gets rekt
getStreakBonus() — returns multiplier based on streak length

// Gear
equipGear(gearId: string)
unequipGear(gearId: string)
unlockGear(gearId: string)

// Abilities
useAbility() — decrement abilityUsesRemaining
resetDailyAbilities() — called on new day

// Reset
resetAll() — clear everything for settings reset

LEVELING FORMULA:
  XP to next level = level * 300
  Levels 1-5:   title = "NOOB"
  Levels 6-10:  title = "TRADER"
  Levels 11-15: title = "COLLECTOR"
  Levels 16-20: title = "FARMER"
  Levels 21-25: title = "VETERAN"
  Levels 26-30: title = "SURVIVOR"

STARTING VALUES:
  level: 1, xp: 0, xpToNextLevel: 300
  coins: 10000, securityTokens: 0, reputation: 0
  stats: { security: 20, detection: 20, wealth: 20, knowledge: 10, hp: 100 }
  streak: 0, equippedGear: ['paper-wallet'], unlockedGear: ['paper-wallet']

Use zustand/middleware for persist with AsyncStorage.
Export the store and all types.
```

### After:
```
> Write a quick test: import playerStore, select the Ape class, 
  add 500 XP, verify level and stats. Log the results to console.
  Then git commit "feat: add playerStore with class system and leveling"
```

---

## PROMPT 2 — portfolioStore (Economy & Holdings)

```
Create src/store/portfolioStore.ts using Zustand with persist.

Reference the Economy System and Investment Options in 
docs/REKT-Final-Build-Plan.md.

TYPE DEFINITIONS:

interface Token {
  id: string;
  name: string;
  symbol: string;
  emoji: string;
  iconColor: string;
  amount: number;
  pricePerUnit: number;
  dailyChangePct: number;    // e.g., +3.1 or -2.4
  riskLevel: 'low' | 'medium' | 'high';
  scamExposure: 'low' | 'medium' | 'high' | 'very-high';
  isScamToken: boolean;       // hidden flag — is this a honeypot/rug?
  isSuspicious: boolean;      // shows yellow tint in UI
}

interface Investment {
  id: string;
  name: string;
  type: 'staking' | 'liquidity-pool' | 'token' | 'nft' | 'yield-farm';
  amountInvested: number;
  dailyReturnPct: number;     // percentage
  riskLevel: 'low' | 'medium' | 'high';
  scamExposure: 'low' | 'medium' | 'high' | 'very-high';
  isActive: boolean;
  daysActive: number;
  rugPullDay?: number;        // if set, rug pull triggers on this day
}

interface Transaction {
  id: string;
  type: 'received' | 'sent' | 'swap' | 'staking-reward' | 'airdrop' | 
        'investment-return' | 'rekt-loss' | 'dust-attack';
  label: string;
  sublabel: string;
  amount: number;              // positive or negative
  timestamp: string;           // ISO date
  isSuspicious: boolean;       // flagged for scam delivery
  linkedScenarioId?: string;   // tapping this triggers a scenario
}

interface PortfolioState {
  // Core
  holdings: Token[];
  totalValue: number;           // sum of all holdings
  dailyChange: number;          // dollar change
  dailyChangePct: number;       // percentage change
  
  // Investments
  activeInvestments: Investment[];
  
  // History
  transactions: Transaction[];
  portfolioHistory: number[];   // daily snapshots for chart
  
  // All-time stats
  allTimeHigh: number;
  totalEarned: number;
  totalLost: number;
}

STARTING HOLDINGS (after onboarding, player starts with $10,000):

1. ETH — { symbol: 'ETH', emoji: 'Ξ', amount: 2.5, pricePerUnit: 2875, 
   dailyChangePct: 3.1, riskLevel: 'low', isScamToken: false }
   
2. USDC — { symbol: 'USDC', emoji: '$', amount: 1500, pricePerUnit: 1.00,
   dailyChangePct: 0, riskLevel: 'low', isScamToken: false }
   
3. REKT token — { symbol: 'REKT', emoji: '💀', amount: 1000, pricePerUnit: 0.50,
   dailyChangePct: 12.5, riskLevel: 'medium', isScamToken: false }

Total starting value: ~$10,187.50

CHAPTER PROGRESSION TARGETS (portfolio grows as player advances):
  Chapter 1: $0 → $5,000 (but we start at $10,000 for fun factor)
  Chapter 2: $5,000 → $25,000
  Chapter 3: $25,000 → $60,000
  Chapter 4: $60,000 → $150,000
  Chapter 5: $150,000 → $1,000,000

ACTIONS:

// Portfolio management
initializePortfolio(playerClass: string) — set starting holdings with class modifiers
recalculateTotals() — sum all holdings, update totalValue/dailyChange
addHolding(token: Token)
removeHolding(tokenId: string)
updateTokenPrice(tokenId: string, newPrice: number, changePct: number)

// Transactions
addTransaction(tx: Omit<Transaction, 'id' | 'timestamp'>) — auto-generate id + timestamp
getRecentTransactions(count: number) — return last N
getSuspiciousTransactions() — return only suspicious ones (for scam delivery)

// Investments
createInvestment(investment: Omit<Investment, 'id' | 'daysActive'>) 
processInvestmentReturns() — called daily, adds returns to portfolio
checkRugPulls() — check if any investments hit their rugPullDay
removeInvestment(investmentId: string)

// Economy
addFunds(amount: number, source: string) — adds to a default token (USDC or coins)
drainFunds(amount: number, reason: string) — when rekt, subtract from portfolio
  IMPORTANT: drainFunds should pick from largest holding first, or drain specific token
getPortfolioGrowthRate() — used for daily yield calculation

// Daily simulation
simulateMarketDay() — randomize token prices within realistic ranges
  ETH: ±5% daily swing
  USDC: ±0.1% (stablecoin)
  Risky tokens: ±20% daily swing
  Scam tokens: always trending up (to bait players) until rug pull

// Scam injection
injectScamToken(token: Token) — adds a suspicious token to holdings (dust attack)
injectScamTransaction(tx: Transaction) — adds suspicious activity item

// Snapshots
takeSnapshot() — push current totalValue to portfolioHistory
getChartData(days: number) — return last N days of history

// Reset
resetPortfolio()

CLASS MODIFIERS for starting portfolio:
  Ape: +20% starting value (fast growth)
  Analyst: same starting value, +1 extra holding (diversified)
  Shadow: same value, all in stablecoins (conservative)
  Degen: random allocation, 1 already-suspicious token included
```

### After:
```
> Write a test: initialize portfolio for Ape class, simulate 3 market days,
  add a scam transaction, verify totals and transaction count.
  Git commit "feat: add portfolioStore with economy engine"
```

---

## PROMPT 3 — scenarioStore (Scenario State Machine)

```
Create src/store/scenarioStore.ts using Zustand.

This store manages the ACTIVE scenario the player is currently in.
It does NOT store scenario definitions (those live in JSON files).
It manages the runtime state of playing through a scenario.

TYPE DEFINITIONS:

type ScamCategory = 'phishing' | 'honeypot' | 'social-engineering' | 
                    'smart-contract' | 'rug-pull';

type DeliveryChannel = 'notification' | 'dm' | 'activity-feed' | 
                       'approval-popup' | 'npc-conversation';

type ChoiceOutcome = 'rekt' | 'survived' | 'clue' | 'hint' | 
                     'continue' | 'approval-popup';

interface ScenarioMessage {
  id: string;
  sender: 'npc' | 'system' | 'player';
  senderName?: string;
  senderAvatar?: string;
  text: string;
  delay?: number;           // ms delay before showing (typing effect)
}

interface ScenarioChoice {
  id: string;
  text: string;
  emoji: string;
  outcome: ChoiceOutcome;
  nextNodeId?: string;       // for branching dialogue
  xpReward?: number;
  statChange?: { stat: string; amount: number };
  revealText?: string;       // shown after choosing (for clues/hints)
  damageAmount?: number;     // how much HP/money lost if rekt
}

interface ScenarioNode {
  id: string;
  messages: ScenarioMessage[];
  choices: ScenarioChoice[];
  isEnd?: boolean;
}

interface ScenarioEducation {
  attackName: string;
  difficulty: string;         // "★★★☆☆"
  category: ScamCategory;
  howItWorked: Array<{ step: number; text: string; highlight?: string }>;
  redFlags: string[];
  irlProtection: string[];
}

interface ScenarioDefinition {
  id: string;
  chapter: number;
  scenarioIndex: number;      // position within chapter (1-5)
  title: string;
  subtitle: string;
  icon: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: ScamCategory;
  deliveryChannel: DeliveryChannel;
  npcAvatar: string;
  npcName: string;
  isBoss: boolean;
  
  // Dialogue tree
  nodes: ScenarioNode[];       // node[0] is starting node
  
  // Passive clues (always visible to player)
  passiveClues: string[];      // e.g., "URL misspelling", "urgent language"
  
  // Active investigation options
  activeInvestigations: Array<{
    type: 'inspect-link' | 'check-contract' | 'verify-identity' | 
          'search-news' | 'ask-sensei';
    result: string;             // what the investigation reveals
    cost?: number;              // resource cost (time, sensei uses)
  }>;
  
  // Education content (shown after outcome)
  education: ScenarioEducation;
  
  // Rewards/Consequences
  rektConsequences: {
    moneyLost: number;          // dollar amount or percentage
    moneyLostType: 'fixed' | 'percentage';
    hpLost: number;
    streakBroken: boolean;
  };
  survivedRewards: {
    xp: number;
    securityTokens: number;
    coins: number;
    statBoosts: Array<{ stat: string; amount: number }>;
  };
  
  // Stats
  communityRektRate: number;    // % of players who fell for this (fake stat)
}

RUNTIME STATE:

interface ScenarioState {
  // Current scenario
  activeScenario: ScenarioDefinition | null;
  currentNodeId: string;
  
  // Dialogue state
  visibleMessages: ScenarioMessage[];   // messages shown so far
  isTyping: boolean;                     // NPC typing indicator
  
  // Player state within scenario
  choicesMade: string[];                 // choice IDs selected
  cluesDiscovered: string[];             // from active investigation
  senseiUsesLeft: number;                // starts at 2 per scenario
  
  // Outcome
  outcome: 'rekt' | 'survived' | null;
  outcomeDetails: {
    choiceThatCausedIt: string;
    amountLost?: number;
    amountSaved?: number;
    attackType?: string;
  } | null;
}

ACTIONS:

// Scenario lifecycle
loadScenario(scenarioId: string) — load from JSON, reset all runtime state
  Import scenario JSON dynamically from src/data/scenarios/
startScenario() — display first node's messages
getCurrentNode() — return the active node

// Dialogue progression
revealNextMessage() — show next message in current node with typing delay
showChoices() — when all messages shown, reveal choice buttons

// Player actions
selectChoice(choiceId: string) — process the choice:
  - If outcome is 'rekt': set outcome, calculate losses
  - If outcome is 'survived': set outcome, calculate rewards
  - If outcome is 'clue': show revealText, stay in scenario
  - If outcome is 'hint': show Sensei hint, decrement senseiUsesLeft
  - If outcome is 'continue': move to nextNodeId, show new messages
  - If outcome is 'approval-popup': trigger approval popup overlay

// Investigation
performInvestigation(type: string) — reveal investigation result, 
  add to cluesDiscovered

// Outcome processing
processRekt() — apply consequences to playerStore and portfolioStore
processSurvived() — apply rewards to playerStore and portfolioStore
  IMPORTANT: these should call the other stores' action methods

// Education
getEducation() — return the education content for post-mortem screen

// Reset
resetScenario() — clear everything for next scenario
```

### After:
```
> Write a test: load a scenario, advance through messages, 
  make a choice that leads to 'rekt', verify outcome is set.
  Git commit "feat: add scenarioStore with dialogue state machine"
```

---

## PROMPT 4 — gameStore (Progress, Chapters, Achievements)

```
Create src/store/gameStore.ts using Zustand with persist.

This tracks overall game progress, chapter completion, achievements,
and streak milestones.

Reference the Chapters, Achievements, and Engagement Systems sections
in docs/REKT-Final-Build-Plan.md.

TYPE DEFINITIONS:

interface ChapterInfo {
  id: number;                   // 1-5
  name: string;
  theme: string;
  emoji: string;
  requiredLevel: number;
  scenarioIds: string[];        // list of scenario IDs in this chapter
  bossScenarioId: string;
  portfolioTarget: number;      // target $ to "complete" chapter
}

interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: 'survival' | 'detection' | 'wealth' | 'story' | 'social' | 'scanner';
  condition: {
    type: 'streak' | 'scenarios-survived' | 'scenarios-completed' | 
          'portfolio-value' | 'scams-caught' | 'chapter-complete' |
          'specific-action' | 'gear-collected' | 'level-reached';
    value: number;
    specificId?: string;         // for specific scenario/action checks
  };
  reward: {
    xp?: number;
    coins?: number;
    securityTokens?: number;
    gearUnlock?: string;
    title?: string;
  };
  unlockedAt?: string;           // ISO date when earned, null if locked
}

interface StreakMilestone {
  days: number;
  name: string;
  emoji: string;
  reward: { coins?: number; xp?: number; gearUnlock?: string; title?: string };
  claimed: boolean;
}

GAME STATE:

interface GameState {
  // Chapter progress
  currentChapter: number;         // 1-5
  chapters: ChapterInfo[];        // static chapter data
  
  // Scenario tracking
  completedScenarios: string[];   // scenario IDs that are done
  scenarioResults: Record<string, {  // scenarioId → result
    outcome: 'rekt' | 'survived';
    choicesMade: string[];
    timestamp: string;
    attemptCount: number;
  }>;
  
  // Current day (game simulation day, not real day)
  gameDay: number;                 // starts at 1, increments on daily claim
  
  // Achievements
  achievements: Achievement[];
  
  // Streaks
  streakMilestones: StreakMilestone[];
  
  // NPC relationship tracking
  npcRelationships: Record<string, number>;  // npcId → relationship score
  // 'sensei' | 'rick' | 'wendy' | 'sam' | 'bot'
  
  // Post-game flags
  hasCompletedGame: boolean;       // all 5 chapters done
  scannerUnlocked: boolean;        // unlocks scanner functionality
  threatFeedUnlocked: boolean;
}

CHAPTER DEFINITIONS (constant data):

Chapter 1: "Genesis Block"
  emoji: 🏠, requiredLevel: 1
  scenarioIds: ['ch1-fake-support-dm', 'ch1-seed-phrase-request', 
                'ch1-fake-airdrop', 'ch1-phishing-email', 'ch1-seed-phrase-trap']
  bossScenarioId: 'ch1-seed-phrase-trap'
  portfolioTarget: 5000

Chapter 2: "DEX District"
  emoji: 🦊, requiredLevel: 6
  scenarioIds: ['ch2-fake-dex', 'ch2-honeypot-token', 'ch2-unlimited-approval',
                'ch2-fake-swap', 'ch2-rug-pull']
  bossScenarioId: 'ch2-rug-pull'
  portfolioTarget: 25000

Chapter 3: "NFT Bazaar"
  emoji: 🎨, requiredLevel: 11
  scenarioIds: ['ch3-fake-mint', 'ch3-discord-hack', 'ch3-counterfeit-nft',
                'ch3-fake-collab', 'ch3-discord-migration']
  bossScenarioId: 'ch3-discord-migration'
  portfolioTarget: 60000

Chapter 4: "Bridge City"
  emoji: 🌉, requiredLevel: 16
  scenarioIds: ['ch4-fake-bridge', 'ch4-chain-approval', 'ch4-bridge-exploit',
                'ch4-fake-l2', 'ch4-bridge-phishing']
  bossScenarioId: 'ch4-bridge-exploit'
  portfolioTarget: 150000

Chapter 5: "The Dark Pool"
  emoji: 💀, requiredLevel: 21
  scenarioIds: ['ch5-governance-attack', 'ch5-social-whale', 'ch5-mev-trap',
                'ch5-insider-info', 'ch5-inside-job']
  bossScenarioId: 'ch5-inside-job'
  portfolioTarget: 1000000

ACHIEVEMENT DEFINITIONS (initial set — 15 achievements):

Survival:
1. "🔥 One Week" — 7-day streak — +200 XP
2. "🔥🔥 Two Weeks" — 14-day streak — +500 XP, unlock rare gear
3. "🔥🔥🔥 Monthly Survivor" — 30-day streak — +1000 XP, badge
4. "💎 Diamond Hands" — 100-day streak — prestige title

Detection:
5. "🔍 Eagle Eye" — Spot 10 scams — +100 XP
6. "🕵️ Code Reader" — Find hidden contract function — +200 XP
7. "🎭 Unmasked" — Identify Scammy Sam in disguise — +300 XP

Wealth:
8. "📈 Five Figures" — Portfolio hits $10,000 — +50 coins
9. "🏦 Six Figures" — Portfolio hits $100,000 — +200 coins
10. "🐋 Millionaire" — Portfolio hits $1,000,000 — special title

Story:
11. "🤝 Helping Hand" — Help Rekt Rick rebuild — +100 reputation
12. "🧙 Sensei's Secret" — Discover Sensei's past (Ch.4) — +500 XP
13. "🦸 Everyone Falls" — Save Whale Wendy (Ch.3) — +300 XP

Chapter:
14. "🏠 Genesis Graduate" — Complete Chapter 1 — +300 XP
15. "🏆 Game Complete" — Complete all 5 chapters — scanner unlocked

STREAK MILESTONES:
  Day 7: { name: "One week un-rekt!", coins: 500, xp: 200 }
  Day 14: { name: "Two weeks!", coins: 1000, xp: 500, gearUnlock: 'bookmark-bar' }
  Day 30: { name: "Monthly survivor!", coins: 2500, xp: 1000 }
  Day 100: { name: "Diamond Hands", xp: 5000, title: "💎 Diamond Hands" }

ACTIONS:

// Scenario progress
completeScenario(scenarioId: string, outcome: 'rekt' | 'survived', 
                 choicesMade: string[])
isScenarioCompleted(scenarioId: string) — boolean
getChapterProgress(chapterId: number) — { completed: number, total: number }
canAccessChapter(chapterId: number) — check player level

// Chapter management
advanceChapter() — move to next chapter if current is complete
isChapterComplete(chapterId: number) — all scenarios done
getCurrentChapterScenarios() — return scenario IDs for active chapter
getNextUncompletedScenario() — return next scenario to play

// Achievements
checkAchievements(playerStore, portfolioStore) — iterate all achievements,
  check conditions against current state, unlock any that are met
  IMPORTANT: This should be called after every significant action
unlockAchievement(achievementId: string)
getUnlockedAchievements() — return earned achievements
getLockedAchievements() — return locked ones

// Streaks
checkStreakMilestones(currentStreak: number) — check if any milestone reached
claimStreakReward(milestoneDay: number) — mark as claimed, apply rewards

// Game day
advanceGameDay() — increment gameDay, trigger daily events
getDayInChapter() — which day of current chapter

// NPC
updateNPCRelationship(npcId: string, delta: number)
getNPCRelationship(npcId: string) — return score

// Post-game
checkGameCompletion() — if all chapters done, unlock post-game content
unlockScanner()
unlockThreatFeed()

// Reset
resetGame()
```

### After:
```
> Test: complete 3 scenarios, check chapter progress shows 3/5. 
  Verify achievements auto-check. Git commit "feat: add gameStore 
  with chapters, achievements, and streak system"
```

---

## PROMPT 5 — Scenario JSON Schema + Engine

```
Create the scenario engine that loads and runs JSON scenario files.

Create src/engine/ScenarioEngine.ts:

This is a utility class (not a store) that:
1. Loads scenario JSON files by ID
2. Validates them against the schema
3. Provides helper methods for the scenario screen

SCENARIO JSON SCHEMA (create src/data/scenarios/schema.ts):

Define the TypeScript interface for a scenario JSON file.
Use the ScenarioDefinition type from scenarioStore.

SCENARIO LOADER (src/engine/ScenarioEngine.ts):

class ScenarioEngine {
  // Load a scenario by ID
  static async loadScenario(scenarioId: string): Promise<ScenarioDefinition>
    — Import from src/data/scenarios/{scenarioId}.json
    — Validate required fields
    — Return the parsed scenario

  // Get all scenarios for a chapter
  static getScenariosForChapter(chapter: number): string[]
    — Return scenario IDs from gameStore chapter config

  // Pick a random scam to deliver
  static pickRandomScam(chapter: number, excludeCompleted: string[]): string | null
    — Choose an uncompleted scenario from current chapter
    — Weighted by difficulty (easier first)

  // Generate a scam notification from a scenario
  static generateScamNotification(scenario: ScenarioDefinition): {
    title: string;
    subtitle: string;
    icon: string;
    isSuspicious: boolean;
    linkedScenarioId: string;
  }

  // Generate a scam activity entry from a scenario
  static generateScamActivity(scenario: ScenarioDefinition): Transaction
    — Creates a suspicious transaction for the activity feed

  // Check if player's gear affects this scenario
  static checkGearEffects(
    scenario: ScenarioDefinition, 
    equippedGear: string[]
  ): {
    autoDetected: boolean;      // gear auto-spotted the scam
    hintsRevealed: string[];    // extra clues from gear
    damageReduced: number;      // % damage reduction if rekt
  }

  // Check if player's class affects this scenario
  static checkClassEffects(
    scenario: ScenarioDefinition,
    playerClass: string
  ): {
    isWeakAgainst: boolean;     // class weakness matches scam type
    abilityApplicable: boolean; // class ability can be used
    bonusClues: string[];       // class-specific hints
  }

  // Calculate REKT consequences
  static calculateRektDamage(
    scenario: ScenarioDefinition,
    portfolioValue: number,
    equippedGear: string[],
    playerClass: string
  ): { moneyLost: number; hpLost: number; finalDamage: number }

  // Calculate survival rewards 
  static calculateSurvivedRewards(
    scenario: ScenarioDefinition,
    playerLevel: number,
    streak: number
  ): { xp: number; coins: number; securityTokens: number; statBoosts: any[] }
    — Apply streak multiplier: 1 + (streak * 0.05), max 2x
}

Also create a SCENARIO REGISTRY file at src/data/scenarios/index.ts
that maps scenario IDs to their JSON imports, so the engine can 
dynamically load them:

const SCENARIO_REGISTRY: Record<string, () => Promise<ScenarioDefinition>> = {
  'ch1-fake-support-dm': () => import('./ch1-fake-support-dm.json'),
  'ch1-seed-phrase-request': () => import('./ch1-seed-phrase-request.json'),
  // ... etc
};
```

### After:
```
> Git commit "feat: add scenario engine with loader and calculations"
```

---

## PROMPT 6 — Chapter 1 Scenarios (5 JSON Files) ⭐

```
Create 5 scenario JSON files for Chapter 1: Genesis Block.
Put each in src/data/scenarios/.

Reference Chapter 1 specs in docs/REKT-Final-Build-Plan.md:
- Theme: Wallet basics, seed phrases
- Scams: Obvious phishing, seed phrase requests
- Difficulty: ★☆☆☆☆ to ★★☆☆☆
- Boss: "The Seed Phrase Trap"

All 5 scenarios must use the ScenarioDefinition type from the 
scenarioStore. Each needs complete dialogue trees, multiple choices
with branching paths, and full education content.

=== SCENARIO 1: ch1-fake-support-dm.json ===
Difficulty: ★☆☆☆☆ (1)
Category: phishing
Channel: dm
Title: "Fake Support DM"
Subtitle: "from 'MetaMask Support'"

Story: Player receives a DM from someone claiming to be MetaMask support
saying their wallet has unauthorized access. They want the player to 
"verify" by sharing their seed phrase.

NPC: 🦊 "MetaMask Support" (actually Scammy Sam)

Dialogue tree (3 nodes):
  Node 1 (opening):
    Messages:
    - [system] "💬 New conversation"
    - [npc] "Hi! MetaMask Support here. We detected unauthorized access 
      on your wallet 0x7f2...8a4."
    - [npc] "Verify your identity immediately to secure funds."
    - [npc] "⚠️ You have 10 minutes before wallet freeze."
    Choices:
    - "🔑 Share seed phrase to verify" → REKT
    - "🔍 Inspect their profile first" → Node 2 (clue)
    - "🚫 Ignore & block" → SURVIVED
    - "🧠 Ask Sensei (2 left)" → hint

  Node 2 (after inspecting):
    Messages:
    - [system] "🔍 Investigating profile..."
    - [system] "Account created 2 days ago. No verified badge. 
      Real MetaMask support never DMs first."
    Choices:
    - "🔑 Share seed phrase anyway" → REKT
    - "🚫 Block them" → SURVIVED
    - "🤔 Ask why they need my seed" → Node 3

  Node 3 (pressing further):
    Messages:
    - [npc] "It's standard verification. All users must complete this.
      Please hurry, your funds are at risk!"
    Choices:
    - "🔑 OK, here's my seed phrase" → REKT
    - "🚫 This is a scam. Blocked." → SURVIVED

Passive clues: ["Account is only 2 days old", "No verification badge", 
  "Real support never asks for seed phrases", "Urgency pressure tactic"]

Active investigations:
  inspect-link: "Profile shows 0 followers, created 2 days ago"
  verify-identity: "MetaMask confirmed: We NEVER DM users first"

Education:
  attackName: "Fake Support DM"
  howItWorked:
    1. Scammer impersonated MetaMask support
    2. Created urgency with "10 minute" deadline
    3. Asked for seed phrase to "verify" identity
    4. With seed phrase, they drain your entire wallet
  redFlags: ["Support never DMs first", "Asking for seed phrase", 
    "Artificial urgency", "New account with no history"]
  irlProtection: ["Never share seed phrases with anyone", 
    "Official support uses help tickets, not DMs",
    "No legitimate service asks for your seed phrase",
    "Bookmark official support URLs"]

rektConsequences: { moneyLost: 100, moneyLostType: 'percentage', hpLost: 25, streakBroken: true }
survivedRewards: { xp: 200, securityTokens: 2, coins: 100, statBoosts: [{ stat: 'detection', amount: 3 }] }
communityRektRate: 42


=== SCENARIO 2: ch1-seed-phrase-request.json ===
Difficulty: ★☆☆☆☆ (1)
Category: phishing
Channel: notification
Title: "Wallet Verification Required"
Subtitle: "Security alert"

Story: A push notification says "Security Alert: Unusual login from 
new device. Verify wallet to continue." Links to a fake verification 
page that asks for seed phrase.

3 nodes, similar branching structure. Make the fake page URL subtly
wrong: "metamask-verify.com" instead of "metamask.io"

Education teaches: checking URLs, official vs fake domains

rektConsequences: { moneyLost: 80, moneyLostType: 'percentage', hpLost: 20, streakBroken: true }
survivedRewards: { xp: 200, securityTokens: 2, coins: 100 }
communityRektRate: 55


=== SCENARIO 3: ch1-fake-airdrop.json ===
Difficulty: ★★☆☆☆ (2)
Category: honeypot
Channel: activity-feed
Title: "Free Token Airdrop"
Subtitle: "Claim 10,000 FREE tokens"

Story: An unknown token appears in the activity feed: "Received 10,000 
FREE-TOKEN. Claim now to activate." Tapping leads to a site that 
requests an approval transaction — but the approval is UNLIMITED.

This scenario INCLUDES the approval popup component.
Show the approval popup as part of the flow.

3 nodes. The key red flag is the UNLIMITED approval amount.

Education teaches: unlimited approvals, checking approval amounts,
what token approvals actually do

rektConsequences: { moneyLost: 50, moneyLostType: 'percentage', hpLost: 15, streakBroken: true }
survivedRewards: { xp: 250, securityTokens: 3, coins: 150 }
communityRektRate: 68


=== SCENARIO 4: ch1-phishing-email.json ===
Difficulty: ★★☆☆☆ (2)
Category: phishing
Channel: notification
Title: "Important: Ethereum Upgrade"
Subtitle: "Action needed from Ethereum Foundation"

Story: An "official" email from "Ethereum Foundation" says users must
migrate to ETH 2.0 by connecting their wallet to a special page. 
The URL is "ethereum-foundation.org" (fake — real is ethereum.org).

3 nodes. Player can inspect the URL, check the sender email, or
just click through. 

Education teaches: checking sender addresses, domain verification,
official communication channels

rektConsequences: { moneyLost: 60, moneyLostType: 'percentage', hpLost: 20, streakBroken: true }
survivedRewards: { xp: 250, securityTokens: 2, coins: 125 }
communityRektRate: 51


=== SCENARIO 5: ch1-seed-phrase-trap.json (BOSS) ===
Difficulty: ★★☆☆☆ (2) — harder than others because multi-stage
Category: social-engineering
Channel: npc-conversation
Title: "The Seed Phrase Trap"
Subtitle: "A friend in need..."
isBoss: true

Story: This is a MULTI-NODE scenario. "Rekt Rick" (NPC) DMs the player
saying he got hacked and needs help. He asks the player to "test" a 
recovery tool by entering their own seed phrase to verify it works.
Rick seems trustworthy (he's been in the story), but this is actually
Scammy Sam impersonating Rick.

5 nodes (longer boss fight):
  Node 1: Rick seems panicked, asks for help
  Node 2: Shows the "recovery tool" — player can inspect it
  Node 3: Tool asks for seed phrase to "test"
  Node 4: If investigating — clues reveal it's not really Rick
  Node 5: Final confrontation

The twist: after outcome, reveal Scammy Sam was impersonating Rick.
This sets up the villain for Chapter 2.

Education teaches: social engineering, impersonation, verifying identity
through secondary channels, even friends can be compromised

rektConsequences: { moneyLost: 100, moneyLostType: 'percentage', hpLost: 30, streakBroken: true }
survivedRewards: { xp: 500, securityTokens: 5, coins: 300, 
  statBoosts: [{ stat: 'detection', amount: 5 }, { stat: 'security', amount: 3 }] }
communityRektRate: 38

After creating all 5 JSON files, update the SCENARIO_REGISTRY in 
src/data/scenarios/index.ts to include all 5.
```

### After:
```
> Verify all 5 JSON files parse correctly. Load each through the 
  ScenarioEngine and verify dialogue tree structure.
  Git commit "feat: add 5 Chapter 1 scenarios with full dialogue trees"
```

---

## PROMPT 7 — Scam Delivery System

```
Create src/engine/ScamDeliveryEngine.ts

This engine decides WHEN and HOW scams appear to the player during
normal gameplay. Scams should feel organic — mixed into normal 
notifications and activity, not obviously labeled.

HOW SCAM DELIVERY WORKS:

The game simulates a normal crypto wallet. Scams are injected into
the same channels as legitimate activity:
  - Notifications (mixed with real ones)
  - Activity feed (mixed with real transactions)
  - DMs (mixed with NPC conversations)
  - Approval popups (mixed with legitimate approvals)

SCAM DELIVERY ENGINE:

class ScamDeliveryEngine {

  // Generate a mix of legit + scam notifications for the player
  static generateNotifications(
    chapter: number,
    completedScenarios: string[],
    gameDay: number
  ): Array<{
    id: string;
    type: 'legit' | 'scam';
    title: string;
    subtitle: string;
    icon: string;
    iconBg: string;
    timestamp: string;
    isRead: boolean;
    linkedScenarioId?: string;  // only for scam notifications
  }>
  
  Rules:
  - Generate 4-8 notifications total
  - 60% legit, 40% scam (approximately)
  - Scam notifications link to UNCOMPLETED scenarios only
  - Legit notifications: staking rewards, swap confirmations, 
    price alerts, weekly reports
  - Scam notifications: subtle — look almost identical to legit ones
  - Randomize order — don't cluster scams together
  - More scams appear in later chapters

  
  // Generate activity feed mixing legit + suspicious transactions
  static generateActivityFeed(
    chapter: number,
    holdings: Token[],
    completedScenarios: string[],
    gameDay: number
  ): Transaction[]
  
  Rules:
  - Generate 10-15 activity items
  - 70% legit, 30% suspicious
  - Legit: staking rewards, swaps, receives, sends (matching holdings)
  - Suspicious: unknown tokens, "claim now" items, dust attacks
  - Suspicious items link to scenarios
  - Older items have older timestamps (hours ago, days ago)

  
  // Decide if a scam should trigger right now
  static shouldTriggerScam(
    lastScamTime: string,    // when player last faced a scam
    gameDay: number,
    chapter: number,
    completedScenarios: string[],
    totalScenariosInChapter: number
  ): boolean
  
  Rules:
  - Minimum 1 "game day" between scams (so player isn't overwhelmed)
  - Maximum 3 game days without a scam (keeps engagement)
  - Boss scenario only triggers when all other chapter scenarios are done
  - Higher chapters = slightly more frequent scam attempts

  
  // Pick which scenario to deliver next
  static selectNextScenario(
    chapter: number,
    completedScenarios: string[],
    playerClass: string
  ): { scenarioId: string; deliveryChannel: DeliveryChannel } | null
  
  Rules:
  - Pick uncompleted scenario from current chapter
  - Weight by class weakness: Ape faces FOMO scams first, 
    Analyst faces social engineering first
  - Don't pick boss until all others are done
  - Return null if all scenarios in chapter are completed

  
  // Generate legit notifications (helper)
  static generateLegitNotifications(
    holdings: Token[],
    count: number
  ): Notification[]
  
  Legit notification templates:
  - "Staking reward claimed" — "+$XX.XX ETH" — has checkmark icon
  - "Weekly portfolio report" — "Up X% this week"
  - "Swap confirmed" — "X USDC → X.XX ETH"
  - "Price alert" — "ETH is up 5% today"
  - "New feature available" — "Scanner tool now live!"
  - "Security tip" — "Remember to check approvals regularly"
}

Also create src/engine/NotificationGenerator.ts with templates:

LEGIT_TEMPLATES = [
  { title: "Staking reward claimed", subtitle: "+${amount} ETH", icon: "✅" },
  { title: "Swap confirmed", subtitle: "{from} → {to}", icon: "🔄" },
  { title: "Price alert: {token}", subtitle: "Up {pct}% today", icon: "📊" },
  { title: "Weekly report", subtitle: "Portfolio {direction} {pct}%", icon: "📈" },
  ... (10+ templates)
]

SCAM_TEMPLATES = {
  phishing: [
    { title: "Action required: Verify wallet", subtitle: "Suspicious activity detected", icon: "⚠️" },
    { title: "Urgent: Wallet security update", subtitle: "Complete verification now", icon: "🔐" },
  ],
  honeypot: [
    { title: "Claim {amount} {token} airdrop", subtitle: "Limited time offer!", icon: "🎁" },
    { title: "Unknown token received", subtitle: "Tap to claim", icon: "🔔" },
  ],
  social: [
    { title: "New DM from {name}", subtitle: "Urgent: {preview}", icon: "💬" },
  ],
  // ... for each scam category
}
```

### After:
```
> Test: generate notifications for chapter 1 with 2 completed scenarios.
  Verify mix of legit and scam. Verify scam links to uncompleted scenarios.
  Git commit "feat: add scam delivery engine with notification generator"
```

---

## PROMPT 8 — XP, Leveling & Stat Formulas

```
Create src/engine/ProgressionEngine.ts

This consolidates all XP, leveling, and stat calculation logic in
one place so it's consistent across the app.

Reference the Character System and Leveling in 
docs/REKT-Final-Build-Plan.md.

XP REWARDS TABLE:

const XP_REWARDS = {
  // Scenarios
  scenarioSurvived: 200,         // base, modified by difficulty
  scenarioRekt: 50,              // small XP even for failing (you learned)
  bossScenarioSurvived: 500,
  bossScenarioRekt: 100,
  
  // Daily
  dailyLogin: 50,
  streakBonus: (streak: number) => Math.min(streak * 10, 200),
  
  // Actions
  readEducation: 30,
  inspectLink: 10,
  checkContract: 15,
  verifyIdentity: 10,
  
  // Achievements
  achievementUnlocked: 100,       // base, specific achievements may give more
  
  // Portfolio
  portfolioMilestone: 200,        // hitting chapter target
}

DIFFICULTY MULTIPLIER:
  Difficulty 1: 1.0x
  Difficulty 2: 1.2x
  Difficulty 3: 1.5x
  Difficulty 4: 2.0x
  Difficulty 5: 3.0x

STREAK MULTIPLIER:
  streakMultiplier = 1 + (streak * 0.05)
  Max: 2.0 (at 20-day streak)
  Applies to: scenario survival XP, daily login XP

LEVELING:
  xpToNextLevel(level: number) = level * 300
  
  Level 1: 300 XP needed
  Level 5: 1500 XP needed
  Level 10: 3000 XP needed
  Level 15: 4500 XP needed
  Level 20: 6000 XP needed
  Level 30: 9000 XP needed (max)

STAT GROWTH:
  Stats increase based on specific actions:
  
  Security: +2 per security gear equipped, +3 per scam survived using 
    inspection, +1 per revoke action
  Detection: +3 per scam correctly identified on first try, +1 per 
    active investigation used
  Wealth: tied to portfolio value brackets
    $0-5k: 10, $5k-25k: 30, $25k-60k: 50, $60k-150k: 70, $150k+: 90
  Knowledge: +5 per education post-mortem read, +2 per Sensei conversation
  HP: recovers +5 per daily login, +10 if streak > 7, max 100

CLASS STAT MODIFIERS (applied on top of base):
  Ape:     wealth+15, detection-10, security-5
  Analyst: detection+15, knowledge+5, security+5, wealth-10
  Shadow:  security+5, detection+5, hp+5
  Degen:   wealth+10, hp+10, security-10, detection-5

ENGINE METHODS:

class ProgressionEngine {
  
  // Calculate XP reward for completing a scenario
  static calculateScenarioXP(
    outcome: 'rekt' | 'survived',
    difficulty: number,
    isBoss: boolean,
    streak: number
  ): number

  // Check if XP amount triggers a level up (may be multiple levels)
  static checkLevelUp(
    currentLevel: number,
    currentXP: number,
    xpGained: number
  ): { newLevel: number; newXP: number; levelsGained: number; newTitle: string }

  // Get title for a level
  static getTitleForLevel(level: number): string

  // Calculate stat changes from an action
  static calculateStatChanges(
    action: 'survived' | 'rekt' | 'investigated' | 'education-read' | 
            'gear-equipped' | 'daily-login',
    context?: { difficulty?: number; investigationType?: string }
  ): Partial<PlayerStats>

  // Calculate wealth stat from portfolio value
  static calculateWealthStat(portfolioValue: number): number

  // Calculate HP recovery for daily login
  static calculateHPRecovery(currentHP: number, streak: number): number

  // Calculate damage when rekt
  static calculateDamage(
    baseDamage: number,
    equippedGear: string[],
    playerClass: string
  ): number
  // Gear can reduce damage:
  //   Paper Wallet: -5% damage
  //   Hardware Wallet: -15% damage
  //   Cold Storage: -25% damage (50% portfolio untouchable)

  // Get required XP for a specific level
  static getXPForLevel(level: number): number

  // Get level progress as percentage
  static getLevelProgress(currentXP: number, xpToNextLevel: number): number
}
```

### After:
```
> Test: calculate XP for surviving a difficulty 3 scenario with 10-day streak.
  Verify level up from level 5 to 6. Check title changes at level 6.
  Git commit "feat: add progression engine with XP and stat formulas"
```

---

## PROMPT 9 — Economy Engine (Daily Yields, Investments)

```
Create src/engine/EconomyEngine.ts

This handles all the money simulation: daily yields, investment returns,
market price changes, and portfolio growth.

Reference the Economy System and Investment Options in 
docs/REKT-Final-Build-Plan.md.

DAILY YIELD RATES (per investment type):

const YIELD_RATES = {
  staking: { min: 0.3, max: 0.7 },          // 0.3-0.7% per day
  'liquidity-pool': { min: 1.0, max: 3.0 },  // 1-3% per day
  token: { min: -10, max: 20 },               // -10% to +20% per day
  nft: { min: -5, max: 15 },                  // variable
  'yield-farm': { min: 3.0, max: 8.0 },       // 3-8% per day (too good to be true!)
}

MARKET SIMULATION:

const PRICE_VOLATILITY = {
  ETH: { min: -5, max: 5 },
  BTC: { min: -4, max: 4 },
  USDC: { min: -0.1, max: 0.1 },
  USDT: { min: -0.1, max: 0.1 },
  'risky-token': { min: -20, max: 30 },
  'scam-token': { min: 5, max: 50 },   // always goes up... until rug
}

ENGINE METHODS:

class EconomyEngine {

  // Simulate a full day of market activity
  static simulateDay(
    holdings: Token[],
    investments: Investment[],
    gameDay: number,
    chapter: number
  ): {
    updatedHoldings: Token[];
    investmentReturns: number;
    newTransactions: Transaction[];
    rugPullTriggered: Investment | null;
  }
  
  Implementation:
  - For each holding: randomize price change within volatility range
  - For each investment: calculate daily return, add to portfolio
  - Check if any investment hits its rugPullDay → drain that investment
  - Generate transactions for all changes
  - Scam tokens always trend upward until chapter's rug pull scenario

  
  // Calculate daily staking reward
  static calculateStakingReward(
    stakedAmount: number,
    stakingType: string,     // ETH staking, LP, yield farm
    playerLevel: number
  ): number
  
  Higher levels get slightly better rates (knowledge = better strategies):
    bonus = 1 + (playerLevel * 0.01)  // 1% per level, max 30%

  
  // Calculate investment return for a single investment
  static calculateInvestmentReturn(investment: Investment): {
    returnAmount: number;
    returnPct: number;
    isPositive: boolean;
  }

  
  // Process a rug pull
  static processRugPull(investment: Investment): {
    totalLost: number;
    transactionRecord: Transaction;
    affectedTokenId?: string;
  }
  
  A rug pull:
  - Drains 100% of the investment
  - Generates a dramatic transaction: "🔴 LIQUIDITY REMOVED — $XX,XXX lost"
  - Triggers the rug pull scenario if not already completed

  
  // Calculate daily reward package
  static calculateDailyReward(
    holdings: Token[],
    streak: number,
    playerLevel: number,
    playerClass: string
  ): {
    stakingYield: number;
    loginXP: number;
    streakBonusXP: number;
    bonusCoins: number;
    totalPortfolioAfter: number;
  }
  
  Ape class: +10% yield bonus
  Analyst: +5% yield, +10% XP
  Shadow: standard
  Degen: ±25% yield (randomized, could be negative!)

  
  // Calculate portfolio growth needed to reach chapter target
  static getGrowthToTarget(
    currentValue: number,
    chapterTarget: number
  ): { needed: number; percentage: number; daysEstimate: number }

  
  // Generate fake price chart data
  static generateChartData(
    startPrice: number,
    days: number,
    volatility: 'low' | 'medium' | 'high',
    trend: 'up' | 'down' | 'sideways'
  ): number[]
  — For the portfolio detail screen chart

  
  // Inject a scam token into portfolio (dust attack)
  static createDustAttackToken(): Token
  Returns a suspicious token like:
  {
    name: "FREE-CLAIM",
    symbol: "CLAIM",
    amount: 10000,
    pricePerUnit: 0.001,
    isScamToken: true,
    isSuspicious: true
  }
}
```

### After:
```
> Test: simulate 5 days of market activity with 3 holdings and 1 investment.
  Verify holdings prices change, investment returns accumulate, and 
  a rug pull triggers on the correct day.
  Git commit "feat: add economy engine with daily simulation"
```

---

## PROMPT 10 — Gear System + Class Abilities

```
Create src/data/gear.ts and src/engine/GearEngine.ts

GEAR DEFINITIONS (src/data/gear.ts):

Define all 9 gear items from docs/REKT-Final-Build-Plan.md:

interface GearItem {
  id: string;
  name: string;
  emoji: string;
  slot: 'wallet' | 'utility' | 'scanner' | 'shield' | 'companion';
  description: string;
  gameEffect: string;
  realWorldEquivalent: string;
  unlockCondition: {
    type: 'default' | 'level' | 'purchase' | 'achievement' | 'chapter';
    value?: number;
    cost?: { currency: 'coins' | 'securityTokens'; amount: number };
  };
  effects: {
    damageReduction?: number;        // percentage
    autoDetectChance?: number;       // 0-1, chance to auto-spot scam
    bonusClueTypes?: string[];       // extra clue types revealed
    blockScamTypes?: ScamCategory[]; // blocks certain scam categories
    portfolioProtection?: number;    // percentage of portfolio untouchable
    dailyUses?: number;              // limited use per day
  };
}

GEAR ITEMS:

1. paper-wallet (DEFAULT — everyone starts with this)
   Slot: wallet, Effect: -5% damage
   Unlock: default (starting gear)

2. hardware-wallet
   Slot: wallet, Effect: -15% damage, blocks remote approval scams
   Unlock: level 10

3. bookmark-bar
   Slot: utility, Effect: auto-detect fake URLs (30% chance)
   Unlock: level 5 OR 14-day streak reward

4. contract-reader
   Slot: scanner, Effect: reveals hidden contract functions as bonus clue
   Unlock: level 15

5. two-fa-shield
   Slot: shield, Effect: blocks account takeover scams (50% chance)
   Unlock: purchase with 30 security tokens

6. revoke-tool
   Slot: utility, Effect: undo 1 approval per day
   Unlock: level 12

7. security-bot
   Slot: companion, Effect: random scam warning (20% chance per scam)
   Unlock: purchase with 50 security tokens

8. cold-storage
   Slot: wallet, Effect: 50% portfolio untouchable when rekt
   Unlock: level 20

9. burner-wallet
   Slot: utility, Effect: safe contract interaction (blocks approval scams 40%)
   Unlock: chapter 3 completion

GEAR ENGINE (src/engine/GearEngine.ts):

class GearEngine {

  // Get all gear items
  static getAllGear(): GearItem[]

  // Check if player can unlock a gear item
  static canUnlock(
    gearId: string,
    playerLevel: number,
    securityTokens: number,
    completedChapters: number[],
    achievements: string[]
  ): { canUnlock: boolean; reason?: string }

  // Calculate combined effects of all equipped gear
  static calculateCombinedEffects(equippedGearIds: string[]): {
    totalDamageReduction: number;
    totalAutoDetectChance: number;
    allBonusClueTypes: string[];
    blockedScamTypes: ScamCategory[];
    portfolioProtection: number;
  }

  // Check if equipped gear auto-detects a specific scam
  static rollAutoDetect(
    equippedGearIds: string[],
    scamCategory: ScamCategory
  ): { detected: boolean; gearThatDetected?: string; message?: string }
  
  If detected, show a message like: 
  "🔖 Your Bookmark Bar flagged this URL as suspicious!"

  // Get bonus clues from gear for a scenario
  static getGearClues(
    equippedGearIds: string[],
    scenario: ScenarioDefinition
  ): string[]

  // Calculate damage after gear mitigation
  static mitigateDamage(
    baseDamage: number,
    equippedGearIds: string[],
    portfolioValue: number
  ): { finalDamage: number; amountProtected: number; gearUsed: string[] }
}

CLASS ABILITIES (add to same file or create src/engine/ClassAbilityEngine.ts):

Each class has a unique ability that can be used in scenarios:

Ape — "Diamond Hands":
  One-time use per playthrough. Survive a rug pull that would have rekt you.
  Triggers automatically when a rug pull rekt would happen.
  
Analyst — "Deep Dive":
  2 free investigations per day. Normally investigations cost resources.
  Resets each real day.
  
Shadow — "Incognito":
  Blocks some social engineering scams. 30% chance to auto-skip 
  social-engineering category scams entirely.
  
Degen — "Gut Feeling":
  Random 25% chance to auto-detect ANY scam type. Unreliable but powerful.
  Triggers randomly.

class ClassAbilityEngine {
  static checkAbility(
    playerClass: string,
    scamCategory: ScamCategory,
    abilityUsesRemaining: number,
    scenario: ScenarioDefinition
  ): {
    abilityTriggered: boolean;
    abilityName: string;
    effect: string;        // description shown to player
    preventsRekt?: boolean;
    revealsClue?: boolean;
    autoSurvives?: boolean;
  }
}
```

### After:
```
> Test: equip hardware-wallet + bookmark-bar + two-fa-shield.
  Calculate combined effects. Roll auto-detect against a phishing scam.
  Git commit "feat: add gear system and class abilities"
```

---

## PROMPT 11 — Achievement & Streak Tracker

```
Create src/engine/AchievementEngine.ts

This checks all achievement conditions and handles streak milestones.
It should be called after every significant game action.

ACHIEVEMENT CHECKER:

class AchievementEngine {

  // Master check — call after any game action
  static checkAllAchievements(
    achievements: Achievement[],
    playerStore: PlayerState,
    portfolioStore: PortfolioState,
    gameStore: GameState
  ): Achievement[]   // returns newly unlocked achievements

  Implementation — check each locked achievement's condition:

  type 'streak':
    Check playerStore.streak >= condition.value

  type 'scenarios-survived':
    Count gameStore.scenarioResults where outcome === 'survived'
    >= condition.value

  type 'scenarios-completed':
    Count gameStore.completedScenarios.length >= condition.value

  type 'portfolio-value':
    Check portfolioStore.totalValue >= condition.value

  type 'scams-caught':
    Count scenarioResults where first choice was correct
    >= condition.value

  type 'chapter-complete':
    Check gameStore.isChapterComplete(condition.value)

  type 'level-reached':
    Check playerStore.level >= condition.value

  type 'specific-action':
    Check if condition.specificId is in completedScenarios or 
    other tracked action list


  // Apply achievement rewards
  static applyReward(
    achievement: Achievement,
    playerStore: any    // the store's actions
  ): { rewardsApplied: string[] }
  
  For each reward type in achievement.reward:
    xp → playerStore.addXP(amount)
    coins → playerStore.addCoins(amount)
    securityTokens → playerStore.addSecurityTokens(amount)
    gearUnlock → playerStore.unlockGear(gearId)
    title → set special title override


  // Get achievement progress
  static getProgress(
    achievement: Achievement,
    playerStore: PlayerState,
    portfolioStore: PortfolioState,
    gameStore: GameState
  ): { current: number; target: number; percentage: number }
  
  Returns how close the player is to unlocking each achievement.
  This is shown in the profile/achievements UI.


  // Check streak milestones
  static checkStreakMilestones(
    currentStreak: number,
    milestones: StreakMilestone[]
  ): StreakMilestone | null   // returns milestone just reached, or null

  
  // Format achievement notification
  static formatUnlockNotification(achievement: Achievement): {
    title: string;
    subtitle: string;
    emoji: string;
  }
  Example: { title: "Achievement Unlocked!", subtitle: "🔥 One Week — 7-day streak", emoji: "🏆" }
}

TRIGGER POINTS — where to call checkAllAchievements:

1. After scenario completion (survived or rekt)
2. After daily reward claim
3. After portfolio value changes
4. After level up
5. After gear equip/unlock
6. After streak update

Create a helper function that screens can call:

export async function processGameAction(
  action: 'scenario-complete' | 'daily-claim' | 'level-up' | 'gear-change',
  context?: any
) {
  // 1. Check achievements
  const newAchievements = AchievementEngine.checkAllAchievements(...)
  
  // 2. If new achievements, show notification (store in a queue)
  for (const achievement of newAchievements) {
    gameStore.unlockAchievement(achievement.id)
    AchievementEngine.applyReward(achievement, playerStore)
    // Queue toast notification
  }
  
  // 3. Check streak milestones
  const milestone = AchievementEngine.checkStreakMilestones(...)
  if (milestone) {
    // Queue milestone celebration
  }
}
```

### After:
```
> Test: set up a player with 7-day streak and 5 survived scenarios.
  Run checkAllAchievements. Verify "One Week" and "Eagle Eye" 
  achievements unlock. Verify rewards are applied.
  Git commit "feat: add achievement engine with auto-checking"
```

---

## PROMPT 12 — Connect Stores to Screens ⭐

```
Now connect all stores and engines to the screens built in Phase 3.
This is the final wiring prompt that makes everything work together.

Go through each screen and replace hardcoded data with store data:

1. ONBOARDING (screens 01-02):
   - Character Select → calls playerStore.selectClass()
   - After selecting class → calls portfolioStore.initializePortfolio()
   - Sets playerStore.hasOnboarded = true
   - Navigates to Daily Reward

2. WALLET HOME (screen 03):
   - Top bar: streak from playerStore.streak
   - Notification badge: count from scam delivery engine
   - HP bar: from playerStore.stats.hp
   - Balance: from portfolioStore.totalValue
   - Change: from portfolioStore.dailyChange
   - Holdings: from portfolioStore.holdings
   - Activity: from portfolioStore.transactions (recent 5)
   - Suspicious items: generated by ScamDeliveryEngine

3. NOTIFICATIONS (screen 05):
   - Generated by ScamDeliveryEngine.generateNotifications()
   - Tapping scam notif → loads scenario via scenarioStore.loadScenario()
   - Navigate to Scenario screen

4. DAILY REWARD (screen 20):
   - Calculate rewards via EconomyEngine.calculateDailyReward()
   - On claim: playerStore.claimDailyReward()
   - Add portfolio value, XP, coins
   - Advance game day: gameStore.advanceGameDay()
   - Simulate market: EconomyEngine.simulateDay()
   - Check achievements: processGameAction('daily-claim')

5. SCAM SCENARIO (screen 08):
   - Load scenario from scenarioStore
   - Display dialogue from scenario nodes
   - Check gear effects: GearEngine.rollAutoDetect()
   - Check class abilities: ClassAbilityEngine.checkAbility()
   - If auto-detected: show gear/ability message, skip to survived
   - Process choices through scenarioStore.selectChoice()

6. APPROVAL POPUP (screen 09):
   - Triggered by scenario choices with outcome 'approval-popup'
   - If player approves scam → scenarioStore processes rekt
   - If player rejects → scenarioStore processes survived

7. REKT SCREEN (screen 10):
   - Get outcome from scenarioStore.outcomeDetails
   - Apply damage: ProgressionEngine.calculateDamage()
   - Apply to stores: playerStore.takeDamage(), portfolioStore.drainFunds()
   - Break streak: playerStore.breakStreak()
   - Complete scenario: gameStore.completeScenario()
   - Check achievements: processGameAction('scenario-complete')

8. SURVIVED SCREEN (screen 11):
   - Get outcome from scenarioStore
   - Calculate rewards: ProgressionEngine.calculateScenarioXP()
   - Apply rewards to playerStore and portfolioStore
   - Complete scenario: gameStore.completeScenario()
   - Check level up: ProgressionEngine.checkLevelUp()
   - Check achievements: processGameAction('scenario-complete')

9. EDUCATION (screen 12):
   - Pull education content from scenarioStore.getEducation()
   - On "Got it!": playerStore.updateStat('knowledge', 5)
   - Navigate back to Wallet Home

10. CHARACTER PROFILE (screen 14):
    - All data from playerStore
    - Stats calculated with class modifiers
    - Record from gameStore.scenarioResults

11. WORLD MAP (screen 16):
    - Chapter data from gameStore.chapters
    - Progress from gameStore.getChapterProgress()
    - Lock status from gameStore.canAccessChapter()

12. GEAR (screen 15):
    - Equipped from playerStore.equippedGear
    - Available from GearEngine.getAllGear()
    - Unlock checks from GearEngine.canUnlock()

13. SETTINGS (screen 22):
    - Reset calls all store .reset() methods
    - Navigates to onboarding screen 01

After wiring, test the COMPLETE FLOW:
  Open app → Onboarding → Select class → Daily reward → Wallet Home →
  Tap suspicious notification → Scenario plays → Make choice →
  REKT/Survived → Education → Share → Back to wallet →
  Check profile (stats updated) → Check map (progress updated)

Fix any bugs in the flow.
```

### After:
```
> Test the complete game loop end to end. Verify:
  - XP increases after surviving
  - HP decreases after rekt
  - Portfolio value changes
  - Streak updates correctly
  - Level up triggers at correct XP
  - Achievements unlock
  Git commit "feat: connect all stores and engines to screens"
```

---

## 📝 Summary — Phase 4: 12 Prompts

| # | Component | What It Does |
|---|-----------|-------------|
| 1 | playerStore | Class, stats, HP, XP, leveling, gear, streak |
| 2 | portfolioStore | Holdings, investments, transactions, economy |
| 3 | scenarioStore | Scenario runtime, dialogue state, choices, outcome |
| 4 | gameStore | Chapters, progress, achievements, NPC relationships |
| 5 | Scenario Engine | JSON loader, gear/class checks, damage/reward calc |
| 6 | Chapter 1 Scenarios | 5 complete JSON scenarios with full dialogue trees |
| 7 | Scam Delivery | Generates mixed legit+scam notifications/activity |
| 8 | Progression Engine | XP formulas, leveling, stat growth, damage calc |
| 9 | Economy Engine | Daily yields, market simulation, investments, rug pulls |
| 10 | Gear + Abilities | 9 gear items, 4 class abilities, effect calculations |
| 11 | Achievement Engine | Auto-check conditions, streak milestones, rewards |
| 12 | Wire Everything ⭐ | Connect all stores to all screens |

**Estimated time: ~2-3 days with Claude Code**

**After Phase 4 is done, you have a fully playable Chapter 1 with:**
- Working economy simulation
- 5 interactive scam scenarios
- XP/leveling/stats that update
- Gear that affects gameplay
- Class abilities that matter
- Achievements that auto-unlock
- Streak tracking
- Complete game loop
