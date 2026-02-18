/**
 * gameStore unit tests
 * Run: npx jest src/store/__tests__/gameStore.test.ts
 */

// Mock react-native Platform before any imports
jest.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

// Mock AsyncStorage (not used on web, but must be resolvable)
jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { useGameStore } from "../gameStore";

// Reset store state between tests
beforeEach(() => {
  useGameStore.getState().resetGame();
});

describe("gameStore", () => {
  describe("completeScenario", () => {
    it("adds scenario to completedScenarios", () => {
      const { completeScenario } = useGameStore.getState();

      completeScenario("ch1-fake-support-dm", "survived", ["choice-a"]);

      const state = useGameStore.getState();
      expect(state.completedScenarios).toContain("ch1-fake-support-dm");
      expect(state.scenarioResults["ch1-fake-support-dm"]).toMatchObject({
        outcome: "survived",
        choicesMade: ["choice-a"],
        attemptCount: 1,
      });
    });

    it("increments attemptCount on replay", () => {
      const { completeScenario } = useGameStore.getState();

      completeScenario("ch1-fake-airdrop", "rekt", ["bad-choice"]);
      completeScenario("ch1-fake-airdrop", "survived", ["good-choice"]);

      const result =
        useGameStore.getState().scenarioResults["ch1-fake-airdrop"];
      expect(result.attemptCount).toBe(2);
      expect(result.outcome).toBe("survived");
    });

    it("does not duplicate scenario in completedScenarios", () => {
      const { completeScenario } = useGameStore.getState();

      completeScenario("ch1-fake-airdrop", "rekt", []);
      completeScenario("ch1-fake-airdrop", "survived", []);

      const ids = useGameStore
        .getState()
        .completedScenarios.filter((id) => id === "ch1-fake-airdrop");
      expect(ids).toHaveLength(1);
    });
  });

  describe("chapter progress", () => {
    it("shows 3/5 after completing 3 scenarios", () => {
      const { completeScenario, getChapterProgress } =
        useGameStore.getState();

      completeScenario("ch1-fake-support-dm", "survived", []);
      completeScenario("ch1-seed-phrase-request", "survived", []);
      completeScenario("ch1-fake-airdrop", "survived", []);

      const progress = useGameStore.getState().getChapterProgress(1);
      expect(progress).toEqual({ completed: 3, total: 5 });
    });

    it("isChapterComplete returns false when not all scenarios done", () => {
      const { completeScenario } = useGameStore.getState();

      completeScenario("ch1-fake-support-dm", "survived", []);
      completeScenario("ch1-seed-phrase-request", "survived", []);

      expect(useGameStore.getState().isChapterComplete(1)).toBe(false);
    });

    it("isChapterComplete returns true when all scenarios done", () => {
      const { completeScenario } = useGameStore.getState();
      const ch1Scenarios = [
        "ch1-fake-support-dm",
        "ch1-seed-phrase-request",
        "ch1-fake-airdrop",
        "ch1-phishing-email",
        "ch1-seed-phrase-trap",
      ];

      ch1Scenarios.forEach((id) => completeScenario(id, "survived", []));

      expect(useGameStore.getState().isChapterComplete(1)).toBe(true);
    });
  });

  describe("advanceChapter", () => {
    it("advances when current chapter is complete", () => {
      const { completeScenario } = useGameStore.getState();
      const ch1Scenarios = [
        "ch1-fake-support-dm",
        "ch1-seed-phrase-request",
        "ch1-fake-airdrop",
        "ch1-phishing-email",
        "ch1-seed-phrase-trap",
      ];

      ch1Scenarios.forEach((id) => completeScenario(id, "survived", []));
      useGameStore.getState().advanceChapter();

      expect(useGameStore.getState().currentChapter).toBe(2);
    });

    it("does not advance when chapter is incomplete", () => {
      useGameStore
        .getState()
        .completeScenario("ch1-fake-support-dm", "survived", []);
      useGameStore.getState().advanceChapter();

      expect(useGameStore.getState().currentChapter).toBe(1);
    });
  });

  describe("getNextUncompletedScenario", () => {
    it("returns first scenario when none completed", () => {
      expect(useGameStore.getState().getNextUncompletedScenario()).toBe(
        "ch1-fake-support-dm",
      );
    });

    it("skips completed scenarios", () => {
      useGameStore
        .getState()
        .completeScenario("ch1-fake-support-dm", "survived", []);

      expect(useGameStore.getState().getNextUncompletedScenario()).toBe(
        "ch1-seed-phrase-request",
      );
    });
  });

  describe("achievements", () => {
    it("auto-checks and unlocks streak achievement", () => {
      const mockPlayer = {
        streak: 7,
        survived: 0,
        completedScenarios: [],
        level: 1,
        unlockedGear: [],
      };
      const mockPortfolio = { getTotalValue: () => 0 };

      const unlocked = useGameStore
        .getState()
        .checkAchievements(mockPlayer, mockPortfolio);

      expect(unlocked.some((a) => a.id === "one-week")).toBe(true);
      expect(
        useGameStore
          .getState()
          .getUnlockedAchievements()
          .some((a) => a.id === "one-week"),
      ).toBe(true);
    });

    it("auto-checks portfolio value achievements", () => {
      const mockPlayer = {
        streak: 0,
        survived: 0,
        completedScenarios: [],
        level: 1,
        unlockedGear: [],
      };
      const mockPortfolio = { getTotalValue: () => 15000 };

      const unlocked = useGameStore
        .getState()
        .checkAchievements(mockPlayer, mockPortfolio);

      expect(unlocked.some((a) => a.id === "five-figures")).toBe(true);
    });

    it("does not re-unlock already unlocked achievements", () => {
      const mockPlayer = {
        streak: 7,
        survived: 0,
        completedScenarios: [],
        level: 1,
        unlockedGear: [],
      };
      const mockPortfolio = { getTotalValue: () => 0 };

      useGameStore
        .getState()
        .checkAchievements(mockPlayer, mockPortfolio);
      const unlocked2 = useGameStore
        .getState()
        .checkAchievements(mockPlayer, mockPortfolio);

      // Second call should return empty — already unlocked
      expect(unlocked2).toHaveLength(0);
    });

    it("unlockAchievement works for specific-action types", () => {
      useGameStore.getState().unlockAchievement("code-reader");

      expect(
        useGameStore
          .getState()
          .getUnlockedAchievements()
          .some((a) => a.id === "code-reader"),
      ).toBe(true);
    });
  });

  describe("streak milestones", () => {
    it("returns claimable milestones for streak >= 7", () => {
      const claimable = useGameStore.getState().checkStreakMilestones(7);
      expect(claimable).toHaveLength(1);
      expect(claimable[0].days).toBe(7);
    });

    it("claimStreakReward returns reward and marks claimed", () => {
      const reward = useGameStore.getState().claimStreakReward(7);
      expect(reward).toEqual({ coins: 500, xp: 200 });

      // Claiming again returns null
      expect(useGameStore.getState().claimStreakReward(7)).toBeNull();
    });
  });

  describe("NPC relationships", () => {
    it("updates and retrieves NPC relationship", () => {
      useGameStore.getState().updateNPCRelationship("sensei", 10);
      useGameStore.getState().updateNPCRelationship("sensei", 5);

      expect(useGameStore.getState().getNPCRelationship("sensei")).toBe(15);
    });

    it("defaults to 0 for unknown NPC", () => {
      expect(useGameStore.getState().getNPCRelationship("unknown")).toBe(0);
    });
  });

  describe("game completion", () => {
    it("unlocks post-game content when all chapters done", () => {
      // Complete all 25 scenarios
      const allScenarios = [
        "ch1-fake-support-dm", "ch1-seed-phrase-request", "ch1-fake-airdrop",
        "ch1-phishing-email", "ch1-seed-phrase-trap",
        "ch2-fake-dex", "ch2-honeypot-token", "ch2-unlimited-approval",
        "ch2-fake-swap", "ch2-rug-pull",
        "ch3-fake-mint", "ch3-discord-hack", "ch3-counterfeit-nft",
        "ch3-fake-collab", "ch3-discord-migration",
        "ch4-fake-bridge", "ch4-chain-approval", "ch4-bridge-exploit",
        "ch4-fake-l2", "ch4-bridge-phishing",
        "ch5-governance-attack", "ch5-social-whale", "ch5-mev-trap",
        "ch5-insider-info", "ch5-inside-job",
      ];

      allScenarios.forEach((id) =>
        useGameStore.getState().completeScenario(id, "survived", []),
      );

      useGameStore.getState().checkGameCompletion();

      const state = useGameStore.getState();
      expect(state.hasCompletedGame).toBe(true);
      expect(state.scannerUnlocked).toBe(true);
      expect(state.threatFeedUnlocked).toBe(true);
    });
  });

  describe("resetGame", () => {
    it("resets all state to initial values", () => {
      useGameStore
        .getState()
        .completeScenario("ch1-fake-support-dm", "survived", []);
      useGameStore.getState().updateNPCRelationship("sensei", 50);
      useGameStore.getState().unlockAchievement("eagle-eye");

      useGameStore.getState().resetGame();

      const state = useGameStore.getState();
      expect(state.completedScenarios).toHaveLength(0);
      expect(state.getNPCRelationship("sensei")).toBe(0);
      expect(state.getUnlockedAchievements()).toHaveLength(0);
      expect(state.currentChapter).toBe(1);
      expect(state.gameDay).toBe(1);
    });
  });
});
