/**
 * GearEngine + ClassAbilityEngine unit tests
 * Run: npx jest src/engine/__tests__/GearAndAbilities.test.ts
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
import { GEAR_ITEMS } from "../../data/gear";
import { GearEngine } from "../GearEngine";
import { ClassAbilityEngine } from "../ClassAbilityEngine";

// ── Test fixture ─────────────────────────────────────────────────────────────────

const MOCK_SCENARIO: ScenarioDefinition = {
  id: "ch1-fake-support-dm",
  chapter: 1,
  scenarioIndex: 0,
  title: "Fake Support DM",
  subtitle: "Someone claiming to be support just messaged you...",
  icon: "\uD83D\uDCAC",
  difficulty: 1,
  category: "phishing",
  deliveryChannel: "dm",
  npcAvatar: "\uD83E\uDD35",
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
        { id: "share-seed", text: "Share seed phrase", emoji: "\uD83D\uDD11", outcome: "rekt" },
        { id: "ignore", text: "Ignore", emoji: "\uD83D\uDEAB", outcome: "survived" },
      ],
    },
  ],
  passiveClues: ["Username has an extra underscore"],
  activeInvestigations: [
    { type: "verify-identity", result: "This account was created 2 days ago.", cost: 0 },
    { type: "check-contract", result: "No contract interaction detected.", cost: 0 },
  ],
  education: {
    attackName: "Fake Support DM",
    difficulty: "Easy",
    category: "phishing",
    howItWorked: [{ step: 1, text: "Scammer impersonated support" }],
    redFlags: ["Support never DMs first"],
    irlProtection: ["Never share your seed phrase"],
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
    statBoosts: [{ stat: "detection", amount: 2 }],
  },
  communityRektRate: 0.45,
};

// ── Gear data tests ─────────────────────────────────────────────────────────────

describe("gear.ts", () => {
  it("defines 9 gear items", () => {
    expect(GEAR_ITEMS).toHaveLength(9);
  });

  it("all items have required fields", () => {
    for (const gear of GEAR_ITEMS) {
      expect(gear.id).toBeTruthy();
      expect(gear.name).toBeTruthy();
      expect(gear.emoji).toBeTruthy();
      expect(gear.slot).toBeTruthy();
      expect(gear.description).toBeTruthy();
      expect(gear.gameEffect).toBeTruthy();
      expect(gear.realWorldEquivalent).toBeTruthy();
      expect(gear.unlockCondition).toBeTruthy();
      expect(gear.effects).toBeTruthy();
    }
  });

  it("paper-wallet is default unlock", () => {
    const pw = GEAR_ITEMS.find((g) => g.id === "paper-wallet")!;
    expect(pw.unlockCondition.type).toBe("default");
  });

  it("has correct slots", () => {
    const wallets = GEAR_ITEMS.filter((g) => g.slot === "wallet");
    const utilities = GEAR_ITEMS.filter((g) => g.slot === "utility");
    expect(wallets.length).toBe(3); // paper, hardware, cold-storage
    expect(utilities.length).toBe(3); // bookmark-bar, revoke-tool, burner-wallet
  });
});

// ── GearEngine tests ────────────────────────────────────────────────────────────

describe("GearEngine", () => {
  describe("getAllGear", () => {
    it("returns all 9 items", () => {
      expect(GearEngine.getAllGear()).toHaveLength(9);
    });
  });

  describe("canUnlock", () => {
    it("paper-wallet is always unlockable", () => {
      const result = GearEngine.canUnlock("paper-wallet", 1, 0, [], []);
      expect(result.canUnlock).toBe(true);
    });

    it("hardware-wallet requires level 10", () => {
      expect(GearEngine.canUnlock("hardware-wallet", 9, 0, [], []).canUnlock).toBe(false);
      expect(GearEngine.canUnlock("hardware-wallet", 10, 0, [], []).canUnlock).toBe(true);
    });

    it("2fa-shield requires 30 security tokens", () => {
      expect(GearEngine.canUnlock("2fa-shield", 1, 29, [], []).canUnlock).toBe(false);
      expect(GearEngine.canUnlock("2fa-shield", 1, 30, [], []).canUnlock).toBe(true);
    });

    it("burner-wallet requires chapter 3 completion", () => {
      expect(GearEngine.canUnlock("burner-wallet", 1, 0, [1, 2], []).canUnlock).toBe(false);
      expect(GearEngine.canUnlock("burner-wallet", 1, 0, [1, 2, 3], []).canUnlock).toBe(true);
    });

    it("returns reason when cannot unlock", () => {
      const result = GearEngine.canUnlock("hardware-wallet", 5, 0, [], []);
      expect(result.canUnlock).toBe(false);
      expect(result.reason).toContain("level 10");
    });

    it("returns false for unknown gear", () => {
      const result = GearEngine.canUnlock("nonexistent", 99, 999, [1, 2, 3, 4, 5], []);
      expect(result.canUnlock).toBe(false);
    });
  });

  describe("calculateCombinedEffects", () => {
    it("hardware-wallet + bookmark-bar + 2fa-shield combined", () => {
      const result = GearEngine.calculateCombinedEffects([
        "hardware-wallet",
        "bookmark-bar",
        "2fa-shield",
      ]);

      // Damage: 15 + 0 + 10 = 25%
      expect(result.totalDamageReduction).toBe(25);

      // Auto-detect: 0 + 0.3 + 0.5 = 0.8
      expect(result.totalAutoDetectChance).toBeCloseTo(0.8, 1);

      // Blocked types: smart-contract, phishing, social-engineering
      expect(result.blockedScamTypes).toContain("smart-contract");
      expect(result.blockedScamTypes).toContain("phishing");
      expect(result.blockedScamTypes).toContain("social-engineering");
    });

    it("caps damage reduction at 75%", () => {
      const result = GearEngine.calculateCombinedEffects([
        "cold-storage",    // 25%
        "burner-wallet",   // 40%
        "hardware-wallet", // 15%
        "revoke-tool",     // 15%
      ]);
      expect(result.totalDamageReduction).toBe(75);
    });

    it("caps auto-detect chance at 0.95", () => {
      const result = GearEngine.calculateCombinedEffects([
        "bookmark-bar",    // 0.3
        "2fa-shield",      // 0.5
        "burner-wallet",   // 0.4
      ]);
      expect(result.totalAutoDetectChance).toBe(0.95);
    });

    it("returns empty effects for no gear", () => {
      const result = GearEngine.calculateCombinedEffects([]);
      expect(result.totalDamageReduction).toBe(0);
      expect(result.totalAutoDetectChance).toBe(0);
      expect(result.allBonusClueTypes).toHaveLength(0);
      expect(result.blockedScamTypes).toHaveLength(0);
      expect(result.portfolioProtection).toBe(0);
    });

    it("contract-reader provides bonus clue types", () => {
      const result = GearEngine.calculateCombinedEffects(["contract-reader"]);
      expect(result.allBonusClueTypes).toContain("check-contract");
      expect(result.allBonusClueTypes).toContain("hidden-function");
    });

    it("cold-storage provides portfolio protection", () => {
      const result = GearEngine.calculateCombinedEffects(["cold-storage"]);
      expect(result.portfolioProtection).toBe(50);
    });
  });

  describe("rollAutoDetect", () => {
    it("bookmark-bar can detect phishing", () => {
      let detected = false;
      for (let i = 0; i < 50; i++) {
        const result = GearEngine.rollAutoDetect(["bookmark-bar"], "phishing");
        if (result.detected) {
          detected = true;
          expect(result.gearThatDetected).toBe("bookmark-bar");
          expect(result.message).toContain("Bookmark Bar");
          break;
        }
      }
      expect(detected).toBe(true);
    });

    it("returns false when no gear matches", () => {
      const result = GearEngine.rollAutoDetect(["paper-wallet"], "phishing");
      expect(result.detected).toBe(false);
    });

    it("2fa-shield can detect social-engineering", () => {
      let detected = false;
      for (let i = 0; i < 50; i++) {
        const result = GearEngine.rollAutoDetect(["2fa-shield"], "social-engineering");
        if (result.detected) {
          detected = true;
          expect(result.gearThatDetected).toBe("2fa-shield");
          break;
        }
      }
      expect(detected).toBe(true);
    });
  });

  describe("getGearClues", () => {
    it("contract-reader reveals check-contract clues", () => {
      const clues = GearEngine.getGearClues(["contract-reader"], MOCK_SCENARIO);
      expect(clues.length).toBeGreaterThan(0);
      expect(clues.some((c) => c.includes("No contract interaction"))).toBe(true);
    });

    it("bookmark-bar flags phishing scenario", () => {
      const clues = GearEngine.getGearClues(["bookmark-bar"], MOCK_SCENARIO);
      expect(clues.length).toBeGreaterThan(0);
      expect(clues.some((c) => c.includes("phishing"))).toBe(true);
    });

    it("returns empty for gear with no relevant clues", () => {
      const clues = GearEngine.getGearClues(["revoke-tool"], MOCK_SCENARIO);
      expect(clues).toHaveLength(0);
    });
  });

  describe("mitigateDamage", () => {
    it("no gear = full damage", () => {
      const result = GearEngine.mitigateDamage(1000, [], 50000);
      expect(result.finalDamage).toBe(1000);
      expect(result.amountProtected).toBe(0);
    });

    it("paper-wallet reduces damage by 5%", () => {
      const result = GearEngine.mitigateDamage(1000, ["paper-wallet"], 50000);
      expect(result.finalDamage).toBe(950);
    });

    it("cold-storage protects 50% of portfolio", () => {
      // 1000 base, 25% reduction → 750, but 50% of 50000=25000 protected
      // 750 < 25000 unprotected, so finalDamage = 750
      const result = GearEngine.mitigateDamage(1000, ["cold-storage"], 50000);
      expect(result.amountProtected).toBe(25000);
      expect(result.finalDamage).toBe(750); // 1000 * 0.75
    });

    it("portfolio protection caps damage to unprotected portion", () => {
      // Huge damage: 40000 base, cold-storage 25% reduction → 30000
      // But only 25000 is vulnerable (50% of 50000 protected)
      const result = GearEngine.mitigateDamage(40000, ["cold-storage"], 50000);
      expect(result.finalDamage).toBe(25000);
      expect(result.amountProtected).toBe(25000);
    });

    it("stacked gear reduces damage", () => {
      // hardware(15%) + paper(5%) = 20%
      const result = GearEngine.mitigateDamage(
        1000,
        ["hardware-wallet", "paper-wallet"],
        50000,
      );
      expect(result.finalDamage).toBe(800);
      expect(result.gearUsed).toContain("hardware-wallet");
      expect(result.gearUsed).toContain("paper-wallet");
    });
  });
});

// ── ClassAbilityEngine tests ────────────────────────────────────────────────────

describe("ClassAbilityEngine", () => {
  describe("checkAbility", () => {
    it("Ape Diamond Hands triggers on rug-pull with uses remaining", () => {
      const result = ClassAbilityEngine.checkAbility(
        "ape",
        "rug-pull",
        1,
        MOCK_SCENARIO,
      );
      expect(result.abilityTriggered).toBe(true);
      expect(result.abilityName).toBe("Diamond Hands");
      expect(result.preventsRekt).toBe(true);
      expect(result.autoSurvives).toBe(true);
    });

    it("Ape Diamond Hands does NOT trigger on non-rug-pull", () => {
      const result = ClassAbilityEngine.checkAbility(
        "ape",
        "phishing",
        1,
        MOCK_SCENARIO,
      );
      expect(result.abilityTriggered).toBe(false);
    });

    it("Ape Diamond Hands does NOT trigger with no uses left", () => {
      const result = ClassAbilityEngine.checkAbility(
        "ape",
        "rug-pull",
        0,
        MOCK_SCENARIO,
      );
      expect(result.abilityTriggered).toBe(false);
    });

    it("Analyst Deep Dive triggers with uses remaining", () => {
      const result = ClassAbilityEngine.checkAbility(
        "analyst",
        "phishing",
        2,
        MOCK_SCENARIO,
      );
      expect(result.abilityTriggered).toBe(true);
      expect(result.abilityName).toBe("Deep Dive");
      expect(result.revealsClue).toBe(true);
    });

    it("Analyst Deep Dive does NOT trigger with no uses", () => {
      const result = ClassAbilityEngine.checkAbility(
        "analyst",
        "phishing",
        0,
        MOCK_SCENARIO,
      );
      expect(result.abilityTriggered).toBe(false);
    });

    it("Shadow Incognito can trigger on social-engineering", () => {
      let triggered = false;
      for (let i = 0; i < 50; i++) {
        const result = ClassAbilityEngine.checkAbility(
          "shadow",
          "social-engineering",
          1,
          MOCK_SCENARIO,
        );
        if (result.abilityTriggered) {
          triggered = true;
          expect(result.abilityName).toBe("Incognito");
          expect(result.autoSurvives).toBe(true);
          break;
        }
      }
      expect(triggered).toBe(true);
    });

    it("Shadow Incognito does NOT trigger on non-social scam", () => {
      const result = ClassAbilityEngine.checkAbility(
        "shadow",
        "phishing",
        1,
        MOCK_SCENARIO,
      );
      expect(result.abilityTriggered).toBe(false);
    });

    it("Degen Gut Feeling can trigger on any scam", () => {
      let triggered = false;
      for (let i = 0; i < 50; i++) {
        const result = ClassAbilityEngine.checkAbility(
          "degen",
          "honeypot",
          1,
          MOCK_SCENARIO,
        );
        if (result.abilityTriggered) {
          triggered = true;
          expect(result.abilityName).toBe("Gut Feeling");
          expect(result.revealsClue).toBe(true);
          break;
        }
      }
      expect(triggered).toBe(true);
    });

    it("unknown class never triggers", () => {
      const result = ClassAbilityEngine.checkAbility(
        "unknown",
        "phishing",
        5,
        MOCK_SCENARIO,
      );
      expect(result.abilityTriggered).toBe(false);
    });
  });

  describe("getAbilityInfo", () => {
    it("returns correct info for each class", () => {
      expect(ClassAbilityEngine.getAbilityInfo("ape").name).toBe("Diamond Hands");
      expect(ClassAbilityEngine.getAbilityInfo("ape").maxUses).toBe(1);

      expect(ClassAbilityEngine.getAbilityInfo("analyst").name).toBe("Deep Dive");
      expect(ClassAbilityEngine.getAbilityInfo("analyst").maxUses).toBe(2);
      expect(ClassAbilityEngine.getAbilityInfo("analyst").usesPerDay).toBe(true);

      expect(ClassAbilityEngine.getAbilityInfo("shadow").name).toBe("Incognito");
      expect(ClassAbilityEngine.getAbilityInfo("degen").name).toBe("Gut Feeling");
    });

    it("returns fallback for unknown class", () => {
      const info = ClassAbilityEngine.getAbilityInfo("unknown");
      expect(info.name).toBe("None");
      expect(info.maxUses).toBe(0);
    });
  });
});
