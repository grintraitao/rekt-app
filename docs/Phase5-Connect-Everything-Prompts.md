# REKT — Phase 5: Connect Everything
## Complete Claude Code Prompt Guide (10 Prompts)

---

## 📋 What Phase 5 Covers

Phase 3 built the screens. Phase 4 built the game brain.
Phase 5 **wires them into a living, breathing app** — every tap,
every transition, every state update, every animation connected
into seamless flows that feel like a real product.

```
PROMPT ORDER:

CORE FLOWS:
  Prompt 1  → App Entry Flow (launch → onboarding OR daily reward → home)
  Prompt 2  → Scam Encounter Flow ⭐ (the main gameplay loop)
  Prompt 3  → Outcome Processing (REKT damage + Survived rewards)
  Prompt 4  → Education → Share → Return Flow

NAVIGATION WIRING:
  Prompt 5  → Wallet Home — all tap targets connected
  Prompt 6  → Tab Navigation — all 5 tabs fully wired
  Prompt 7  → Deep Links — notification tap → scenario, challenge links

DAILY LOOP:
  Prompt 8  → Daily Simulation (market moves, scam injection, rewards)
  Prompt 9  → NPC Story Triggers (when/how NPCs appear)

FINAL POLISH:
  Prompt 10 → Full Integration Test + Bug Sweep
```

---

## ⚠️ RULES

1. **Phase 3 + Phase 4 must be DONE before starting Phase 5**
2. **Run `/clear` before each prompt**
3. **Test after EVERY prompt** — these are flow-critical, bugs here break the game
4. **Always say**: "Reference docs/REKT-Final-Build-Plan.md Screen Flow section"
5. **Don't skip Prompt 10** — the integration test catches everything

---

## PROMPT 1 — App Entry Flow

```
Wire up the complete app entry flow. When the app opens, it should
decide what to show based on game state.

Reference the ONBOARDING flow in docs/REKT-Final-Build-Plan.md:
  Splash (01) → Character Select (02) → Daily Reward (20) → Wallet Home (03)

Create src/navigation/AppEntry.tsx (or modify the root layout):

FLOW LOGIC:

1. App opens → check playerStore.hasOnboarded

2. IF hasOnboarded === false (FIRST TIME):
   → Show Splash screen (01) — 3 swipeable pages
   → "Start Playing" navigates to Character Select (02)
   → Character Select:
     - Player taps a class card → playerStore.selectClass(class)
     - Player taps "Confirm" →
       a) playerStore.completeOnboarding()
       b) portfolioStore.initializePortfolio(selectedClass)
       c) gameStore.initializeChapters()  // set up chapter data
       d) Navigate to Daily Reward (20)
   → Daily Reward (20):
     - Show first-day rewards (no streak yet)
     - Player taps "Claim" →
       a) playerStore.claimDailyReward()
       b) EconomyEngine.calculateDailyReward() applied
       c) gameStore.advanceGameDay()
       d) Navigate to Wallet Home (03)

3. IF hasOnboarded === true (RETURNING USER):
   → Check playerStore.lastClaimDate vs today's date
   
   3a. IF not claimed today:
     → Show Daily Reward (20) as modal/overlay
     → After claim → show Wallet Home (03)
     → ALSO: run EconomyEngine.simulateDay() to update market
     → ALSO: ScamDeliveryEngine to refresh notifications
   
   3b. IF already claimed today:
     → Go straight to Wallet Home (03)

4. GAME OVER CHECK:
   At any entry point, check playerStore.stats.hp <= 0
   IF game over:
     → Show a "Game Over" modal:
       "💀 Your HP reached zero. You've been fully rekt."
       "Your portfolio was drained. Time to restart this chapter."
     → Button: "Restart Chapter" 
       - Reset HP to 100
       - Reset portfolio to chapter starting value
       - Reset chapter scenarios (keep completed ones from previous chapters)
       - Navigate to Wallet Home

IMPLEMENTATION DETAILS:

- Use expo-router's root layout (_layout.tsx) to handle this logic
- The decision should happen BEFORE any screen renders (use a loading 
  state with a brief dark splash while checking)
- Store check should be synchronous (Zustand persist loads from AsyncStorage)
- Show a brief branded loading screen (REKT logo, dark bg, green text) 
  for 500ms while stores hydrate

Create/modify these files:
- app/_layout.tsx — root layout with entry logic
- src/components/GameOverModal.tsx — game over overlay
- src/components/LoadingScreen.tsx — branded loading splash

Test all 3 paths:
1. Fresh install → full onboarding flow
2. Returning user, not claimed → daily reward then home
3. Returning user, already claimed → straight to home
```

### After:
```
> Test all 3 entry paths. Clear AsyncStorage to test fresh install.
  Git commit "feat: wire app entry flow with onboarding and daily check"
```

---

## PROMPT 2 — Scam Encounter Flow ⭐

