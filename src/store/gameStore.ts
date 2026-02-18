import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ── Type Definitions ────────────────────────────────────────────────────────────

export interface ChapterInfo {
  id: number;
  name: string;
  theme: string;
  emoji: string;
  requiredLevel: number;
  scenarioIds: string[];
  bossScenarioId: string;
  portfolioTarget: number;
}

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category:
    | "survival"
    | "detection"
    | "wealth"
    | "story"
    | "social"
    | "scanner";
  condition: {
    type:
      | "streak"
      | "scenarios-survived"
      | "scenarios-completed"
      | "portfolio-value"
      | "scams-caught"
      | "chapter-complete"
      | "specific-action"
      | "gear-collected"
      | "level-reached";
    value: number;
    specificId?: string;
  };
  reward: {
    xp?: number;
    coins?: number;
    securityTokens?: number;
    gearUnlock?: string;
    title?: string;
  };
  unlockedAt?: string;
}

export interface StreakMilestone {
  days: number;
  name: string;
  emoji: string;
  reward: {
    coins?: number;
    xp?: number;
    gearUnlock?: string;
    title?: string;
  };
  claimed: boolean;
}

export interface ScenarioResult {
  outcome: "rekt" | "survived";
  choicesMade: string[];
  timestamp: string;
  attemptCount: number;
}

interface GameState {
  currentChapter: number;
  chapters: ChapterInfo[];
  completedScenarios: string[];
  scenarioResults: Record<string, ScenarioResult>;
  gameDay: number;
  achievements: Achievement[];
  streakMilestones: StreakMilestone[];
  npcRelationships: Record<string, number>;
  hasCompletedGame: boolean;
  scannerUnlocked: boolean;
  threatFeedUnlocked: boolean;
}

interface GameActions {
  // Scenario progress
  completeScenario: (
    scenarioId: string,
    outcome: "rekt" | "survived",
    choicesMade: string[],
  ) => void;
  isScenarioCompleted: (scenarioId: string) => boolean;
  getChapterProgress: (
    chapterId: number,
  ) => { completed: number; total: number };
  canAccessChapter: (chapterId: number, playerLevel: number) => boolean;

  // Chapter management
  advanceChapter: () => void;
  isChapterComplete: (chapterId: number) => boolean;
  getCurrentChapterScenarios: () => string[];
  getNextUncompletedScenario: () => string | null;

  // Achievements
  checkAchievements: (
    playerStore: {
      streak: number;
      survived: number;
      completedScenarios: string[];
      level: number;
      unlockedGear: string[];
    },
    portfolioStore: { getTotalValue: () => number },
  ) => Achievement[];
  unlockAchievement: (achievementId: string) => void;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];

  // Streaks
  checkStreakMilestones: (currentStreak: number) => StreakMilestone[];
  claimStreakReward: (milestoneDay: number) => {
    coins?: number;
    xp?: number;
    gearUnlock?: string;
    title?: string;
  } | null;

  // Game day
  advanceGameDay: () => void;
  getDayInChapter: () => number;

  // NPC
  updateNPCRelationship: (npcId: string, delta: number) => void;
  getNPCRelationship: (npcId: string) => number;

  // Post-game
  checkGameCompletion: () => void;
  unlockScanner: () => void;
  unlockThreatFeed: () => void;

  // Reset
  resetGame: () => void;
}

// ── Chapter Definitions ─────────────────────────────────────────────────────────

const CHAPTERS: ChapterInfo[] = [
  {
    id: 1,
    name: "Genesis Block",
    theme: "Seed phrases, obvious phishing",
    emoji: "🏠",
    requiredLevel: 1,
    scenarioIds: [
      "ch1-fake-support-dm",
      "ch1-seed-phrase-request",
      "ch1-fake-airdrop",
      "ch1-phishing-email",
      "ch1-seed-phrase-trap",
    ],
    bossScenarioId: "ch1-seed-phrase-trap",
    portfolioTarget: 5000,
  },
  {
    id: 2,
    name: "DEX District",
    theme: "Trading, approvals, honeypots",
    emoji: "🦊",
    requiredLevel: 6,
    scenarioIds: [
      "ch2-fake-dex",
      "ch2-honeypot-token",
      "ch2-unlimited-approval",
      "ch2-fake-swap",
      "ch2-rug-pull",
    ],
    bossScenarioId: "ch2-rug-pull",
    portfolioTarget: 25000,
  },
  {
    id: 3,
    name: "NFT Bazaar",
    theme: "Discord hacks, fake mints",
    emoji: "🎨",
    requiredLevel: 11,
    scenarioIds: [
      "ch3-fake-mint",
      "ch3-discord-hack",
      "ch3-counterfeit-nft",
      "ch3-fake-collab",
      "ch3-discord-migration",
    ],
    bossScenarioId: "ch3-discord-migration",
    portfolioTarget: 60000,
  },
  {
    id: 4,
    name: "Bridge City",
    theme: "Cross-chain exploits",
    emoji: "🌉",
    requiredLevel: 16,
    scenarioIds: [
      "ch4-fake-bridge",
      "ch4-chain-approval",
      "ch4-bridge-exploit",
      "ch4-fake-l2",
      "ch4-bridge-phishing",
    ],
    bossScenarioId: "ch4-bridge-exploit",
    portfolioTarget: 150000,
  },
  {
    id: 5,
    name: "The Dark Pool",
    theme: "Governance attacks, MEV",
    emoji: "💀",
    requiredLevel: 21,
    scenarioIds: [
      "ch5-governance-attack",
      "ch5-social-whale",
      "ch5-mev-trap",
      "ch5-insider-info",
      "ch5-inside-job",
    ],
    bossScenarioId: "ch5-inside-job",
    portfolioTarget: 1000000,
  },
];

