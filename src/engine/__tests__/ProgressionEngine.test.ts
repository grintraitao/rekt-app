/**
 * ProgressionEngine unit tests
 * Run: npx jest src/engine/__tests__/ProgressionEngine.test.ts
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

import { ProgressionEngine, XP_REWARDS } from "../ProgressionEngine";

// ── calculateScenarioXP ─────────────────────────────────────────────────────────

describe("ProgressionEngine", () => {
  describe("calculateScenarioXP", () => {
    it("returns base 200 XP for survived difficulty-1 with no streak", () => {
      const xp = ProgressionEngine.calculateScenarioXP("survived", 1, false, 0);
      expect(xp).toBe(200);
    });

    it("returns base 50 XP for rekt difficulty-1 with no streak", () => {
      const xp = ProgressionEngine.calculateScenarioXP("rekt", 1, false, 0);
      expect(xp).toBe(50);
    });

    it("applies difficulty multiplier", () => {
      // Difficulty 3 = 1.5x → 200 * 1.5 = 300
      const xp = ProgressionEngine.calculateScenarioXP("survived", 3, false, 0);
      expect(xp).toBe(300);
    });

    it("applies difficulty 5 multiplier (3.0x)", () => {
      // 200 * 3.0 = 600
      const xp = ProgressionEngine.calculateScenarioXP("survived", 5, false, 0);
      expect(xp).toBe(600);
    });

    it("applies streak multiplier for survived", () => {
      // streak 10 → mult = 1 + 10 * 0.05 = 1.5
      // 200 * 1.0(diff1) * 1.5(streak) = 300
      const xp = ProgressionEngine.calculateScenarioXP("survived", 1, false, 10);
      expect(xp).toBe(300);
    });

    it("does NOT apply streak multiplier for rekt", () => {
      // Rekt always gets base × difficulty, no streak bonus
      const xp = ProgressionEngine.calculateScenarioXP("rekt", 1, false, 10);
      expect(xp).toBe(50);
    });

    it("caps streak multiplier at 2.0", () => {
      // streak 100 → 1 + 100*0.05 = 6, capped at 2.0
      // 200 * 1.0 * 2.0 = 400
      const xp = ProgressionEngine.calculateScenarioXP("survived", 1, false, 100);
      expect(xp).toBe(400);
    });

    it("returns boss XP for boss scenario survived", () => {
      // Boss survived = 500 base
      const xp = ProgressionEngine.calculateScenarioXP("survived", 1, true, 0);
      expect(xp).toBe(500);
    });

    it("returns boss rekt XP for boss scenario rekt", () => {
      const xp = ProgressionEngine.calculateScenarioXP("rekt", 1, true, 0);
      expect(xp).toBe(100);
    });

    it("combines difficulty + streak for a difficulty-3 with 10-day streak", () => {
      // 200 * 1.5(diff3) * 1.5(streak10) = 450
      const xp = ProgressionEngine.calculateScenarioXP("survived", 3, false, 10);
      expect(xp).toBe(450);
    });
  });

  // ── checkLevelUp ──────────────────────────────────────────────────────────────

  describe("checkLevelUp", () => {
    it("no level up if XP is insufficient", () => {
      // Level 1 needs 300 XP
      const result = ProgressionEngine.checkLevelUp(1, 0, 200);
      expect(result.newLevel).toBe(1);
      expect(result.newXP).toBe(200);
      expect(result.levelsGained).toBe(0);
      expect(result.newTitle).toBe("NOOB");
    });

    it("levels up from 1 to 2 with exactly 300 XP", () => {
      const result = ProgressionEngine.checkLevelUp(1, 0, 300);
      expect(result.newLevel).toBe(2);
      expect(result.newXP).toBe(0);
      expect(result.levelsGained).toBe(1);
    });

    it("handles overflow XP into next level", () => {
      // Level 1 needs 300, level 2 needs 600
      // 500 XP → level up to 2 with 200 remaining
      const result = ProgressionEngine.checkLevelUp(1, 0, 500);
      expect(result.newLevel).toBe(2);
      expect(result.newXP).toBe(200);
      expect(result.levelsGained).toBe(1);
    });

    it("handles multiple level ups at once", () => {
      // Level 1→2: 300, Level 2→3: 600, Level 3→4: 900 = 1800 total
      const result = ProgressionEngine.checkLevelUp(1, 0, 1800);
      expect(result.newLevel).toBe(4);
      expect(result.newXP).toBe(0);
      expect(result.levelsGained).toBe(3);
    });

    it("level 5 to 6 changes title from NOOB to TRADER", () => {
      // Level 5 needs 1500 XP to level up
      const result = ProgressionEngine.checkLevelUp(5, 0, 1500);
      expect(result.newLevel).toBe(6);
      expect(result.newTitle).toBe("TRADER");
      expect(result.levelsGained).toBe(1);
    });

    it("accounts for existing XP", () => {
      // Level 5 needs 1500, already have 1400 → need 100 more
      const result = ProgressionEngine.checkLevelUp(5, 1400, 100);
      expect(result.newLevel).toBe(6);
      expect(result.newXP).toBe(0);
      expect(result.levelsGained).toBe(1);
    });

    it("caps at max level 30", () => {
      const result = ProgressionEngine.checkLevelUp(29, 0, 100000);
      expect(result.newLevel).toBe(30);
    });
  });

  // ── getTitleForLevel ──────────────────────────────────────────────────────────

  describe("getTitleForLevel", () => {
    it("returns NOOB for levels 1-5", () => {
      expect(ProgressionEngine.getTitleForLevel(1)).toBe("NOOB");
      expect(ProgressionEngine.getTitleForLevel(5)).toBe("NOOB");
    });

    it("returns TRADER for levels 6-10", () => {
      expect(ProgressionEngine.getTitleForLevel(6)).toBe("TRADER");
      expect(ProgressionEngine.getTitleForLevel(10)).toBe("TRADER");
    });

    it("returns COLLECTOR for levels 11-15", () => {
      expect(ProgressionEngine.getTitleForLevel(11)).toBe("COLLECTOR");
      expect(ProgressionEngine.getTitleForLevel(15)).toBe("COLLECTOR");
    });

    it("returns FARMER for levels 16-20", () => {
      expect(ProgressionEngine.getTitleForLevel(16)).toBe("FARMER");
      expect(ProgressionEngine.getTitleForLevel(20)).toBe("FARMER");
    });

    it("returns VETERAN for levels 21-25", () => {
      expect(ProgressionEngine.getTitleForLevel(21)).toBe("VETERAN");
      expect(ProgressionEngine.getTitleForLevel(25)).toBe("VETERAN");
    });

    it("returns SURVIVOR for levels 26-30", () => {
      expect(ProgressionEngine.getTitleForLevel(26)).toBe("SURVIVOR");
      expect(ProgressionEngine.getTitleForLevel(30)).toBe("SURVIVOR");
    });
  });

  // ── calculateStatChanges ──────────────────────────────────────────────────────

  describe("calculateStatChanges", () => {
    it("survived with first try gives +3 detection", () => {
      const changes = ProgressionEngine.calculateStatChanges("survived", {
        firstTry: true,
      });
      expect(changes.detection).toBe(3);
      expect(changes.knowledge).toBe(1);
    });

    it("survived with inspection gives +3 security", () => {
      const changes = ProgressionEngine.calculateStatChanges("survived", {
        usedInspection: true,
      });
      expect(changes.security).toBe(3);
    });

    it("rekt gives +1 knowledge", () => {
      const changes = ProgressionEngine.calculateStatChanges("rekt");
      expect(changes.knowledge).toBe(1);
    });

    it("investigated gives +1 detection", () => {
      const changes = ProgressionEngine.calculateStatChanges("investigated");
      expect(changes.detection).toBe(1);
    });

    it("investigated with check-contract gives +1 security bonus", () => {
      const changes = ProgressionEngine.calculateStatChanges("investigated", {
        investigationType: "check-contract",
      });
      expect(changes.detection).toBe(1);
      expect(changes.security).toBe(1);
    });

    it("education-read gives +5 knowledge", () => {
      const changes = ProgressionEngine.calculateStatChanges("education-read");
      expect(changes.knowledge).toBe(5);
    });

    it("gear-equipped gives +2 security", () => {
      const changes = ProgressionEngine.calculateStatChanges("gear-equipped");
      expect(changes.security).toBe(2);
    });

    it("daily-login gives +2 knowledge", () => {
      const changes = ProgressionEngine.calculateStatChanges("daily-login");
      expect(changes.knowledge).toBe(2);
    });
  });

  // ── calculateWealthStat ───────────────────────────────────────────────────────

  describe("calculateWealthStat", () => {
    it("returns 10 for $0-5k", () => {
      expect(ProgressionEngine.calculateWealthStat(0)).toBe(10);
      expect(ProgressionEngine.calculateWealthStat(4999)).toBe(10);
    });

    it("returns 30 for $5k-25k", () => {
      expect(ProgressionEngine.calculateWealthStat(5000)).toBe(30);
      expect(ProgressionEngine.calculateWealthStat(24999)).toBe(30);
    });

    it("returns 50 for $25k-60k", () => {
      expect(ProgressionEngine.calculateWealthStat(25000)).toBe(50);
      expect(ProgressionEngine.calculateWealthStat(59999)).toBe(50);
    });

    it("returns 70 for $60k-150k", () => {
      expect(ProgressionEngine.calculateWealthStat(60000)).toBe(70);
      expect(ProgressionEngine.calculateWealthStat(149999)).toBe(70);
    });

    it("returns 90 for $150k+", () => {
      expect(ProgressionEngine.calculateWealthStat(150000)).toBe(90);
      expect(ProgressionEngine.calculateWealthStat(1000000)).toBe(90);
    });
  });

  // ── calculateHPRecovery ───────────────────────────────────────────────────────

  describe("calculateHPRecovery", () => {
    it("recovers 5 HP with streak <= 7", () => {
      expect(ProgressionEngine.calculateHPRecovery(80, 5)).toBe(5);
    });

    it("recovers 10 HP with streak > 7", () => {
      expect(ProgressionEngine.calculateHPRecovery(80, 8)).toBe(10);
    });

    it("caps recovery at 100 HP", () => {
      expect(ProgressionEngine.calculateHPRecovery(97, 5)).toBe(3);
    });

    it("recovers 0 if already at max HP", () => {
      expect(ProgressionEngine.calculateHPRecovery(100, 10)).toBe(0);
    });
  });

  // ── calculateDamage ───────────────────────────────────────────────────────────

  describe("calculateDamage", () => {
    it("returns full damage with no gear", () => {
      expect(ProgressionEngine.calculateDamage(100, [], "ape")).toBe(100);
    });

    it("paper-wallet reduces damage by 5%", () => {
      expect(
        ProgressionEngine.calculateDamage(100, ["paper-wallet"], "ape"),
      ).toBe(95);
    });

    it("hardware-wallet reduces damage by 15%", () => {
      expect(
        ProgressionEngine.calculateDamage(100, ["hardware-wallet"], "analyst"),
      ).toBe(85);
    });

    it("cold-storage reduces damage by 25%", () => {
      expect(
        ProgressionEngine.calculateDamage(100, ["cold-storage"], "shadow"),
      ).toBe(75);
    });

    it("stacks multiple gear reductions", () => {
      // paper-wallet(5) + hardware-wallet(15) + cold-storage(25) = 45%
      const damage = ProgressionEngine.calculateDamage(
        200,
        ["paper-wallet", "hardware-wallet", "cold-storage"],
        "analyst",
      );
      expect(damage).toBe(110); // 200 * 0.55
    });

    it("caps gear reduction at 75%", () => {
      // cold-storage(25) + burner-wallet(40) + hardware-wallet(15) = 80%, capped at 75%
      const damage = ProgressionEngine.calculateDamage(
        200,
        ["cold-storage", "burner-wallet", "hardware-wallet"],
        "degen",
      );
      expect(damage).toBe(50); // 200 * 0.25
    });

    it("ignores unknown gear", () => {
      expect(
        ProgressionEngine.calculateDamage(100, ["unknown-gear"], "ape"),
      ).toBe(100);
    });
  });

  // ── getXPForLevel ─────────────────────────────────────────────────────────────

  describe("getXPForLevel", () => {
    it("level 1 requires 300 XP", () => {
      expect(ProgressionEngine.getXPForLevel(1)).toBe(300);
    });

    it("level 5 requires 1500 XP", () => {
      expect(ProgressionEngine.getXPForLevel(5)).toBe(1500);
    });

    it("level 10 requires 3000 XP", () => {
      expect(ProgressionEngine.getXPForLevel(10)).toBe(3000);
    });

    it("level 20 requires 6000 XP", () => {
      expect(ProgressionEngine.getXPForLevel(20)).toBe(6000);
    });

    it("level 30 requires 9000 XP", () => {
      expect(ProgressionEngine.getXPForLevel(30)).toBe(9000);
    });
  });

  // ── getLevelProgress ──────────────────────────────────────────────────────────

  describe("getLevelProgress", () => {
    it("returns 0% with no XP", () => {
      expect(ProgressionEngine.getLevelProgress(0, 300)).toBe(0);
    });

    it("returns 50% at halfway", () => {
      expect(ProgressionEngine.getLevelProgress(150, 300)).toBe(50);
    });

    it("returns 100% when at max level (xpToNextLevel = 0)", () => {
      expect(ProgressionEngine.getLevelProgress(0, 0)).toBe(100);
    });

    it("rounds to nearest integer", () => {
      // 100/300 = 33.33...% → 33%
      expect(ProgressionEngine.getLevelProgress(100, 300)).toBe(33);
    });
  });

  // ── calculateDailyLoginXP ─────────────────────────────────────────────────────

  describe("calculateDailyLoginXP", () => {
    it("returns 50 base XP with no streak", () => {
      const xp = ProgressionEngine.calculateDailyLoginXP(0);
      // base 50 * streakMult(1.0) + streakBonus(0) = 50
      expect(xp).toBe(50);
    });

    it("includes streak bonus and multiplier", () => {
      // streak 10 → streakMult = 1.5, base 50 * 1.5 = 75
      // streakBonus = min(10*10, 200) = 100
      // total = 75 + 100 = 175
      const xp = ProgressionEngine.calculateDailyLoginXP(10);
      expect(xp).toBe(175);
    });

    it("caps streak bonus at 200", () => {
      // streak 30 → streakBonus = min(300, 200) = 200
      // streakMult = min(2.0, 1 + 30*0.05) = min(2.0, 2.5) = 2.0
      // 50 * 2.0 + 200 = 300
      const xp = ProgressionEngine.calculateDailyLoginXP(30);
      expect(xp).toBe(300);
    });
  });

  // ── Integration: spec test case ───────────────────────────────────────────────

  describe("integration: difficulty 3 survived with 10-day streak, level 5→6", () => {
    it("calculates correct XP and level up", () => {
      // Step 1: Calculate XP for surviving difficulty 3 with 10-day streak
      const xpGained = ProgressionEngine.calculateScenarioXP(
        "survived",
        3,
        false,
        10,
      );
      // 200 * 1.5(diff) * 1.5(streak) = 450
      expect(xpGained).toBe(450);

      // Step 2: Check level up from level 5 with 1200 XP already + 450 gained
      // Level 5 needs 1500 XP. 1200 + 450 = 1650 → level up with 150 remaining
      const result = ProgressionEngine.checkLevelUp(5, 1200, 450);
      expect(result.newLevel).toBe(6);
      expect(result.newXP).toBe(150);
      expect(result.levelsGained).toBe(1);
      expect(result.newTitle).toBe("TRADER");
    });
  });
});