```
Wire the COMPLETE scam encounter flow — this is the core gameplay loop.
This is the most important flow in the entire app.

Reference the SCAM ENCOUNTER flow in docs/REKT-Final-Build-Plan.md:
  Trigger → Scenario (08) → Approval Popup (09) →
    ├── REKT (10) → Education (12) → Share (21) → Wallet (03)
    └── Survived (11) → Education (12) → Share (21) → Wallet (03)

Create src/flows/ScamEncounterFlow.ts — a flow controller that 
orchestrates the entire scam encounter sequence.

ENTRY POINTS (3 ways a scam encounter starts):

  A) From Notifications screen (05):
     Player taps a scam notification that has linkedScenarioId
     → Navigate to Scenario screen, passing scenarioId as route param

  B) From Activity Feed (06) or Wallet Home activity section:
     Player taps a suspicious transaction that has linkedScenarioId
     → Navigate to Scenario screen, passing scenarioId

  C) Auto-trigger (after daily reward):
     ScamDeliveryEngine.shouldTriggerScam() returns true
     → Show a notification badge on Wallet Home
     → Player taps bell → sees scam notification → taps it → Scenario

SCAM ENCOUNTER FLOW CONTROLLER:

class ScamEncounterFlow {

  // Step 1: Initialize encounter
  static async startEncounter(scenarioId: string, navigation: any) {
    // Load scenario into scenarioStore
    const scenario = await ScenarioEngine.loadScenario(scenarioId)
    scenarioStore.loadScenario(scenario)
    
    // Check gear auto-detection BEFORE showing scenario
    const gearCheck = GearEngine.rollAutoDetect(
      playerStore.equippedGear, 
      scenario.category
    )
    
    // Check class ability
    const classCheck = ClassAbilityEngine.checkAbility(
      playerStore.playerClass,
      scenario.category,
      playerStore.abilityUsesRemaining,
      scenario
    )
    
    if (gearCheck.detected || classCheck.autoSurvives) {
      // AUTO-DETECT: Skip scenario, go straight to survived
      // But show a brief interstitial: 
      //   "🔖 Your Bookmark Bar flagged this URL as suspicious!"
      //   or "🎲 Your Gut Feeling kicked in!"
      // Then navigate to Survived screen
      return { autoDetected: true, message: gearCheck.message || classCheck.effect }
    }
    
    // Navigate to Scenario screen
    navigation.navigate('scenario', { scenarioId })
  }

  // Step 2: Process player choice in scenario
  static processChoice(choiceId: string): {
    outcome: 'rekt' | 'survived' | 'continue' | 'clue' | 'hint' | 'approval-popup';
    nextAction: string;
    data?: any;
  } {
    const choice = scenarioStore.selectChoice(choiceId)
    
    switch (choice.outcome) {
      case 'rekt':
        return { outcome: 'rekt', nextAction: 'navigate-rekt' }
      
      case 'survived':
        return { outcome: 'survived', nextAction: 'navigate-survived' }
      
      case 'approval-popup':
        return { 
          outcome: 'approval-popup', 
          nextAction: 'show-approval',
          data: { type: 'scam', details: scenario.approvalDetails }
        }
      
      case 'continue':
        // Move to next dialogue node
        scenarioStore.advanceToNode(choice.nextNodeId)
        return { outcome: 'continue', nextAction: 'show-next-messages' }
      
      case 'clue':
        // Show reveal text, stay in scenario
        return { 
          outcome: 'clue', 
          nextAction: 'show-clue',
          data: { revealText: choice.revealText }
        }
      
      case 'hint':
        // Sensei hint
        if (scenarioStore.senseiUsesLeft > 0) {
          scenarioStore.useSenseiHint()
          return {
            outcome: 'hint',
            nextAction: 'show-hint',
            data: { hintText: 'Something about this feels wrong. Check the details carefully.' }
          }
        }
        return { outcome: 'hint', nextAction: 'no-hints-left' }
    }
  }

  // Step 3a: Handle approval popup result
  static processApproval(approved: boolean): {
    outcome: 'rekt' | 'survived';
    nextAction: string;
  } {
    if (approved) {
      // Player approved scam transaction → REKT
      return { outcome: 'rekt', nextAction: 'navigate-rekt' }
    } else {
      // Player rejected → SURVIVED
      return { outcome: 'survived', nextAction: 'navigate-survived' }
    }
  }
}

SCENARIO SCREEN INTEGRATION (update screen 08):

The Scenario screen should use this flow controller:

1. On mount: scenarioStore.startScenario()
2. Messages appear one by one (300ms delay between messages)
3. After all messages in current node shown → reveal choices
4. When player taps a choice:
   a) Briefly highlight the choice (200ms green flash)
   b) Call ScamEncounterFlow.processChoice(choiceId)
   c) Based on result:
      - 'continue' → animate new messages appearing
      - 'clue' → show reveal text in a yellow info box above choices,
        then show new/updated choices
      - 'hint' → show Sensei bubble: "🧙 Sensei says: [hint]"
        with 2→1 uses remaining indicator, re-show choices
      - 'approval-popup' → slide up the Approval Popup component
      - 'rekt' → brief 500ms pause, then navigate to REKT screen
      - 'survived' → brief 500ms pause, then navigate to Survived screen

APPROVAL POPUP INTEGRATION (update screen 09):

When shown during a scenario:
1. Popup slides up from bottom (300ms animation)
2. Shows scam approval details (UNLIMITED amount, unverified contract)
3. "Reject" button → ScamEncounterFlow.processApproval(false) → Survived
4. "Approve" button → ScamEncounterFlow.processApproval(true) → REKT
5. Popup slides down before navigation

AUTO-DETECT INTERSTITIAL:

Create src/components/AutoDetectModal.tsx:
- Shows when gear/class auto-detects a scam
- Centered modal with the gear/ability emoji
- Message: "🔖 Your Bookmark Bar detected a phishing URL!"
- Brief animation (1.5s), then auto-navigates to Survived screen
- Player gets survival rewards but slightly less XP (didn't do it manually)
  autoDetectXP = normalXP * 0.5

Wire all navigation calls using expo-router:
  router.push('/scenario?id=xxx')
  router.replace('/rekt?scenarioId=xxx&amountLost=xxx')
  router.replace('/survived?scenarioId=xxx')

Use router.replace for outcome screens so player can't go "back" 
to the scenario (the encounter is over).
```

### After:
```
> Test the FULL scam flow: tap a scam notification → play through 
  scenario → make a choice → see REKT or Survived screen.
  Test all choice types: rekt, survived, continue (branching), clue, hint.
  Test the approval popup path.
  Git commit "feat: wire complete scam encounter flow"
```

---

## PROMPT 3 — Outcome Processing