// ── Achievement Definitions ─────────────────────────────────────────────────────

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // Survival
  {
    id: "one-week",
    name: "One Week",
    emoji: "🔥",
    description: "Maintain a 7-day streak",
    category: "survival",
    condition: { type: "streak", value: 7 },
    reward: { xp: 200 },
  },
  {
    id: "two-weeks",
    name: "Two Weeks",
    emoji: "🔥🔥",
    description: "Maintain a 14-day streak",
    category: "survival",
    condition: { type: "streak", value: 14 },
    reward: { xp: 500, gearUnlock: "streak-shield" },
  },
  {
    id: "monthly-survivor",
    name: "Monthly Survivor",
    emoji: "🔥🔥🔥",
    description: "Maintain a 30-day streak",
    category: "survival",
    condition: { type: "streak", value: 30 },
    reward: { xp: 1000, title: "Monthly Survivor" },
  },
  {
    id: "diamond-hands",
    name: "Diamond Hands",
    emoji: "💎",
    description: "Maintain a 100-day streak",
    category: "survival",
    condition: { type: "streak", value: 100 },
    reward: { title: "💎 Diamond Hands" },
  },

  // Detection
  {
    id: "eagle-eye",
    name: "Eagle Eye",
    emoji: "🔍",
    description: "Spot 10 scams",
    category: "detection",
    condition: { type: "scenarios-survived", value: 10 },
    reward: { xp: 100 },
  },
  {
    id: "code-reader",
    name: "Code Reader",
    emoji: "🕵️",
    description: "Find a hidden contract function",
    category: "detection",
    condition: {
      type: "specific-action",
      value: 1,
      specificId: "find-hidden-function",
    },
    reward: { xp: 200 },
  },
  {
    id: "unmasked",
    name: "Unmasked",
    emoji: "🎭",
    description: "Identify Scammy Sam in disguise",
    category: "detection",
    condition: {
      type: "specific-action",
      value: 1,
      specificId: "unmask-scammy-sam",
    },
    reward: { xp: 300 },
  },

  // Wealth
  {
    id: "five-figures",
    name: "Five Figures",
    emoji: "📈",
    description: "Portfolio hits $10,000",
    category: "wealth",
    condition: { type: "portfolio-value", value: 10000 },
    reward: { coins: 50 },
  },
  {
    id: "six-figures",
    name: "Six Figures",
    emoji: "🏦",
    description: "Portfolio hits $100,000",
    category: "wealth",
    condition: { type: "portfolio-value", value: 100000 },
    reward: { coins: 200 },
  },
  {
    id: "millionaire",
    name: "Millionaire",
    emoji: "🐋",
    description: "Portfolio hits $1,000,000",
    category: "wealth",
    condition: { type: "portfolio-value", value: 1000000 },
    reward: { title: "🐋 Crypto Millionaire" },
  },

  // Story
  {
    id: "helping-hand",
    name: "Helping Hand",
    emoji: "🤝",
    description: "Help Rekt Rick rebuild",
    category: "story",
    condition: {
      type: "specific-action",
      value: 1,
      specificId: "help-rick-rebuild",
    },
    reward: { xp: 100 },
  },
  {
    id: "senseis-secret",
    name: "Sensei's Secret",
    emoji: "🧙",
    description: "Discover Sensei's past in Chapter 4",
    category: "story",
    condition: {
      type: "specific-action",
      value: 1,
      specificId: "discover-sensei-past",
    },
    reward: { xp: 500 },
  },
  {
    id: "everyone-falls",
    name: "Everyone Falls",
    emoji: "🦸",
    description: "Save Whale Wendy in Chapter 3",
    category: "story",
    condition: {
      type: "specific-action",
      value: 1,
      specificId: "save-whale-wendy",
    },
    reward: { xp: 300 },
  },

  // Chapter completion
  {
    id: "genesis-graduate",
    name: "Genesis Graduate",
    emoji: "🏠",
    description: "Complete Chapter 1",
    category: "story",
    condition: { type: "chapter-complete", value: 1 },
    reward: { xp: 300 },
  },
  {
    id: "game-complete",
    name: "Game Complete",
    emoji: "🏆",
    description: "Complete all 5 chapters",
    category: "story",
    condition: { type: "chapter-complete", value: 5 },
    reward: { xp: 2000, title: "🏆 REKT Survivor" },
  },
];

