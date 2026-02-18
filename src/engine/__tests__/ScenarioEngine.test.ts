/**
 * ScenarioEngine unit tests
 * Run: npx jest src/engine/__tests__/ScenarioEngine.test.ts
 */

jest.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import type { ScenarioDefinition } from "../../store/scenarioStore";
import { ScenarioEngine } from "../ScenarioEngine";
import { validateScenario } from "../../data/scenarios/schema";

// ── Test fixture ────────────────────────────────────────────────────────────────

const MOCK_SCENARIO: ScenarioDefinition = {
  id: "ch1-fake-support-dm",
  chapter: 1,
  scenarioIndex: 0,
  title: "Fake Support DM",
  subtitle: "Someone claiming to be support just messaged you...",
  icon: "💬",
  difficulty: 1,
  category: "phishing",
  deliveryChannel: "dm",
  npcAvatar: "🤵",
  npcName: "MetaMask Support",
  isBoss: false,

  nodes: [
    {
      id: "start",
      messages: [
        {
          id: "msg-1",
          sender: "npc",
          senderName: "MetaMask Support",
          text: "Hi! We noticed unusual activity on your wallet.",
        },
      ],
      choices: [
        {
          id: "share-seed",
          text: "Share my seed phrase",
          emoji: "🔑",
          outcome: "rekt",
          damageAmount: 5000,
        },
        {
          id: "ignore",
          text: "Ignore and block",
          emoji: "🚫",
          outcome: "survived",
        },
        {
          id: "investigate",
          text: "Check if this is real",
          emoji: "🔍",
          outcome: "clue",
          revealText: "Real MetaMask support never DMs first!",
        },
      ],
    },
  ],

  passiveClues: [
    "The username has an extra underscore",
    "No verification badge",
  ],

  activeInvestigations: [
    {
      type: "verify-identity",
      result: "This account was created 2 days ago.",
      cost: 0,
    },
  ],

  education: {
    attackName: "Fake Support DM",
    difficulty: "Easy",
    category: "phishing",
    howItWorked: [
      { step: 1, text: "Scammer impersonated support staff" },
      { step: 2, text: "Asked for your seed phrase" },
    ],
    redFlags: [
      "Support never DMs first",
      "Asking for seed phrase",
    ],
    irlProtection: [
      "Never share your seed phrase",
      "Verify through official channels",
    ],
  },

  rektConsequences: {
    moneyLost: 50,
    moneyLostType: "percentage",
    hpLost: 20,
    streakBroken: true,
  },

  survivedRewards: {
    xp: 100,
    securityTokens: 2,
    coins: 50,
    statBoosts: [
      { stat: "detection", amount: 2 },
      { stat: "security", amount: 1 },
    ],
  },

  communityRektRate: 0.45,
};

// ── Schema validation tests ─────────────────────────────────────────────────────