```
Wire up what happens to game state when a player gets REKT or SURVIVES.
This is the consequences/rewards system.

Create src/flows/OutcomeProcessor.ts:

class OutcomeProcessor {

  // ========== REKT OUTCOME ==========
  static async processRekt(
    scenarioId: string,
    navigation: any
  ): Promise<{
    moneyLost: number;
    hpLost: number;
    streakBroken: boolean;
    previousStreak: number;
    attackType: string;
    communityRektRate: number;
    isGameOver: boolean;
  }> {
    
    const scenario = scenarioStore.activeScenario!
    const portfolio = portfolioStore.getState()
    const player = playerStore.getState()
    
    // 1. Calculate money lost
    let moneyLost: number
    if (scenario.rektConsequences.moneyLostType === 'percentage') {
      moneyLost = portfolio.totalValue * (scenario.rektConsequences.moneyLost / 100)
    } else {
      moneyLost = scenario.rektConsequences.moneyLost
    }
    
    // 2. Apply gear damage reduction
    const gearMitigation = GearEngine.mitigateDamage(
      moneyLost, 
      player.equippedGear,
      portfolio.totalValue
    )
    moneyLost = gearMitigation.finalDamage
    
    // 3. Check Ape's Diamond Hands ability (one-time rug pull survival)
    if (player.playerClass === 'ape' && 
        scenario.category === 'rug-pull' && 
        !player.diamondHandsUsed) {
      // Diamond Hands activates! Reduce loss to 25%
      moneyLost = moneyLost * 0.25
      playerStore.getState().useDiamondHands() // mark as used
      // Show special message on REKT screen: "💎 Diamond Hands saved 75%!"
    }
    
    // 4. Drain funds from portfolio
    portfolioStore.getState().drainFunds(moneyLost, scenario.education.attackName)
    
    // 5. HP damage
    const hpLost = ProgressionEngine.calculateDamage(
      scenario.rektConsequences.hpLost,
      player.equippedGear,
      player.playerClass
    )
    playerStore.getState().takeDamage(hpLost)
    
    // 6. Break streak
    const previousStreak = player.streak
    const streakBroken = scenario.rektConsequences.streakBroken
    if (streakBroken) {
      playerStore.getState().breakStreak()
    }
    
    // 7. Still give a small XP reward (you learned something)
    const consolationXP = ProgressionEngine.calculateScenarioXP(
      'rekt', scenario.difficulty, scenario.isBoss, 0
    )
    playerStore.getState().addXP(consolationXP)
    
    // 8. Record in game progress
    gameStore.getState().completeScenario(scenarioId, 'rekt', 
      scenarioStore.getState().choicesMade)
    
    // 9. Add REKT transaction to portfolio history
    portfolioStore.getState().addTransaction({
      type: 'rekt-loss',
      label: `💀 REKT: ${scenario.education.attackName}`,
      sublabel: `Lost $${moneyLost.toLocaleString()}`,
      amount: -moneyLost,
      isSuspicious: false,
    })
    
    // 10. Check achievements (yes, even after rekt — "First REKT" achievement)
    const { processGameAction } = await import('../engine/AchievementEngine')
    await processGameAction('scenario-complete')
    
    // 11. Check game over
    const isGameOver = playerStore.getState().stats.hp <= 0
    
    // 12. Navigate to REKT screen with data
    navigation.replace('/rekt', {
      scenarioId,
      moneyLost: Math.round(moneyLost),
      hpLost,
      attackType: scenario.education.attackName,
      communityRektRate: scenario.communityRektRate,
      previousStreak,
      streakBroken,
      isGameOver,
      gearSaved: gearMitigation.amountProtected,
      consolationXP,
    })
    
    return {
      moneyLost, hpLost, streakBroken, previousStreak,
      attackType: scenario.education.attackName,
      communityRektRate: scenario.communityRektRate,
      isGameOver,
    }
  }

  // ========== SURVIVED OUTCOME ==========
  static async processSurvived(
    scenarioId: string,
    navigation: any,
    wasAutoDetected: boolean = false
  ): Promise<{
    xpEarned: number;
    coinsEarned: number;
    securityTokensEarned: number;
    statBoosts: Array<{ stat: string; amount: number }>;
    leveledUp: boolean;
    newLevel?: number;
    newTitle?: string;
    achievementsUnlocked: string[];
    streakCount: number;
    saferThanPct: number;
  }> {
    
    const scenario = scenarioStore.activeScenario!
    const player = playerStore.getState()
    
    // 1. Calculate XP (reduced if auto-detected)
    let xpEarned = ProgressionEngine.calculateScenarioXP(
      'survived', scenario.difficulty, scenario.isBoss, player.streak
    )
    if (wasAutoDetected) xpEarned = Math.round(xpEarned * 0.5)
    
    // 2. Add XP and check level up
    const levelResult = ProgressionEngine.checkLevelUp(
      player.level, player.xp, xpEarned
    )
    playerStore.getState().addXP(xpEarned)
    
    if (levelResult.levelsGained > 0) {
      // Level up happened — will show celebration on survived screen
      for (let i = 0; i < levelResult.levelsGained; i++) {
        playerStore.getState().levelUp()
      }
    }
    
    // 3. Award coins and security tokens
    const rewards = scenario.survivedRewards
    const coinsEarned = rewards.coins
    const securityTokensEarned = rewards.securityTokens
    
    playerStore.getState().addCoins(coinsEarned)
    playerStore.getState().addSecurityTokens(securityTokensEarned)
    
    // 4. Apply stat boosts
    for (const boost of rewards.statBoosts) {
      playerStore.getState().updateStat(boost.stat, boost.amount)
    }
    
    // 5. Detection stat always goes up when surviving
    playerStore.getState().updateStat('detection', 3)
    
    // 6. Streak continues (streak only breaks on rekt)
    const streakCount = player.streak
    
    // 7. Record in game progress
    gameStore.getState().completeScenario(scenarioId, 'survived',
      scenarioStore.getState().choicesMade)
    
    // 8. Check if chapter is now complete
    const chapterProgress = gameStore.getState().getChapterProgress(
      scenario.chapter
    )
    if (chapterProgress.completed === chapterProgress.total) {
      // Chapter complete! Advance to next
      gameStore.getState().advanceChapter()
      // Unlock chapter completion achievement
    }
    
    // 9. Add survival transaction
    portfolioStore.getState().addTransaction({
      type: 'received',
      label: `🛡️ Survived: ${scenario.title}`,
      sublabel: `+${coinsEarned} coins, +${xpEarned} XP`,
      amount: coinsEarned,
      isSuspicious: false,
    })
    
    // 10. Check achievements
    const { processGameAction } = await import('../engine/AchievementEngine')
    const newAchievements = await processGameAction('scenario-complete')
    
    // 11. Calculate "safer than X% of players"
    const saferThanPct = 100 - scenario.communityRektRate
    
    // 12. Navigate to Survived screen with data
    navigation.replace('/survived', {
      scenarioId,
      xpEarned,
      coinsEarned,
      securityTokensEarned,
      statBoosts: JSON.stringify(rewards.statBoosts),
      leveledUp: levelResult.levelsGained > 0,
      newLevel: levelResult.newLevel,
      newTitle: levelResult.levelsGained > 0 
        ? ProgressionEngine.getTitleForLevel(levelResult.newLevel) 
        : undefined,
      streakCount,
      saferThanPct,
      blocked: scenario.title,
      achievementsUnlocked: JSON.stringify(newAchievements || []),
    })
    
    return {
      xpEarned, coinsEarned, securityTokensEarned,
      statBoosts: rewards.statBoosts,
      leveledUp: levelResult.levelsGained > 0,
      newLevel: levelResult.newLevel,
      newTitle: levelResult.levelsGained > 0 
        ? ProgressionEngine.getTitleForLevel(levelResult.newLevel) 
        : undefined,
      achievementsUnlocked: newAchievements?.map(a => a.name) || [],
      streakCount,
      saferThanPct,
    }
  }
}

Now UPDATE the REKT screen (10) to:
- Read all data from route params instead of hardcoded values
- Show actual money lost, HP lost, streak info
- If gearSaved > 0, show: "🛡️ Gear saved $X"
- If isGameOver, show "Game Over" overlay after 2 seconds
- "Learn Why" button passes scenarioId to Education screen

And UPDATE the Survived screen (11) to:
- Read all data from route params
- Show actual XP, coins, security tokens earned
- If leveledUp, show level up celebration: "⬆️ Level X! New title: TRADER"
- If achievementsUnlocked.length > 0, show achievement toast
- Show actual streak count and "safer than" percentage
- "Continue" passes scenarioId to Education screen
```