// ── Streak Milestones ───────────────────────────────────────────────────────────

const DEFAULT_STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 7,
    name: "One week un-rekt!",
    emoji: "🔥",
    reward: { coins: 500, xp: 200 },
    claimed: false,
  },
  {
    days: 14,
    name: "Two weeks!",
    emoji: "🔥🔥",
    reward: { coins: 1000, xp: 500, gearUnlock: "bookmark-bar" },
    claimed: false,
  },
  {
    days: 30,
    name: "Monthly survivor!",
    emoji: "🔥🔥🔥",
    reward: { coins: 2500, xp: 1000 },
    claimed: false,
  },
  {
    days: 100,
    name: "Diamond Hands",
    emoji: "💎",
    reward: { xp: 5000, title: "💎 Diamond Hands" },
    claimed: false,
  },
];

// ── Initial State ───────────────────────────────────────────────────────────────

const INITIAL_STATE: GameState = {
  currentChapter: 1,
  chapters: CHAPTERS,
  completedScenarios: [],
  scenarioResults: {},
  gameDay: 1,
  achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
  streakMilestones: DEFAULT_STREAK_MILESTONES.map((m) => ({ ...m })),
  npcRelationships: {
    sensei: 0,
    rick: 0,
    wendy: 0,
    sam: 0,
    bot: 0,
  },
  hasCompletedGame: false,
  scannerUnlocked: false,
  threatFeedUnlocked: false,
};

