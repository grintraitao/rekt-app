import {
  useScenarioStore,
  registerScenario,
  type ScenarioDefinition,
} from "../scenarioStore";
import { usePlayerStore } from "../playerStore";
import { usePortfolioStore } from "../portfolioStore";

// ── Test scenario fixture ───────────────────────────────────────────────────────

const FAKE_SUPPORT_SCENARIO: ScenarioDefinition = {
  id: "test-fake-support",
  chapter: 1,
  scenarioIndex: 1,
  title: "Fake Support DM",
  subtitle: "from \"MetaMask Support\"",
  icon: "\uD83D\uDCAC",
  difficulty: 2,
  category: "phishing",
  deliveryChannel: "dm",
  npcAvatar: "\uD83E\uDD8A",
  npcName: "MetaMask Support",
  isBoss: false,

  nodes: [
    {
      id: "intro",
      messages: [
        { id: "m1", sender: "system", text: "New DM received" },
        { id: "m2", sender: "npc", text: "Hi! We detected unauthorized access on your wallet.", delay: 500 },
        { id: "m3", sender: "npc", text: "Verify your identity immediately to secure funds." },
      ],
      choices: [
        { id: "share-seed", text: "Share seed phrase", emoji: "\uD83D\uDD11", outcome: "rekt", damageAmount: 5000 },
        { id: "inspect", text: "Inspect their profile", emoji: "\uD83D\uDD0D", outcome: "continue", nextNodeId: "inspect-result", revealText: "Account created 2 days ago" },
        { id: "block", text: "Block & report", emoji: "\uD83D\uDEAB", outcome: "survived" },
        { id: "ask-hint", text: "Ask Sensei", emoji: "\uD83E\uDDE0", outcome: "hint", revealText: "Real support never DMs first." },
      ],
    },
    {
      id: "inspect-result",
      messages: [
        { id: "m4", sender: "system", text: "Profile inspected..." },
        { id: "m5", sender: "npc", text: "Please hurry! Your funds are at risk." },
      ],
      choices: [
        { id: "share-seed-2", text: "Fine, share seed phrase", emoji: "\uD83D\uDD11", outcome: "rekt" },
        { id: "block-2", text: "Definitely a scam — block", emoji: "\uD83D\uDEAB", outcome: "survived" },
      ],
    },
  ],

  passiveClues: ["URL misspelling", "urgent language"],
  activeInvestigations: [
    { type: "verify-identity", result: "Account created 2 days ago, 0 verified badges", cost: 0 },
    { type: "ask-sensei", result: "Official MetaMask never DMs users", cost: 1 },
  ],

  education: {
    attackName: "Fake Support DM",
    difficulty: "\u2605\u2605\u2606\u2606\u2606",
    category: "phishing",
    howItWorked: [
      { step: 1, text: "Scammer created a fake support account" },
      { step: 2, text: "Manufactured urgency with a fake threat" },
      { step: 3, text: "Asked for seed phrase to steal wallet" },
    ],
    redFlags: ["Unsolicited DM", "Urgency tactics", "Asking for seed phrase"],
    irlProtection: ["Never share seed phrase", "Verify through official sites"],
  },

  rektConsequences: {
    moneyLost: 5000,
    moneyLostType: "fixed",
    hpLost: 20,
    streakBroken: true,
  },
  survivedRewards: {
    xp: 150,
    securityTokens: 2,
    coins: 500,
    statBoosts: [{ stat: "detection", amount: 5 }],
  },

  communityRektRate: 42,
};

// ── Setup ───────────────────────────────────────────────────────────────────────

beforeEach(() => {
  useScenarioStore.getState().resetScenario();
  usePlayerStore.getState().resetAll();
  usePortfolioStore.getState().resetPortfolio();
  registerScenario(FAKE_SUPPORT_SCENARIO);
});

// ── Tests ───────────────────────────────────────────────────────────────────────