### After:
```
> Test: play a scenario and get rekt. Verify money actually decreased 
  in portfolioStore. Verify HP dropped. Verify streak reset.
  Then test survival: verify XP increased, coins added, stats boosted.
  Git commit "feat: wire outcome processing with real state updates"
```

---

## PROMPT 4 — Education → Share → Return Flow

```
Wire the post-outcome flow: Education Post-Mortem → Share Card → 
back to Wallet Home.

Reference the flow: REKT/Survived → Education (12) → Share (21) → Wallet (03)

EDUCATION SCREEN (update screen 12):

On mount:
1. Get scenarioId from route params
2. Load education content: scenarioStore.getEducation()
   OR load directly from scenario JSON file if scenarioStore is cleared
3. Display all education content (how it worked, red flags, IRL protection)

On "Got it! Continue →" press:
1. Award knowledge XP: playerStore.updateStat('knowledge', 5)
2. Award small XP: playerStore.addXP(30) // reading education bonus
3. Track that education was read (for achievements)
4. Navigate to Share Card screen, passing outcome data:
   router.push('/share', {
     type: outcomeType, // 'rekt' or 'survived'
     amount: moneyLost or portfolioValue,
     attackType: scenario.education.attackName,
     streak: playerStore.streak,
     communityRektRate: scenario.communityRektRate,
     scenarioId: scenarioId,
   })

SHARE CARD SCREEN (update screen 21):

On mount:
1. Read type and data from route params
2. Generate the appropriate card (REKT or Survived)

REKT card shows:
- 💀 GOT REKT
- -$[moneyLost] (from route params)
- Attack: [attackType]
- [communityRektRate]% fell for this
- REKT — CRYPTO SURVIVAL RPG watermark

SURVIVED card shows:
- 🛡️ SURVIVED
- $[portfolioValue] safe
- Blocked: [attackType] · [streak] day streak 🔥
- Top [100 - communityRektRate]% of players
- REKT — CRYPTO SURVIVAL RPG watermark

Buttons:
- "📸 Save Screenshot":
  Use react-native-view-shot to capture the card as an image
  Save to device gallery using expo-media-library
  Show toast: "Card saved! 📸"

- "📤 Share":
  Use expo-sharing to open native share sheet with the card image
  Share text: "I just [got REKT / survived] in REKT — The Crypto 
  Survival RPG! Can you do better? 🎮"

- "← Back to Wallet" or auto-navigate after sharing:
  IMPORTANT navigation behavior:
  - Clear the scenario navigation stack
  - Navigate back to Wallet Home (tab 1)
  - Use router.replace('/') or navigation.reset to prevent
    going "back" into the scenario flow
  - The scam encounter is fully complete at this point

POST-RETURN TO WALLET:

After returning to Wallet Home, the screen should reflect ALL changes:
- Updated portfolio balance (lower if rekt, same if survived)
- Updated HP bar
- Updated streak counter (0 if rekt, same/higher if survived)
- The suspicious notification/activity that started the encounter 
  should be marked as "resolved" (gray it out or remove it)
- If a new scenario is available, a NEW scam notification should 
  appear in the next session (not immediately — give player a break)

Create a post-encounter cleanup function:

function cleanupAfterEncounter(scenarioId: string) {
  // 1. Clear scenarioStore
  scenarioStore.getState().resetScenario()
  
  // 2. Mark the triggering notification/activity as resolved
  // Remove or gray out the notification that led to this scenario
  
  // 3. Recalculate portfolio totals
  portfolioStore.getState().recalculateTotals()
  
  // 4. Check if new content unlocked
  const game = gameStore.getState()
  if (game.isChapterComplete(game.currentChapter)) {
    // Queue a chapter complete celebration for next wallet home visit
  }
  
  // 5. Check if NPC dialogue should trigger (see Prompt 9)
  // After certain scenarios, NPCs react to what happened
}

Call cleanupAfterEncounter when navigating back to Wallet Home.

Also handle the SKIP SHARE case:
- If user presses Android back button on Share screen → go to Wallet
- If user presses back on Education screen → go to Wallet (skip share)
- The flow should never get stuck — every exit leads back to Wallet
```

### After:
```
> Test the FULL post-outcome flow:
  1. Survive a scenario → Education → verify knowledge XP gained →
     Share Card → verify card shows correct data → Back to Wallet
  2. Get rekt → Education → Share → Back → verify wallet shows 
     lower balance and HP
  3. Press back button at various points — verify no stuck screens
  Git commit "feat: wire education, share card, and return flow"
```

---

## PROMPT 5 — Wallet Home — All Tap Targets Connected

```
Update the Wallet Home screen (03) so EVERY interactive element 
is connected to real navigation and real data.

Reference docs/REKT-Final-Build-Plan.md "FROM WALLET HOME" section.

All data should come from stores (no more hardcoded values):

TOP BAR:
- 🏆 Challenge button → router.push('/challenge-creator')
- 🔥 streak count → playerStore.streak (show "🔥0" if no streak)
- 🔔 notification bell → router.push('/notifications')
  - Badge count = ScamDeliveryEngine.getUnreadCount()
  - Badge hidden when count is 0

HP BAR:
- Width = playerStore.stats.hp + "%" 
- Color: green if hp > 50, yellow if 25-50, red if < 25
- Label: "{hp}HP"
- If HP < 25, pulse the bar with a warning animation

BALANCE:
- Total: portfolioStore.totalValue (formatted with commas and .00)
- Change: portfolioStore.dailyChange and dailyChangePct
- Color: green if positive, red if negative

QUICK ACTIONS:
- 🔥 Claim → check if daily reward available
  - If not claimed today: router.push('/daily-reward')
  - If already claimed: show toast "Already claimed today!"
- 🔄 Swap → show toast "Swap feature coming in Chapter 2"
  (or navigate to a simple swap screen if built)
- 🦊 Stake → show toast "Stake feature coming soon"
- 🔍 Inspect → uses Analyst ability or costs resources
  router.push('/scanner') if scanner unlocked, else toast

HOLDINGS:
- Map from portfolioStore.holdings
- Each token row is tappable → router.push('/portfolio-detail?token=' + token.id)
- Suspicious tokens (isSuspicious === true) show with yellow tint
- Tapping a suspicious token → router.push('/scenario?id=' + token.linkedScenarioId)

RECENT ACTIVITY:
- Show last 3 items from portfolioStore.transactions
- Each item tappable:
  - Normal transactions → router.push('/activity-feed')
  - Suspicious transactions (isSuspicious) → 
    router.push('/scenario?id=' + tx.linkedScenarioId)
- Suspicious items have yellow/orange styling
- "See all →" link at bottom → router.push('/activity-feed')

DYNAMIC CONTENT — what changes between sessions:

On each visit to Wallet Home, refresh:
1. Holdings prices (from last simulateDay)
2. Notification count (regenerate notifications)
3. Activity feed (add any new transactions)
4. Check if any pending NPC dialogue should trigger

Add a useEffect/useFocusEffect hook that runs when the screen 
gains focus (user tabs back to it):

useFocusEffect(() => {
  // Refresh portfolio display
  portfolioStore.getState().recalculateTotals()
  
  // Check for new scam delivery
  if (ScamDeliveryEngine.shouldInjectScam()) {
    const scamTx = ScamDeliveryEngine.generateScamActivity(...)
    portfolioStore.getState().injectScamTransaction(scamTx)
  }
})
```