describe("validateScenario", () => {
  it("accepts a valid scenario", () => {
    const result = validateScenario(MOCK_SCENARIO);
    expect(result.valid).toBe(true);
  });

  it("rejects null/undefined", () => {
    expect(validateScenario(null).valid).toBe(false);
    expect(validateScenario(undefined).valid).toBe(false);
  });

  it("reports missing required fields", () => {
    const result = validateScenario({ id: "test" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid category", () => {
    const bad = { ...MOCK_SCENARIO, category: "not-real" };
    const result = validateScenario(bad);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid difficulty", () => {
    const bad = { ...MOCK_SCENARIO, difficulty: 10 };
    const result = validateScenario(bad);
    expect(result.valid).toBe(false);
  });

  it("rejects empty nodes array", () => {
    const bad = { ...MOCK_SCENARIO, nodes: [] };
    const result = validateScenario(bad);
    expect(result.valid).toBe(false);
  });
});

// ── Engine tests ────────────────────────────────────────────────────────────────

describe("ScenarioEngine", () => {
  describe("getScenariosForChapter", () => {
    it("returns 5 scenario IDs for chapter 1", () => {
      const ids = ScenarioEngine.getScenariosForChapter(1);
      expect(ids).toHaveLength(5);
      expect(ids[0]).toBe("ch1-fake-support-dm");
    });

    it("returns 5 scenario IDs for chapter 5", () => {
      const ids = ScenarioEngine.getScenariosForChapter(5);
      expect(ids).toHaveLength(5);
      expect(ids[4]).toBe("ch5-inside-job");
    });

    it("returns empty array for invalid chapter", () => {
      expect(ScenarioEngine.getScenariosForChapter(99)).toEqual([]);
    });
  });

  describe("pickRandomScam", () => {
    it("picks from available scenarios", () => {
      const pick = ScenarioEngine.pickRandomScam(1, []);
      expect(pick).toBeTruthy();
      expect(ScenarioEngine.getScenariosForChapter(1)).toContain(pick);
    });

    it("excludes completed scenarios", () => {
      const completed = [
        "ch1-fake-support-dm",
        "ch1-seed-phrase-request",
        "ch1-fake-airdrop",
        "ch1-phishing-email",
      ];
      // Only ch1-seed-phrase-trap remains
      const pick = ScenarioEngine.pickRandomScam(1, completed);
      expect(pick).toBe("ch1-seed-phrase-trap");
    });

    it("returns null when all completed", () => {
      const all = ScenarioEngine.getScenariosForChapter(1);
      expect(ScenarioEngine.pickRandomScam(1, all)).toBeNull();
    });
  });

  describe("generateScamNotification", () => {
    it("returns correctly shaped notification", () => {
      const notif = ScenarioEngine.generateScamNotification(MOCK_SCENARIO);
      expect(notif.title).toContain("MetaMask Support");
      expect(notif.isSuspicious).toBe(true);
      expect(notif.linkedScenarioId).toBe("ch1-fake-support-dm");
    });
  });

  describe("generateScamActivity", () => {
    it("returns a transaction object", () => {
      const tx = ScenarioEngine.generateScamActivity(MOCK_SCENARIO);
      expect(tx.type).toBe("airdrop");
      expect(tx.isSuspicious).toBe(true);
      expect(tx.linkedScenarioId).toBe("ch1-fake-support-dm");
      expect(tx.id).toContain("scam-tx-ch1-fake-support-dm");
    });
  });

  describe("checkGearEffects", () => {
    it("bookmark-bar auto-detects phishing", () => {
      const result = ScenarioEngine.checkGearEffects(MOCK_SCENARIO, [
        "bookmark-bar",
      ]);
      expect(result.autoDetected).toBe(true);
      expect(result.hintsRevealed.length).toBeGreaterThan(0);
    });

    it("paper-wallet does not detect phishing", () => {
      const result = ScenarioEngine.checkGearEffects(MOCK_SCENARIO, [
        "paper-wallet",
      ]);
      expect(result.autoDetected).toBe(false);
    });

    it("cold-storage provides 50% damage reduction", () => {
      const result = ScenarioEngine.checkGearEffects(MOCK_SCENARIO, [
        "cold-storage",
      ]);
      expect(result.damageReduced).toBe(50);
    });

    it("caps damage reduction at 75%", () => {
      const result = ScenarioEngine.checkGearEffects(MOCK_SCENARIO, [
        "cold-storage",     // 50%
        "burner-wallet",    // 40%
        "hardware-wallet",  // 25%
      ]);
      expect(result.damageReduced).toBe(75);
    });

    it("returns zero for unknown gear", () => {
      const result = ScenarioEngine.checkGearEffects(MOCK_SCENARIO, [
        "unknown-gear-id",
      ]);
      expect(result.autoDetected).toBe(false);
      expect(result.damageReduced).toBe(0);
    });
  });

  describe("checkClassEffects", () => {
    it("ape is weak against rug-pull", () => {
      const rugPull = { ...MOCK_SCENARIO, category: "rug-pull" as const };
      const result = ScenarioEngine.checkClassEffects(rugPull, "ape");
      expect(result.isWeakAgainst).toBe(true);
      expect(result.abilityApplicable).toBe(true);
      expect(result.bonusClues.length).toBeGreaterThan(0);
    });

    it("analyst has no weakness to phishing", () => {
      const result = ScenarioEngine.checkClassEffects(MOCK_SCENARIO, "analyst");
      expect(result.isWeakAgainst).toBe(false);
      expect(result.abilityApplicable).toBe(true); // analyst is good at everything
    });

    it("shadow is weak against social-engineering", () => {
      const social = { ...MOCK_SCENARIO, category: "social-engineering" as const };
      const result = ScenarioEngine.checkClassEffects(social, "shadow");
      expect(result.isWeakAgainst).toBe(true);
    });

    it("handles unknown class gracefully", () => {
      const result = ScenarioEngine.checkClassEffects(MOCK_SCENARIO, "unknown");
      expect(result.isWeakAgainst).toBe(false);
      expect(result.abilityApplicable).toBe(false);
    });
  });

  describe("calculateRektDamage", () => {
    it("calculates percentage-based money loss", () => {
      const result = ScenarioEngine.calculateRektDamage(
        MOCK_SCENARIO,  // 50% moneyLost, percentage type
        10000,           // portfolio
        [],              // no gear
        "analyst",       // no weakness to phishing
      );
      expect(result.moneyLost).toBe(5000);
      expect(result.hpLost).toBe(20);
    });

    it("applies gear damage reduction", () => {
      const result = ScenarioEngine.calculateRektDamage(
        MOCK_SCENARIO,
        10000,
        ["cold-storage"], // 50% reduction
        "analyst",
      );
      expect(result.moneyLost).toBe(2500);
      expect(result.hpLost).toBe(10);
    });

    it("amplifies damage for weak class", () => {
      // Ape is weak against rug-pull
      const rugPull: ScenarioDefinition = {
        ...MOCK_SCENARIO,
        category: "rug-pull",
        rektConsequences: {
          moneyLost: 1000,
          moneyLostType: "fixed",
          hpLost: 20,
          streakBroken: true,
        },
      };
      const result = ScenarioEngine.calculateRektDamage(
        rugPull,
        50000,
        [],
        "ape",
      );
      expect(result.moneyLost).toBe(1250);  // 1000 * 1.25
      expect(result.hpLost).toBe(25);       // 20 * 1.25
    });

    it("caps money loss at portfolio value", () => {
      const bigLoss: ScenarioDefinition = {
        ...MOCK_SCENARIO,
        rektConsequences: {
          moneyLost: 100,
          moneyLostType: "percentage",
          hpLost: 20,
          streakBroken: true,
        },
      };
      const result = ScenarioEngine.calculateRektDamage(
        bigLoss,
        1000,
        [],
        "analyst",
      );
      expect(result.moneyLost).toBe(1000);
    });
  });

  describe("calculateSurvivedRewards", () => {
    it("returns base rewards with no streak", () => {
      const result = ScenarioEngine.calculateSurvivedRewards(
        MOCK_SCENARIO,
        1,  // level 1
        0,  // no streak
      );
      expect(result.xp).toBe(100);
      expect(result.coins).toBe(50);
      expect(result.securityTokens).toBe(2); // flat, no scaling
      expect(result.statBoosts).toHaveLength(2);
    });

    it("applies streak multiplier", () => {
      // streak 10 → multiplier = 1 + 10 * 0.05 = 1.5
      const result = ScenarioEngine.calculateSurvivedRewards(
        MOCK_SCENARIO,
        1,
        10,
      );
      expect(result.xp).toBe(150);
      expect(result.coins).toBe(75);
    });

    it("caps streak multiplier at 2x", () => {
      // streak 100 → 1 + 100*0.05 = 6, but capped at 2
      const result = ScenarioEngine.calculateSurvivedRewards(
        MOCK_SCENARIO,
        1,
        100,
      );
      expect(result.xp).toBe(200);
      expect(result.coins).toBe(100);
    });

    it("applies level scaling", () => {
      // level 11 → levelMultiplier = 1 + 10*0.02 = 1.2
      const result = ScenarioEngine.calculateSurvivedRewards(
        MOCK_SCENARIO,
        11,
        0,
      );
      expect(result.xp).toBe(120);
      expect(result.coins).toBe(60);
    });

    it("combines streak and level multipliers", () => {
      // streak 10 → 1.5, level 11 → 1.2, combined = 1.8
      const result = ScenarioEngine.calculateSurvivedRewards(
        MOCK_SCENARIO,
        11,
        10,
      );
      expect(result.xp).toBe(180);    // 100 * 1.8
      expect(result.coins).toBe(90);   // 50 * 1.8
    });
  });

  describe("loadScenario", () => {
    it("rejects unknown scenario ID", async () => {
      await expect(
        ScenarioEngine.loadScenario("nonexistent"),
      ).rejects.toThrow("Unknown scenario ID");
    });
  });
});
