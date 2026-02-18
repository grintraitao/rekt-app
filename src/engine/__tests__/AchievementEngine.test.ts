/**
 * AchievementEngine unit tests
 * Run: npx jest src/engine/__tests__/AchievementEngine.test.ts
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

import type { Achievement, StreakMilestone } from "../../store/gameStore";
import {
  AchievementEngine,
  processGameAction,
  type PlayerSnapshot,
  type PortfolioSnapshot,
  type GameSnapshot,
} from "../AchievementEngine";

// ── Test fixtures ────────────────────────────────────────────────────────────────

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "one-week",
    name: "One Week",
    emoji: "\uD83D\uDD25",
    description: "Maintain a 7-day streak",
    category: "survival",
    condition: { type: "streak", value: 7 },
    reward: { xp: 200 },
  },
  {
    id: "eagle-eye",
    name: "Eagle Eye",
    emoji: "\uD83D\uDD0D",
    description: "Spot 10 scams",
    category: "detection",
    condition: { type: "scenarios-survived", value: 10 },
    reward: { xp: 100 },
  },
  {
    id: "five-figures",
    name: "Five Figures",
    emoji: "\uD83D\uDCC8",
    description: "Portfolio hits $10,000",
    category: "wealth",
    condition: { type: "portfolio-value", value: 10000 },
    reward: { coins: 50 },
  },
  {
    id: "genesis-graduate",
    name: "Genesis Graduate",
    emoji: "\uD83C\uDFE0",
    description: "Complete Chapter 1",
    category: "story",
    condition: { type: "chapter-complete", value: 1 },
    reward: { xp: 300 },
  },
  {
    id: "level-ten",
    name: "Level 10",
    emoji: "\u2B50",
    description: "Reach level 10",
    category: "survival",
    condition: { type: "level-reached", value: 10 },
    reward: { xp: 500 },
  },
  {
    id: "two-weeks",
    name: "Two Weeks",
    emoji: "\uD83D\uDD25\uD83D\uDD25",
    description: "Maintain a 14-day streak",
    category: "survival",
    condition: { type: "streak", value: 14 },
    reward: { xp: 500, gearUnlock: "streak-shield" },
  },
  {
    id: "already-done",
    name: "Already Done",
    emoji: "\u2705",
    description: "Already unlocked",
    category: "story",
    condition: { type: "streak", value: 1 },
    reward: { xp: 10 },
    unlockedAt: "2025-01-01T00:00:00Z",
  },
];

const CH1_IDS = [
  "ch1-fake-support-dm",
  "ch1-seed-phrase-request",
  "ch1-fake-airdrop",
  "ch1-phishing-email",
  "ch1-seed-phrase-trap",
];

function makePlayer(overrides: Partial<PlayerSnapshot> = {}): PlayerSnapshot {
  return {
    level: 1,
    streak: 0,
    survived: 0,
    completedScenarios: [],
    unlockedGear: ["paper-wallet"],
    ...overrides,
  };
}

function makePortfolio(overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot {
  return {
    totalValue: 5000,
    ...overrides,
  };
}

function makeGame(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    completedScenarios: [],
    scenarioResults: {},
    chapters: [
      { id: 1, scenarioIds: CH1_IDS },
      { id: 2, scenarioIds: ["ch2-a", "ch2-b", "ch2-c", "ch2-d", "ch2-e"] },
    ],
    ...overrides,
  };
}

const MOCK_MILESTONES: StreakMilestone[] = [
  { days: 7, name: "One week!", emoji: "\uD83D\uDD25", reward: { coins: 500, xp: 200 }, claimed: false },
  { days: 14, name: "Two weeks!", emoji: "\uD83D\uDD25\uD83D\uDD25", reward: { coins: 1000 }, claimed: false },
  { days: 30, name: "Monthly!", emoji: "\uD83D\uDD25\uD83D\uDD25\uD83D\uDD25", reward: { coins: 2500 }, claimed: false },
];

// ── checkAllAchievements ────────────────────────────────────────────────────────

describe("AchievementEngine", () => {
  describe("checkAllAchievements", () => {
    it("unlocks streak achievement when streak >= 7", () => {
      const player = makePlayer({ streak: 7 });
      const result = AchievementEngine.checkAllAchievements(
        MOCK_ACHIEVEMENTS,
        player,
        makePortfolio(),
        makeGame(),
      );
      const ids = result.map((a) => a.id);
      expect(ids).toContain("one-week");
    });

    it("unlocks portfolio achievement when value >= 10000", () => {
      const result = AchievementEngine.checkAllAchievements(
        MOCK_ACHIEVEMENTS,
        makePlayer(),
        makePortfolio({ totalValue: 15000 }),
        makeGame(),
      );
      expect(result.some((a) => a.id === "five-figures")).toBe(true);
    });

    it("unlocks scenarios-survived when enough survived", () => {
      const results: Record<string, any> = {};
      for (let i = 0; i < 10; i++) {
        results[`scenario-${i}`] = {
          outcome: "survived",
          choicesMade: [],
          timestamp: new Date().toISOString(),
          attemptCount: 1,
        };
      }
      const result = AchievementEngine.checkAllAchievements(
        MOCK_ACHIEVEMENTS,
        makePlayer({ survived: 10 }),
        makePortfolio(),
        makeGame({ scenarioResults: results }),
      );
      expect(result.some((a) => a.id === "eagle-eye")).toBe(true);
    });

    it("unlocks chapter-complete when all chapter scenarios done", () => {
      const result = AchievementEngine.checkAllAchievements(
        MOCK_ACHIEVEMENTS,
        makePlayer(),
        makePortfolio(),
        makeGame({ completedScenarios: [...CH1_IDS] }),
      );
      expect(result.some((a) => a.id === "genesis-graduate")).toBe(true);
    });

    it("unlocks level-reached when level >= target", () => {
      const result = AchievementEngine.checkAllAchievements(
        MOCK_ACHIEVEMENTS,
        makePlayer({ level: 10 }),
        makePortfolio(),
        makeGame(),
      );
      expect(result.some((a) => a.id === "level-ten")).toBe(true);
    });

    it("does NOT re-unlock already unlocked achievements", () => {
      const result = AchievementEngine.checkAllAchievements(
        MOCK_ACHIEVEMENTS,
        makePlayer({ streak: 100 }),
        makePortfolio({ totalValue: 1000000 }),
        makeGame(),
      );
      expect(result.some((a) => a.id === "already-done")).toBe(false);
    });

    it("can unlock multiple achievements at once", () => {
      const result = AchievementEngine.checkAllAchievements(
        MOCK_ACHIEVEMENTS,
        makePlayer({ streak: 7, level: 10 }),
        makePortfolio({ totalValue: 15000 }),
        makeGame(),
      );
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it("returns empty when nothing new to unlock", () => {
      const result = AchievementEngine.checkAllAchievements(
        MOCK_ACHIEVEMENTS,
        makePlayer(),
        makePortfolio(),
        makeGame(),
      );
      expect(result).toHaveLength(0);
    });

    it("newly unlocked achievements have unlockedAt set", () => {
      const result = AchievementEngine.checkAllAchievements(
        MOCK_ACHIEVEMENTS,
        makePlayer({ streak: 7 }),
        makePortfolio(),
        makeGame(),
      );
      for (const a of result) {
        expect(a.unlockedAt).toBeTruthy();
      }
    });
  });

  // ── applyReward ───────────────────────────────────────────────────────────────

  describe("applyReward", () => {
    it("applies XP reward", () => {
      const addXP = jest.fn();
      const actions = {
        addXP,
        addCoins: jest.fn(),
        addSecurityTokens: jest.fn(),
        unlockGear: jest.fn(),
      };

      const result = AchievementEngine.applyReward(MOCK_ACHIEVEMENTS[0], actions);
      expect(addXP).toHaveBeenCalledWith(200);
      expect(result.rewardsApplied).toContain("+200 XP");
    });

    it("applies coins reward", () => {
      const addCoins = jest.fn();
      const actions = {
        addXP: jest.fn(),
        addCoins,
        addSecurityTokens: jest.fn(),
        unlockGear: jest.fn(),
      };

      AchievementEngine.applyReward(MOCK_ACHIEVEMENTS[2], actions); // five-figures: 50 coins
      expect(addCoins).toHaveBeenCalledWith(50);
    });

    it("applies gear unlock reward", () => {
      const unlockGear = jest.fn();
      const actions = {
        addXP: jest.fn(),
        addCoins: jest.fn(),
        addSecurityTokens: jest.fn(),
        unlockGear,
      };

      const result = AchievementEngine.applyReward(MOCK_ACHIEVEMENTS[5], actions); // two-weeks
      expect(unlockGear).toHaveBeenCalledWith("streak-shield");
      expect(result.rewardsApplied.some((r) => r.includes("streak-shield"))).toBe(true);
    });

    it("returns all reward descriptions", () => {
      const actions = {
        addXP: jest.fn(),
        addCoins: jest.fn(),
        addSecurityTokens: jest.fn(),
        unlockGear: jest.fn(),
      };

      const result = AchievementEngine.applyReward(MOCK_ACHIEVEMENTS[5], actions);
      // two-weeks: xp 500 + gearUnlock
      expect(result.rewardsApplied.length).toBe(2);
    });
  });

  // ── getProgress ───────────────────────────────────────────────────────────────

  describe("getProgress", () => {
    it("returns 0% for streak achievement with no streak", () => {
      const result = AchievementEngine.getProgress(
        MOCK_ACHIEVEMENTS[0], // one-week (streak 7)
        makePlayer({ streak: 0 }),
        makePortfolio(),
        makeGame(),
      );
      expect(result.current).toBe(0);
      expect(result.target).toBe(7);
      expect(result.percentage).toBe(0);
    });

    it("returns correct progress for partial streak", () => {
      const result = AchievementEngine.getProgress(
        MOCK_ACHIEVEMENTS[0],
        makePlayer({ streak: 3 }),
        makePortfolio(),
        makeGame(),
      );
      expect(result.current).toBe(3);
      expect(result.target).toBe(7);
      expect(result.percentage).toBe(43);
    });

    it("caps percentage at 100", () => {
      const result = AchievementEngine.getProgress(
        MOCK_ACHIEVEMENTS[0],
        makePlayer({ streak: 100 }),
        makePortfolio(),
        makeGame(),
      );
      expect(result.percentage).toBe(100);
    });

    it("returns portfolio value progress", () => {
      const result = AchievementEngine.getProgress(
        MOCK_ACHIEVEMENTS[2], // five-figures ($10k)
        makePlayer(),
        makePortfolio({ totalValue: 7500 }),
        makeGame(),
      );
      expect(result.current).toBe(7500);
      expect(result.target).toBe(10000);
      expect(result.percentage).toBe(75);
    });

    it("returns level progress", () => {
      const result = AchievementEngine.getProgress(
        MOCK_ACHIEVEMENTS[4], // level-ten
        makePlayer({ level: 6 }),
        makePortfolio(),
        makeGame(),
      );
      expect(result.current).toBe(6);
      expect(result.target).toBe(10);
      expect(result.percentage).toBe(60);
    });

    it("returns chapter-complete progress as completed chapter count", () => {
      const result = AchievementEngine.getProgress(
        MOCK_ACHIEVEMENTS[3], // genesis-graduate (chapter 1)
        makePlayer(),
        makePortfolio(),
        makeGame({ completedScenarios: CH1_IDS.slice(0, 3) }),
      );
      // 0 chapters fully complete
      expect(result.current).toBe(0);
      expect(result.target).toBe(1);
    });
  });

  // ── checkStreakMilestones ──────────────────────────────────────────────────────

  describe("checkStreakMilestones", () => {
    it("returns 7-day milestone when streak reaches 7", () => {
      const result = AchievementEngine.checkStreakMilestones(7, MOCK_MILESTONES);
      expect(result).not.toBeNull();
      expect(result!.days).toBe(7);
    });

    it("returns highest unclaimed milestone", () => {
      const result = AchievementEngine.checkStreakMilestones(15, MOCK_MILESTONES);
      expect(result).not.toBeNull();
      expect(result!.days).toBe(14); // highest reached & unclaimed
    });

    it("returns null when streak below all milestones", () => {
      const result = AchievementEngine.checkStreakMilestones(3, MOCK_MILESTONES);
      expect(result).toBeNull();
    });

    it("skips already claimed milestones", () => {
      const milestones: StreakMilestone[] = [
        { ...MOCK_MILESTONES[0], claimed: true },  // 7 day claimed
        { ...MOCK_MILESTONES[1] },                  // 14 day unclaimed
        { ...MOCK_MILESTONES[2] },                  // 30 day unclaimed
      ];
      const result = AchievementEngine.checkStreakMilestones(10, milestones);
      // 7-day is claimed, 14-day not reached → null
      expect(result).toBeNull();
    });

    it("returns null when all milestones claimed", () => {
      const allClaimed = MOCK_MILESTONES.map((m) => ({ ...m, claimed: true }));
      const result = AchievementEngine.checkStreakMilestones(100, allClaimed);
      expect(result).toBeNull();
    });
  });

  // ── formatUnlockNotification ──────────────────────────────────────────────────

  describe("formatUnlockNotification", () => {
    it("formats correctly", () => {
      const notif = AchievementEngine.formatUnlockNotification(MOCK_ACHIEVEMENTS[0]);
      expect(notif.title).toBe("Achievement Unlocked!");
      expect(notif.subtitle).toContain("One Week");
      expect(notif.subtitle).toContain("+200 XP");
      expect(notif.emoji).toBeTruthy();
    });

    it("includes gear unlock in subtitle", () => {
      const notif = AchievementEngine.formatUnlockNotification(MOCK_ACHIEVEMENTS[5]);
      expect(notif.subtitle).toContain("streak-shield");
    });
  });

  // ── processGameAction ─────────────────────────────────────────────────────────

  describe("processGameAction", () => {
    it("returns newly unlocked achievements and applies rewards", () => {
      const addXP = jest.fn();
      const unlockAchievement = jest.fn();

      const result = processGameAction("scenario-complete", {
        achievements: MOCK_ACHIEVEMENTS,
        player: makePlayer({ streak: 7, survived: 5 }),
        portfolio: makePortfolio({ totalValue: 15000 }),
        game: makeGame(),
        streak: 7,
        milestones: MOCK_MILESTONES,
        playerActions: {
          addXP,
          addCoins: jest.fn(),
          addSecurityTokens: jest.fn(),
          unlockGear: jest.fn(),
        },
        unlockAchievement,
      });

      // Should unlock one-week + five-figures at minimum
      expect(result.newAchievements.length).toBeGreaterThanOrEqual(2);
      expect(unlockAchievement).toHaveBeenCalled();
      expect(addXP).toHaveBeenCalled();
      expect(result.notifications.length).toBeGreaterThanOrEqual(2);
    });

    it("detects streak milestone", () => {
      const result = processGameAction("daily-claim", {
        achievements: [],
        player: makePlayer({ streak: 7 }),
        portfolio: makePortfolio(),
        game: makeGame(),
        streak: 7,
        milestones: MOCK_MILESTONES,
        playerActions: {
          addXP: jest.fn(),
          addCoins: jest.fn(),
          addSecurityTokens: jest.fn(),
          unlockGear: jest.fn(),
        },
        unlockAchievement: jest.fn(),
      });

      expect(result.streakMilestone).not.toBeNull();
      expect(result.streakMilestone!.days).toBe(7);
    });
  });

  // ── Integration: spec test case ───────────────────────────────────────────────

  describe("integration: 7-day streak + 5 survived", () => {
    it("unlocks One Week and Five Survived-related achievements", () => {
      const results: Record<string, any> = {};
      for (let i = 0; i < 5; i++) {
        results[`s-${i}`] = {
          outcome: "survived",
          choicesMade: [],
          timestamp: new Date().toISOString(),
          attemptCount: 1,
        };
      }

      const achievements: Achievement[] = [
        {
          id: "one-week",
          name: "One Week",
          emoji: "\uD83D\uDD25",
          description: "7-day streak",
          category: "survival",
          condition: { type: "streak", value: 7 },
          reward: { xp: 200 },
        },
        {
          id: "five-survived",
          name: "Five Survived",
          emoji: "\u2B50",
          description: "Survive 5 scams",
          category: "detection",
          condition: { type: "scenarios-survived", value: 5 },
          reward: { xp: 100 },
        },
      ];

      const addXP = jest.fn();
      const unlockAchievement = jest.fn();

      const result = processGameAction("scenario-complete", {
        achievements,
        player: makePlayer({ streak: 7, survived: 5 }),
        portfolio: makePortfolio(),
        game: makeGame({ scenarioResults: results }),
        streak: 7,
        milestones: MOCK_MILESTONES,
        playerActions: {
          addXP,
          addCoins: jest.fn(),
          addSecurityTokens: jest.fn(),
          unlockGear: jest.fn(),
        },
        unlockAchievement,
      });

      const ids = result.newAchievements.map((a) => a.id);
      expect(ids).toContain("one-week");
      expect(ids).toContain("five-survived");

      // Verify rewards applied: 200 + 100 XP
      expect(addXP).toHaveBeenCalledWith(200);
      expect(addXP).toHaveBeenCalledWith(100);
      expect(unlockAchievement).toHaveBeenCalledTimes(2);

      // Streak milestone should also trigger
      expect(result.streakMilestone).not.toBeNull();
      expect(result.streakMilestone!.days).toBe(7);
    });
  });
});