### After:
```
> Test every tap target on Wallet Home. Verify:
  - All navigation works
  - All data comes from stores (change a store value, verify UI updates)
  - Suspicious items navigate to scenarios
  - Quick actions show appropriate responses
  Git commit "feat: wire all wallet home interactions"
```

---

## PROMPT 6 — Tab Navigation — All 5 Tabs Wired

```
Ensure all 5 bottom tabs are fully connected to real screens 
with real data.

TAB 1: 🏠 Wallet → Wallet Home (03)
  - Already wired in Prompt 5
  - This is the default/home tab

TAB 2: 🗺️ Map → World Map (16)
  - Chapter list from gameStore.chapters
  - Progress from gameStore.getChapterProgress(chapterId)
  - Current chapter highlighted (green border)
  - Locked chapters dimmed — check gameStore.canAccessChapter(id)
  
  Tap interactions:
  - Completed chapter → show chapter summary modal:
    "✅ Genesis Block — Complete! 5/5 scenarios survived"
    With "Replay" button for each scenario
  - Current chapter → show scenario list:
    "DEX District — 3/5 complete"
    List each scenario: ✅ done / ⬜ not done / 🔒 boss (locked until others done)
    Tapping an undone scenario → start that encounter
  - Locked chapter → show toast "Reach Level X to unlock"

TAB 3: 🔍 Scanner → Scam Scanner (07)
  - If gameStore.scannerUnlocked === false:
    Show "Coming Soon" placeholder with:
    "🔍 Scam Scanner unlocks after completing Chapter 2"
    Progress bar showing how close they are
  - If unlocked:
    Show full scanner screen (from Phase 3)

TAB 4: 📊 Stats → Character Profile (14)
  - All stats from playerStore
  - Record from gameStore.scenarioResults
  - Navigation to sub-screens:
    - "View Gear" button → router.push('/gear')
    - "Leaderboard" button → router.push('/leaderboard')
    - Achievement list tappable for details

TAB 5: ⚙️ More → Settings (22)
  - All toggles functional (store in a settingsStore or playerStore)
  - "Reset Progress" with confirmation alert:
    Alert.alert(
      "Reset All Progress?",
      "This will delete your character, portfolio, and all game progress. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Everything", 
          style: "destructive",
          onPress: () => {
            playerStore.getState().resetAll()
            portfolioStore.getState().resetPortfolio()
            gameStore.getState().resetGame()
            scenarioStore.getState().resetScenario()
            router.replace('/onboarding')
          }
        }
      ]
    )

TAB BADGE:
- Scanner tab: show a "NEW" badge when first unlocked
- Wallet tab: show red dot when unread notifications exist
- Stats tab: show green dot when new achievements unlocked

NAVIGATION STACK per tab:
Each tab should have its own stack navigator so screens pushed 
within a tab don't affect other tabs:

Wallet tab stack: Wallet Home → Portfolio Detail, Notifications, Activity Feed
Map tab stack: World Map → Scenario (from chapter list)
Scanner tab stack: Scanner → Risk Report
Stats tab stack: Profile → Gear, Leaderboard
More tab stack: Settings

When switching tabs, the stack should reset to the root screen 
of that tab (standard mobile behavior).
```

### After:
```
> Test: navigate between all 5 tabs. Verify each shows correct data.
  Test stack navigation within tabs. Test tab badges.
  Git commit "feat: wire all tab navigation with real data"
```

---

## PROMPT 7 — Deep Links & Cross-Screen Navigation

```
Wire up all the cross-screen navigation that doesn't fit neatly 
into the tab structure — notifications, challenges, and edge cases.

NOTIFICATION → SCENARIO DEEP LINK:

When a notification is tapped (from Notifications screen OR from 
a push notification if we add those later):

1. Parse the linkedScenarioId from the notification
2. Check if scenario exists and hasn't been completed
3. If valid → ScamEncounterFlow.startEncounter(scenarioId, navigation)
4. If already completed → show toast "You already completed this scenario"
5. If invalid → show toast "This notification has expired"

CHALLENGE LINK (future-proof):

When opening a challenge link (for now, mock it):
1. Parse challengeId from link
2. Load challenge scenario
3. Navigate directly to Scenario screen in "challenge mode"
4. After outcome → show Challenge Result screen instead of normal flow

GEAR UNLOCK NAVIGATION:

When a gear item is unlocked (from achievement or level up):
1. Show a toast/modal: "🔓 New gear unlocked: Hardware Wallet!"
2. "View" button → navigate to Gear screen (tab 4, push gear screen)
3. "Later" → dismiss

CHAPTER COMPLETE NAVIGATION:

When a chapter is completed (last scenario in chapter survived):
1. After the normal Survived → Education → Share flow
2. On return to Wallet Home, show a celebration modal:
   "🎉 Chapter 1 Complete!"
   "You survived all 5 scenarios in Genesis Block"
   "Chapter 2: DEX District is now unlocked!"
   Buttons: "Continue →" (dismiss) | "View Map" (navigate to Map tab)

LEVEL UP NOTIFICATION:

When player levels up (can happen on Survived screen or Daily Reward):
1. Show inline on the triggering screen (Survived shows "⬆️ Level 12!")
2. If new content unlocked at this level, show toast:
   "Level 10 reached! Hardware Wallet unlocked in Gear shop"
3. If new chapter unlocked at this level:
   "Level 6 reached! Chapter 2: DEX District is now accessible"

GAME OVER → RESTART:

When HP reaches 0:
1. REKT screen shows normally
2. After 2 seconds, Game Over modal overlays:
   "💀 GAME OVER"
   "Your HP reached zero. The scammers got you."
   "But every failure is a lesson. Try again?"
   Stats shown: scenarios completed, days survived, money earned
   Button: "Restart Chapter →"
3. On restart:
   - Reset HP to 100
   - Set portfolio to chapter starting value
   - Reset current chapter scenarios (not previous chapters)
   - Navigate to Wallet Home
   - Show NPC dialogue: Sensei says "Fall seven times, stand up eight."

BACK BUTTON HANDLING (Android):

Handle the hardware back button properly on every screen:
- On Wallet Home → exit app (or do nothing)
- On any pushed screen → go back (default)
- On Scenario mid-encounter → show confirm dialog:
  "Leave scenario? Your progress in this encounter will be lost."
- On REKT/Survived screens → go to Education (can't go back to scenario)
- On Share screen → go to Wallet Home (skip nothing)
- On Onboarding → prevent back (can't exit onboarding)
- On Daily Reward → prevent back (must claim or dismiss)

Create src/utils/navigationHelpers.ts with:
- handleBackPress(currentScreen: string): boolean
- navigateToWalletHome(navigation): void  // safe reset
- navigateToScenario(scenarioId, navigation): void
- navigateAfterOutcome(outcomeType, data, navigation): void
```