// ── Store ───────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Scenario Progress ───────────────────────────────────────────────────

      completeScenario: (scenarioId, outcome, choicesMade) => {
        set((s) => {
          const existing = s.scenarioResults[scenarioId];
          const attemptCount = existing ? existing.attemptCount + 1 : 1;

          return {
            completedScenarios: s.completedScenarios.includes(scenarioId)
              ? s.completedScenarios
              : [...s.completedScenarios, scenarioId],
            scenarioResults: {
              ...s.scenarioResults,
              [scenarioId]: {
                outcome,
                choicesMade,
                timestamp: new Date().toISOString(),
                attemptCount,
              },
            },
          };
        });
      },

      isScenarioCompleted: (scenarioId) => {
        return get().completedScenarios.includes(scenarioId);
      },

      getChapterProgress: (chapterId) => {
        const state = get();
        const chapter = state.chapters.find((c) => c.id === chapterId);
        if (!chapter) return { completed: 0, total: 0 };

        const completed = chapter.scenarioIds.filter((id) =>
          state.completedScenarios.includes(id),
        ).length;

        return { completed, total: chapter.scenarioIds.length };
      },

      canAccessChapter: (chapterId, playerLevel) => {
        const chapter = get().chapters.find((c) => c.id === chapterId);
        if (!chapter) return false;
        return playerLevel >= chapter.requiredLevel;
      },

      // ── Chapter Management ──────────────────────────────────────────────────

      advanceChapter: () => {
        set((s) => {
          if (s.currentChapter >= 5) return s;
          const chapter = s.chapters.find((c) => c.id === s.currentChapter);
          if (!chapter) return s;

          const allDone = chapter.scenarioIds.every((id) =>
            s.completedScenarios.includes(id),
          );
          if (!allDone) return s;

          return { currentChapter: s.currentChapter + 1 };
        });
      },

      isChapterComplete: (chapterId) => {
        const state = get();
        const chapter = state.chapters.find((c) => c.id === chapterId);
        if (!chapter) return false;

        return chapter.scenarioIds.every((id) =>
          state.completedScenarios.includes(id),
        );
      },

      getCurrentChapterScenarios: () => {
        const state = get();
        const chapter = state.chapters.find(
          (c) => c.id === state.currentChapter,
        );
        return chapter ? chapter.scenarioIds : [];
      },

      getNextUncompletedScenario: () => {
        const state = get();
        const chapter = state.chapters.find(
          (c) => c.id === state.currentChapter,
        );
        if (!chapter) return null;

        return (
          chapter.scenarioIds.find(
            (id) => !state.completedScenarios.includes(id),
          ) ?? null
        );
      },

      // ── Achievements ────────────────────────────────────────────────────────

      checkAchievements: (playerStore, portfolioStore) => {
        const state = get();
        const newlyUnlocked: Achievement[] = [];
        const portfolioValue = portfolioStore.getTotalValue();

        const updated = state.achievements.map((achievement) => {
          if (achievement.unlockedAt) return achievement;

          let met = false;
          const { type, value, specificId } = achievement.condition;

          switch (type) {
            case "streak":
              met = playerStore.streak >= value;
              break;
            case "scenarios-survived":
              met = playerStore.survived >= value;
              break;
            case "scenarios-completed":
              met = playerStore.completedScenarios.length >= value;
              break;
            case "portfolio-value":
              met = portfolioValue >= value;
              break;
            case "chapter-complete":
              if (value === 5) {
                met = [1, 2, 3, 4, 5].every((id) =>
                  get().isChapterComplete(id),
                );
              } else {
                met = get().isChapterComplete(value);
              }
              break;
            case "level-reached":
              met = playerStore.level >= value;
              break;
            case "gear-collected":
              met = playerStore.unlockedGear.length >= value;
              break;
            case "specific-action":
              // Specific actions are unlocked via unlockAchievement() directly
              break;
            case "scams-caught":
              met = playerStore.survived >= value;
              break;
          }

          if (met) {
            const unlocked = {
              ...achievement,
              unlockedAt: new Date().toISOString(),
            };
            newlyUnlocked.push(unlocked);
            return unlocked;
          }

          return achievement;
        });

        if (newlyUnlocked.length > 0) {
          set({ achievements: updated });
        }

        return newlyUnlocked;
      },

      unlockAchievement: (achievementId) => {
        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.id === achievementId && !a.unlockedAt
              ? { ...a, unlockedAt: new Date().toISOString() }
              : a,
          ),
        }));
      },

      getUnlockedAchievements: () => {
        return get().achievements.filter((a) => a.unlockedAt);
      },

      getLockedAchievements: () => {
        return get().achievements.filter((a) => !a.unlockedAt);
      },

      // ── Streaks ─────────────────────────────────────────────────────────────

      checkStreakMilestones: (currentStreak) => {
        return get().streakMilestones.filter(
          (m) => !m.claimed && currentStreak >= m.days,
        );
      },

      claimStreakReward: (milestoneDay) => {
        const state = get();
        const milestone = state.streakMilestones.find(
          (m) => m.days === milestoneDay,
        );
        if (!milestone || milestone.claimed) return null;

        set({
          streakMilestones: state.streakMilestones.map((m) =>
            m.days === milestoneDay ? { ...m, claimed: true } : m,
          ),
        });

        return { ...milestone.reward };
      },

      // ── Game Day ────────────────────────────────────────────────────────────

      advanceGameDay: () => {
        set((s) => ({ gameDay: s.gameDay + 1 }));
      },

      getDayInChapter: () => {
        const state = get();
        // Sum scenario counts from all previous chapters
        let daysBefore = 0;
        for (const ch of state.chapters) {
          if (ch.id >= state.currentChapter) break;
          daysBefore += ch.scenarioIds.length;
        }
        return state.gameDay - daysBefore;
      },

      // ── NPC ─────────────────────────────────────────────────────────────────

      updateNPCRelationship: (npcId, delta) => {
        set((s) => ({
          npcRelationships: {
            ...s.npcRelationships,
            [npcId]: (s.npcRelationships[npcId] ?? 0) + delta,
          },
        }));
      },

      getNPCRelationship: (npcId) => {
        return get().npcRelationships[npcId] ?? 0;
      },

      // ── Post-Game ───────────────────────────────────────────────────────────

      checkGameCompletion: () => {
        const state = get();
        const allComplete = [1, 2, 3, 4, 5].every((id) =>
          state.isChapterComplete(id),
        );

        if (allComplete && !state.hasCompletedGame) {
          set({
            hasCompletedGame: true,
            scannerUnlocked: true,
            threatFeedUnlocked: true,
          });
        }
      },

      unlockScanner: () => set({ scannerUnlocked: true }),
      unlockThreatFeed: () => set({ threatFeedUnlocked: true }),

      // ── Reset ───────────────────────────────────────────────────────────────

      resetGame: () =>
        set({
          ...INITIAL_STATE,
          achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
          streakMilestones: DEFAULT_STREAK_MILESTONES.map((m) => ({ ...m })),
          npcRelationships: { sensei: 0, rick: 0, wendy: 0, sam: 0, bot: 0 },
        }),
    }),
    {
      name: "rekt-game-storage",
      storage: createJSONStorage(() =>
        Platform.OS === "web" ? localStorage : AsyncStorage,
      ),
    },
  ),
);

// ── Exported Constants ──────────────────────────────────────────────────────────

export { CHAPTERS, DEFAULT_ACHIEVEMENTS, DEFAULT_STREAK_MILESTONES };