describe("scenarioStore — dialogue state machine", () => {
  it("loads a scenario from registry and sets initial state", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");

    const state = useScenarioStore.getState();
    expect(state.activeScenario).not.toBeNull();
    expect(state.activeScenario!.id).toBe("test-fake-support");
    expect(state.currentNodeId).toBe("intro");
    expect(state.visibleMessages).toHaveLength(0);
    expect(state.outcome).toBeNull();
    expect(state.senseiUsesLeft).toBe(2);
  });

  it("starts scenario and reveals first node messages", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");
    useScenarioStore.getState().startScenario();

    const state = useScenarioStore.getState();
    // All 3 intro messages visible
    expect(state.visibleMessages).toHaveLength(3);
    expect(state.visibleMessages[0].text).toBe("New DM received");
    expect(state.visibleMessages[2].text).toContain("Verify your identity");
    expect(state.choicesVisible).toBe(true);
    expect(state.isTyping).toBe(false);
  });

  it("reveals messages one at a time via revealNextMessage", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");

    // Don't call startScenario — use revealNextMessage for progressive reveal
    const store = useScenarioStore.getState();
    expect(store.visibleMessages).toHaveLength(0);
    expect(store.choicesVisible).toBe(false);

    // Reveal message 1
    useScenarioStore.getState().revealNextMessage();
    expect(useScenarioStore.getState().visibleMessages).toHaveLength(1);
    expect(useScenarioStore.getState().isTyping).toBe(true);
    expect(useScenarioStore.getState().choicesVisible).toBe(false);

    // Reveal message 2
    useScenarioStore.getState().revealNextMessage();
    expect(useScenarioStore.getState().visibleMessages).toHaveLength(2);
    expect(useScenarioStore.getState().isTyping).toBe(true);

    // Reveal message 3 (last) — choices should appear
    useScenarioStore.getState().revealNextMessage();
    expect(useScenarioStore.getState().visibleMessages).toHaveLength(3);
    expect(useScenarioStore.getState().isTyping).toBe(false);
    expect(useScenarioStore.getState().choicesVisible).toBe(true);

    // Extra call is a no-op
    useScenarioStore.getState().revealNextMessage();
    expect(useScenarioStore.getState().visibleMessages).toHaveLength(3);
  });

  it("selectChoice 'rekt' sets outcome and outcomeDetails", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");
    useScenarioStore.getState().startScenario();

    // Player picks the rekt choice
    useScenarioStore.getState().selectChoice("share-seed");

    const state = useScenarioStore.getState();
    expect(state.outcome).toBe("rekt");
    expect(state.choicesVisible).toBe(false);
    expect(state.outcomeDetails).not.toBeNull();
    expect(state.outcomeDetails!.choiceThatCausedIt).toBe("share-seed");
    expect(state.outcomeDetails!.amountLost).toBe(5000);
    expect(state.outcomeDetails!.attackType).toBe("Fake Support DM");

    // Player message was added
    const lastPlayerMsg = state.visibleMessages.find(
      (m) => m.sender === "player",
    );
    expect(lastPlayerMsg).toBeDefined();
    expect(lastPlayerMsg!.text).toContain("Share seed phrase");

    // Choice was tracked
    expect(state.choicesMade).toContain("share-seed");
  });

  it("selectChoice 'continue' advances to next node", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");
    useScenarioStore.getState().startScenario();

    // Player inspects profile → continue to inspect-result node
    useScenarioStore.getState().selectChoice("inspect");

    const state = useScenarioStore.getState();
    expect(state.currentNodeId).toBe("inspect-result");
    // 3 intro + 1 player + 2 inspect-result messages
    expect(state.visibleMessages).toHaveLength(6);
    expect(state.choicesVisible).toBe(true);
    expect(state.outcome).toBeNull();

    // Now pick rekt from second node
    useScenarioStore.getState().selectChoice("share-seed-2");
    const final = useScenarioStore.getState();
    expect(final.outcome).toBe("rekt");
    expect(final.choicesMade).toEqual(["inspect", "share-seed-2"]);
  });

  it("selectChoice 'survived' sets survived outcome", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");
    useScenarioStore.getState().startScenario();

    useScenarioStore.getState().selectChoice("block");

    const state = useScenarioStore.getState();
    expect(state.outcome).toBe("survived");
    expect(state.outcomeDetails!.choiceThatCausedIt).toBe("block");
    expect(state.outcomeDetails!.attackType).toBe("Fake Support DM");
  });

  it("selectChoice 'hint' shows sensei hint and decrements uses", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");
    useScenarioStore.getState().startScenario();

    expect(useScenarioStore.getState().senseiUsesLeft).toBe(2);

    useScenarioStore.getState().selectChoice("ask-hint");

    const state = useScenarioStore.getState();
    expect(state.senseiUsesLeft).toBe(1);

    // Hint message was added with sensei text
    const hintMsg = state.visibleMessages.find(
      (m) => m.senderName === "Sensei",
    );
    expect(hintMsg).toBeDefined();
    expect(hintMsg!.text).toContain("Real support never DMs first.");

    // Outcome NOT set — still in scenario
    expect(state.outcome).toBeNull();
  });

  it("hint is blocked when senseiUsesLeft reaches 0", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");
    useScenarioStore.getState().startScenario();

    // Use both hints
    useScenarioStore.getState().selectChoice("ask-hint");
    useScenarioStore.getState().selectChoice("ask-hint");
    expect(useScenarioStore.getState().senseiUsesLeft).toBe(0);

    const msgCountBefore = useScenarioStore.getState().visibleMessages.length;

    // Third attempt is a no-op
    useScenarioStore.getState().selectChoice("ask-hint");
    expect(useScenarioStore.getState().senseiUsesLeft).toBe(0);
    expect(useScenarioStore.getState().visibleMessages).toHaveLength(msgCountBefore);
  });

  it("processRekt applies consequences to player and portfolio stores", () => {
    // Set up player and portfolio
    usePlayerStore.getState().selectClass("ape");
    usePortfolioStore.getState().initializePortfolio("ape");

    const hpBefore = usePlayerStore.getState().stats.hp;
    const valueBefore = usePortfolioStore.getState().totalValue;

    // Load, start, and get rekt
    useScenarioStore.getState().loadScenario("test-fake-support");
    useScenarioStore.getState().startScenario();
    useScenarioStore.getState().selectChoice("share-seed");

    // Process consequences
    useScenarioStore.getState().processRekt();

    const player = usePlayerStore.getState();
    const portfolio = usePortfolioStore.getState();

    // HP reduced by 20
    expect(player.stats.hp).toBe(hpBefore - 20);
    // Portfolio drained by $5000
    expect(portfolio.totalValue).toBeLessThan(valueBefore);
    expect(portfolio.totalLost).toBeGreaterThan(0);
    // Streak broken
    expect(player.streak).toBe(0);
    // Rekt recorded
    expect(player.rektCount).toBe(1);
    // Scenario completed
    expect(player.completedScenarios).toContain("test-fake-support");
    // Loss transaction added
    const lossTx = portfolio.transactions.find(
      (tx) => tx.type === "rekt-loss",
    );
    expect(lossTx).toBeDefined();
    expect(lossTx!.linkedScenarioId).toBe("test-fake-support");
  });

  it("processSurvived applies rewards to player and portfolio stores", () => {
    usePlayerStore.getState().selectClass("analyst");
    usePortfolioStore.getState().initializePortfolio("analyst");

    const xpBefore = usePlayerStore.getState().xp;
    const coinsBefore = usePlayerStore.getState().coins;
    const detectionBefore = usePlayerStore.getState().stats.detection;

    // Load, start, survive
    useScenarioStore.getState().loadScenario("test-fake-support");
    useScenarioStore.getState().startScenario();
    useScenarioStore.getState().selectChoice("block");
    useScenarioStore.getState().processSurvived();

    const player = usePlayerStore.getState();
    const portfolio = usePortfolioStore.getState();

    // XP +150
    expect(player.xp).toBe(xpBefore + 150);
    // Security tokens +2
    expect(player.securityTokens).toBe(2);
    // Coins +500
    expect(player.coins).toBe(coinsBefore + 500);
    // Detection +5 stat boost
    expect(player.stats.detection).toBe(detectionBefore + 5);
    // Survived recorded
    expect(player.survived).toBe(1);
    expect(player.completedScenarios).toContain("test-fake-support");
    // Reward transaction added
    const rewardTx = portfolio.transactions.find(
      (tx) => tx.linkedScenarioId === "test-fake-support",
    );
    expect(rewardTx).toBeDefined();
  });

  it("performInvestigation reveals clue and tracks discovery", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");
    useScenarioStore.getState().startScenario();

    // Free investigation (cost: 0)
    useScenarioStore.getState().performInvestigation("verify-identity");

    const state = useScenarioStore.getState();
    expect(state.cluesDiscovered).toContain(
      "Account created 2 days ago, 0 verified badges",
    );

    // Investigation result shown as message
    const resultMsg = state.visibleMessages.find(
      (m) => m.id === "investigate-verify-identity",
    );
    expect(resultMsg).toBeDefined();

    // Duplicate investigation is a no-op
    const msgCount = state.visibleMessages.length;
    useScenarioStore.getState().performInvestigation("verify-identity");
    expect(useScenarioStore.getState().visibleMessages).toHaveLength(msgCount);
  });

  it("getEducation returns education content", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");

    const edu = useScenarioStore.getState().getEducation();
    expect(edu).not.toBeNull();
    expect(edu!.attackName).toBe("Fake Support DM");
    expect(edu!.category).toBe("phishing");
    expect(edu!.redFlags).toHaveLength(3);
    expect(edu!.irlProtection).toHaveLength(2);
  });

  it("resetScenario clears all runtime state", () => {
    useScenarioStore.getState().loadScenario("test-fake-support");
    useScenarioStore.getState().startScenario();
    useScenarioStore.getState().selectChoice("share-seed");

    // Verify state is populated
    expect(useScenarioStore.getState().outcome).toBe("rekt");

    useScenarioStore.getState().resetScenario();

    const state = useScenarioStore.getState();
    expect(state.activeScenario).toBeNull();
    expect(state.currentNodeId).toBe("");
    expect(state.visibleMessages).toHaveLength(0);
    expect(state.outcome).toBeNull();
    expect(state.choicesMade).toHaveLength(0);
    expect(state.senseiUsesLeft).toBe(2);
  });

  it("loading nonexistent scenario is a no-op", () => {
    useScenarioStore.getState().loadScenario("does-not-exist");

    const state = useScenarioStore.getState();
    expect(state.activeScenario).toBeNull();
  });
});