### After:
```
> Test all deep link scenarios:
  - Notification tap → full scam flow → back to wallet
  - Chapter completion celebration
  - Level up notification with content unlock
  - Game over → restart flow
  - Back button on every screen
  Git commit "feat: wire deep links and cross-screen navigation"
```

---

## PROMPT 8 — Daily Simulation Loop

```
Create the daily simulation that runs once per day (on daily reward claim).
This makes the game world feel alive between scam encounters.

Create src/engine/DailySimulation.ts:

class DailySimulation {

  // Master function — runs everything for a new day
  static async runDailySimulation(): Promise<{
    marketChanges: string[];       // summary of what changed
    newNotifications: number;      // count of new notifications
    investmentReturns: number;     // total earned from investments
    rugPullTriggered: boolean;     // did a rug pull happen?
    newScamInjected: boolean;      // was a new scam added to feed?
    npcDialogueReady: string | null; // NPC ID if dialogue should trigger
  }> {
    
    const player = playerStore.getState()
    const portfolio = portfolioStore.getState()
    const game = gameStore.getState()
    
    // === 1. MARKET SIMULATION ===
    // Randomize all token prices
    const marketResult = EconomyEngine.simulateDay(
      portfolio.holdings,
      portfolio.activeInvestments,
      game.gameDay,
      game.currentChapter
    )
    
    // Apply price changes to portfolio
    for (const token of marketResult.updatedHoldings) {
      portfolioStore.getState().updateTokenPrice(
        token.id, token.pricePerUnit, token.dailyChangePct
      )
    }
    
    // === 2. INVESTMENT RETURNS ===
    // Process daily yields from staking, LPs, etc.
    const investmentReturns = marketResult.investmentReturns
    if (investmentReturns > 0) {
      portfolioStore.getState().addFunds(investmentReturns, 'Investment returns')
    }
    
    // === 3. RUG PULL CHECK ===
    // Any investment hit its rug pull day?
    let rugPullTriggered = false
    if (marketResult.rugPullTriggered) {
      rugPullTriggered = true
      const rugResult = EconomyEngine.processRugPull(marketResult.rugPullTriggered)
      portfolioStore.getState().drainFunds(rugResult.totalLost, 'Rug pull')
      portfolioStore.getState().addTransaction(rugResult.transactionRecord)
      // This will trigger the rug pull scenario on next notification check
    }
    
    // === 4. SCAM INJECTION ===
    // Decide if new scam content should appear today
    let newScamInjected = false
    const shouldInject = ScamDeliveryEngine.shouldTriggerScam(
      game.lastScamTime || '',
      game.gameDay,
      game.currentChapter,
      game.completedScenarios,
      game.chapters[game.currentChapter - 1].scenarioIds.length
    )
    
    if (shouldInject) {
      const nextScam = ScamDeliveryEngine.selectNextScenario(
        game.currentChapter,
        game.completedScenarios,
        player.playerClass
      )
      
      if (nextScam) {
        newScamInjected = true
        
        // Inject into appropriate channel
        if (nextScam.deliveryChannel === 'activity-feed') {
          const scamTx = ScamDeliveryEngine.generateScamActivity(nextScam)
          portfolioStore.getState().injectScamTransaction(scamTx)
        }
        
        if (nextScam.deliveryChannel === 'notification') {
          // Scam will appear in notification list on next check
          // Store the pending scam notification
        }
        
        // Dust attack — inject suspicious token
        if (Math.random() < 0.15) { // 15% chance per day
          const dustToken = EconomyEngine.createDustAttackToken()
          portfolioStore.getState().injectScamToken(dustToken)
        }
      }
    }
    
    // === 5. HP RECOVERY ===
    const hpRecovery = ProgressionEngine.calculateHPRecovery(
      player.stats.hp, player.streak
    )
    if (hpRecovery > 0) {
      playerStore.getState().healHP(hpRecovery)
    }
    
    // === 6. ABILITY RESET ===
    playerStore.getState().resetDailyAbilities()
    
    // === 7. PORTFOLIO SNAPSHOT ===
    portfolioStore.getState().takeSnapshot()
    portfolioStore.getState().recalculateTotals()
    
    // === 8. REGENERATE NOTIFICATIONS ===
    // Fresh mix of legit + scam notifications for today
    const notifications = ScamDeliveryEngine.generateNotifications(
      game.currentChapter,
      game.completedScenarios,
      game.gameDay
    )
    // Store notifications (create a notificationStore or add to gameStore)
    
    // === 9. NPC DIALOGUE CHECK ===
    const npcDialogueReady = checkNPCTriggers(game, player)
    
    // === 10. ADVANCE GAME DAY ===
    gameStore.getState().advanceGameDay()
    
    // === 11. CHECK ACHIEVEMENTS ===
    const { processGameAction } = await import('../engine/AchievementEngine')
    await processGameAction('daily-claim')
    
    return {
      marketChanges: generateMarketSummary(marketResult),
      newNotifications: notifications.filter(n => n.type === 'scam').length,
      investmentReturns,
      rugPullTriggered,
      newScamInjected,
      npcDialogueReady,
    }
  }
}

// Helper: generate human-readable market summary
function generateMarketSummary(result): string[] {
  return result.updatedHoldings.map(t => 
    `${t.symbol}: ${t.dailyChangePct > 0 ? '+' : ''}${t.dailyChangePct.toFixed(1)}%`
  )
}

// Helper: check if any NPC should speak today
function checkNPCTriggers(game, player): string | null {
  // Sensei speaks after first survival
  if (game.completedScenarios.length === 1) return 'sensei-intro'
  // Sensei speaks after first rekt
  if (Object.values(game.scenarioResults).some(r => r.outcome === 'rekt') 
      && !game.npcDialoguesShown?.includes('sensei-after-rekt'))
    return 'sensei-after-rekt'
  // Rick appears in Chapter 1 after scenario 3
  if (game.completedScenarios.length >= 3 
      && !game.npcDialoguesShown?.includes('rick-intro'))
    return 'rick-intro'
  return null
}

INTEGRATE into Daily Reward screen (20):

When player taps "Claim →":
1. Show claiming animation (1s)
2. Run DailySimulation.runDailySimulation()
3. Show summary of what happened:
   "Market moves: ETH +2.3%, USDC +0.0%, $MOON +15.2%"
   "Investment returns: +$45.20"
   If rug pull: "⚠️ Warning: One of your investments was rugged!"
4. Navigate to Wallet Home
5. If npcDialogueReady, show NPC dialogue overlay within 2 seconds
```

### After:
```
> Test: claim daily reward. Verify portfolio prices changed.
  Verify new notifications generated. Verify HP recovered.
  Git commit "feat: wire daily simulation loop"
```

---

## PROMPT 9 — NPC Story Triggers

```
Wire up when and how NPC dialogues appear during gameplay.
NPCs react to player actions and advance the story.

Reference NPC Characters in docs/REKT-Final-Build-Plan.md.

Create src/engine/NPCTriggerEngine.ts and src/data/npc-dialogues.ts:

NPC TRIGGER CONDITIONS:

Define when each NPC speaks. Store dialogues as JSON data.

SATOSHI SENSEI (🧙):
  Trigger 1: "sensei-intro" — After player's FIRST scenario (any outcome)
    "Welcome to The Chain, young one. You've taken your first step. 
    Whether you survived or fell, you've learned something today."
    Choice: "What should I do next?" → 
    "Observe. Question everything. The best defense is healthy suspicion."

  Trigger 2: "sensei-after-rekt" — After player's FIRST rekt
    "Ah, you've been rekt. Good."
    Choice: "Good?! I lost everything!" →
    "Better to lose fake money here than real money out there. 
    What did you miss? Think about it."

  Trigger 3: "sensei-chapter-complete" — After completing each chapter
    Chapter 1: "You've mastered the basics. But the real world is more subtle."
    Chapter 2: "DEX trading is where most lose their wealth. You survived."

  Trigger 4: "sensei-streak-7" — When streak hits 7
    "A week without falling. Your instincts are sharpening."

SCAMMY SAM (😈) — appears in disguise:
  Trigger 1: "sam-ch1-disguise" — Randomly during Chapter 1
    Appears as "Crypto Helper Bot" offering a "portfolio optimizer"
    This is a mini-scam that's part of the story (not a full scenario)
    Player choice determines if they trust random DMs

  Trigger 2: "sam-ch2-disguise" — During Chapter 2
    Appears as "Dev Dan" from $MOONRISE (already in wireframes)

REKT RICK (👪):
  Trigger 1: "rick-intro" — After completing 3 scenarios in Chapter 1
    "Hey... I'm Rick. I lost $230,000 to a phishing scam last month.
    Real money. Not like this game. Can you help me understand what I 
    did wrong?"
    Player helps Rick understand his mistake → +reputation

  Trigger 2: "rick-progress" — After Chapter 2
    "Thanks to you, I started using a hardware wallet. 
    I'm rebuilding slowly."

WHALE WENDY (🐋):
  Trigger 1: "wendy-intro" — Start of Chapter 2
    "I'm Wendy. $2M portfolio. Been in crypto since 2017. 
    Don't worry, I've seen it all."
    (Sets up her getting hacked in Chapter 3)

NPC TRIGGER ENGINE:

class NPCTriggerEngine {

  // Check all NPC triggers against current game state
  static checkTriggers(
    gameState: GameState,
    playerState: PlayerState
  ): { npcId: string; dialogueId: string } | null {
    
    const shown = gameState.npcDialoguesShown || []
    
    // Check each trigger condition
    for (const trigger of NPC_TRIGGERS) {
      if (shown.includes(trigger.dialogueId)) continue  // already shown
      if (trigger.condition(gameState, playerState)) {
        return { npcId: trigger.npcId, dialogueId: trigger.dialogueId }
      }
    }
    return null
  }

  // Load dialogue content for an NPC trigger
  static getDialogue(dialogueId: string): {
    npcName: string;
    npcEmoji: string;
    nameColor: string;
    messages: string[];
    choices: Array<{ text: string; response: string; reputationChange?: number }>;
  }

  // Mark a dialogue as shown
  static markShown(dialogueId: string) {
    gameStore.getState().markNPCDialogueShown(dialogueId)
  }
}

// Trigger definitions
const NPC_TRIGGERS = [
  {
    npcId: 'sensei',
    dialogueId: 'sensei-intro',
    condition: (game, player) => game.completedScenarios.length === 1,
  },
  {
    npcId: 'sensei', 
    dialogueId: 'sensei-after-rekt',
    condition: (game, player) => 
      Object.values(game.scenarioResults).some(r => r.outcome === 'rekt'),
  },
  {
    npcId: 'rick',
    dialogueId: 'rick-intro', 
    condition: (game, player) => game.completedScenarios.length >= 3,
  },
  {
    npcId: 'wendy',
    dialogueId: 'wendy-intro',
    condition: (game, player) => game.currentChapter >= 2,
  },
  {
    npcId: 'sensei',
    dialogueId: 'sensei-streak-7',
    condition: (game, player) => player.streak >= 7,
  },
  // ... more triggers
]

INTEGRATION INTO WALLET HOME:

Add a useEffect on Wallet Home that checks for NPC triggers:

useFocusEffect(() => {
  const trigger = NPCTriggerEngine.checkTriggers(gameState, playerState)
  if (trigger) {
    // Show NPC dialogue as a modal overlay on Wallet Home
    // Use a 1.5 second delay so player sees their wallet first
    setTimeout(() => {
      setActiveNPCDialogue(trigger)
      setShowNPCModal(true)
    }, 1500)
  }
})

Create an NPCDialogueModal component that:
- Shows over the current screen (not a full navigation)
- Displays NPC portrait, name, dialogue
- Player taps choices → NPC responds
- After dialogue ends → modal closes
- Mark dialogue as shown via NPCTriggerEngine.markShown()
- Apply any reputation changes

Add npcDialoguesShown: string[] to gameStore.
Add markNPCDialogueShown(id: string) action to gameStore.
```

### After:
```
> Test: complete 1 scenario → verify Sensei intro appears on Wallet Home.
  Complete 3 scenarios → verify Rick intro appears.
  Get rekt → verify Sensei "that's good" dialogue appears.
  Git commit "feat: wire NPC story triggers"
```

---

## PROMPT 10 — Full Integration Test + Bug Sweep ⭐

```
Run a complete integration test of the entire app. Go through every 
flow and fix any bugs.

TEST SCRIPT — go through each of these in order:

=== TEST 1: FRESH INSTALL ===
1. Clear all AsyncStorage / app data
2. Open app → should show loading screen briefly → Splash screen
3. Swipe through all 3 onboarding pages
4. Verify dot pagination updates
5. Tap "Start Playing" → Character Select
6. Tap each class → verify selection changes (green border)
7. Verify confirm button text updates to match selected class
8. Select "The Ape" → tap Confirm
9. Should navigate to Daily Reward (Day 1, no streak)
10. Verify reward amounts shown
11. Tap "Claim" → should navigate to Wallet Home

=== TEST 2: WALLET HOME CORRECTNESS ===
12. Verify streak shows 🔥0 or 🔥1
13. Verify HP bar at 100%
14. Verify portfolio balance matches starting value for Ape class
15. Verify holdings show 3 tokens with correct data
16. Verify at least 1 suspicious item in activity feed
17. Tap 🏆 Challenge → should navigate to Challenge Creator
18. Tap 🔔 notification bell → should navigate to Notifications
19. Verify notification badge shows correct unread count

=== TEST 3: SCAM FLOW — SURVIVED ===
20. Tap a scam notification → Scenario screen loads
21. Verify scenario title, NPC avatar, messages appear
22. Wait for all messages → choices appear
23. Tap "🚫 Ignore & block" (or correct survival choice)
24. Brief pause → navigate to Survived screen
25. Verify: correct $ amount, XP earned, streak count
26. Tap "Continue" → Education screen
27. Verify: attack analysis content loaded correctly
28. Tap "Got it!" → Share Card screen
29. Verify: SURVIVED card with correct data
30. Tap "Back to Wallet" → Wallet Home
31. Verify: XP increased (check Stats tab)
32. Verify: scenario marked complete (check Map tab)

=== TEST 4: SCAM FLOW — REKT ===
33. Navigate to Notifications → tap another scam notification
34. Scenario screen → choose the WRONG answer (share seed phrase etc.)
35. Brief pause → REKT screen
36. Verify: money lost amount, HP decreased, attack type
37. Verify: streak shows broken (if was > 0)
38. Tap "Learn Why" → Education screen
39. Verify education content
40. Tap "Got it!" → Share Card
41. Verify: REKT card with correct data  
42. Back to Wallet → verify portfolio balance DECREASED
43. Verify HP bar decreased

=== TEST 5: BRANCHING DIALOGUE ===
44. Start a new scenario
45. Choose "🔍 Inspect their profile" (clue path)
46. Verify: investigation results shown
47. Verify: new/updated choices appear
48. Choose survival option from the clue branch
49. Verify survived with correct rewards

=== TEST 6: APPROVAL POPUP ===
50. Start the "Fake Airdrop" scenario (ch1-fake-airdrop)
51. Follow choices until approval popup appears
52. Verify: popup shows UNLIMITED amount in red
53. Tap "Reject" → Survived screen
54. Repeat: tap "Approve" → REKT screen

=== TEST 7: DAILY LOOP ===
55. Close and reopen app
56. Should show Daily Reward (if new session)
57. Claim rewards → verify market prices changed
58. Verify new notifications generated
59. Verify portfolio value updated

=== TEST 8: PROGRESSION ===
60. Open Stats tab → Profile screen
61. Verify level, XP, and stats match expected values
62. Verify survival record (survived count, rekt count, rate)
63. Open Gear screen → verify equipped gear shown
64. Open World Map → verify chapter progress
65. Verify completed scenarios shown as ✅
66. Verify next chapter locked if level too low

=== TEST 9: NPC TRIGGERS ===
67. After first scenario → Sensei intro should appear on Wallet Home
68. After first rekt → Sensei "good" dialogue should appear
69. After 3 scenarios → Rick intro should appear
70. Dismiss NPC dialogues → verify they don't repeat

=== TEST 10: SETTINGS ===
71. Open Settings (More tab)
72. Toggle notifications → verify toggle state saves
73. Tap "Reset Progress" → confirm dialog appears
74. Tap "Cancel" → nothing happens
75. Tap "Reset Everything" → all stores cleared → onboarding screen

=== TEST 11: EDGE CASES ===
76. Get rekt multiple times → verify HP reaches 0 → Game Over modal
77. Tap "Restart Chapter" → verify chapter reset correctly
78. Rapidly tap choices → verify no double-navigation
79. Press back button on every screen → verify correct behavior
80. Switch between tabs rapidly → verify no crashes

FIX any bugs found during these tests. For each bug:
1. Identify the issue
2. Fix it
3. Verify the fix
4. Continue testing

After all tests pass, do a final code cleanup:
- Remove any remaining hardcoded data
- Remove console.log statements
- Verify all TypeScript types are correct (run npx tsc --noEmit)
- Verify no unused imports
```

### After:
```
> Run the full 80-point test. Fix all bugs found.
  Then: git commit "feat: complete integration test — all flows working"
```

---

## 📝 Summary — Phase 5: 10 Prompts

| # | Flow | What It Connects |
|---|------|-----------------|
| 1 | App Entry | Launch → onboarding OR daily reward → wallet home |
| 2 | Scam Encounter ⭐ | Notification tap → scenario → choices → outcome |
| 3 | Outcome Processing | REKT damage calculations, Survived reward calculations |
| 4 | Post-Outcome | Education → Share Card → clean return to Wallet |
| 5 | Wallet Home Wiring | Every tap target on the main screen |
| 6 | Tab Navigation | All 5 tabs with real data and stack navigation |
| 7 | Deep Links | Notifications, chapter unlocks, game over, back button |
| 8 | Daily Simulation | Market moves, scam injection, HP recovery, yields |
| 9 | NPC Story Triggers | When/how Sensei, Rick, Wendy, Sam appear |
| 10 | Integration Test ⭐ | 80-point test script covering every flow |

**Estimated time: ~2-3 days with Claude Code**

---

## 🏁 After Phase 5 — What You Have

```
A FULLY PLAYABLE GAME:

✅ Onboarding → class selection → portfolio setup
✅ Daily reward loop with market simulation
✅ 5 interactive scam scenarios with branching dialogues
✅ Approval popup scam mechanic  
✅ REKT / Survived outcomes with real state changes
✅ Education post-mortems teaching real security
✅ Share cards for social media
✅ XP, leveling, stats that actually update
✅ Gear that affects gameplay
✅ Class abilities that trigger
✅ Streak system (breaks on rekt, not on skip)
✅ Achievement auto-checking
✅ NPC story that reacts to player choices
✅ World map with chapter progression
✅ 5-tab navigation fully wired
✅ Game over and restart system
✅ Settings with full reset

READY FOR:
→ User testing with friends
→ Adding Chapters 2-5 scenarios (just JSON files!)
→ Play Store submission (Phase 6)
```
