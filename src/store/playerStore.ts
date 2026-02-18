import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ── Type Definitions ────────────────────────────────────────────────────────────

export type PlayerClass = "ape" | "analyst" | "shadow" | "degen";

export interface ClassConfig {
  id: PlayerClass;
  name: string;
  emoji: string;
  description: string;
  startingBonus: string;
  weakness: string;
  uniqueAbility: string;
  statModifiers: {
    security: number;
    detection: number;
    wealth: number;
    knowledge: number;
    hp: number;
  };
}

export interface PlayerStats {
  security: number;
  detection: number;
  wealth: number;
  knowledge: number;
  hp: number;
}

export type Achievement = {
  id: string;
  emoji: string;
  name: string;
  unlocked: boolean;
};

export interface PlayerState {
  // Identity
  username: string;
  playerClass: PlayerClass | null;
  hasOnboarded: boolean;

  // Progression
  level: number;
  xp: number;
  xpToNextLevel: number;
  title: string;

  // Stats
  stats: PlayerStats;

  // Resources
  coins: number;
  securityTokens: number;
  reputation: number;

  // Streak
  streak: number;
  lastClaimDate: string | null;

  // Gear
  equippedGear: string[];
  unlockedGear: string[];

  // Abilities
  abilityUsesRemaining: number;
  diamondHandsUsed: boolean;

  // Record (scenario tracking)
  survived: number;
  rektCount: number;
  completedScenarios: string[];
}

interface PlayerActions {
  // Setup
  setUsername: (name: string) => void;
  selectClass: (playerClass: PlayerClass) => void;
  completeOnboarding: () => void;

  // XP & Leveling
  addXP: (amount: number) => void;
  levelUp: () => void;

  // Stats
  updateStat: (stat: keyof PlayerStats, amount: number) => void;
  takeDamage: (amount: number) => void;
  healHP: (amount: number) => void;
  isGameOver: () => boolean;

  // Resources
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addSecurityTokens: (amount: number) => void;
  addReputation: (amount: number) => void;

  // Streak
  claimDailyReward: () => void;
  breakStreak: () => void;
  getStreakBonus: () => number;

  // Gear
  equipGear: (gearId: string) => void;
  unequipGear: (gearId: string) => void;
  unlockGear: (gearId: string) => void;

  // Abilities
  useAbility: () => void;
  resetDailyAbilities: () => void;

  // Record
  recordSurvive: () => void;
  recordRekt: () => void;
  completeScenario: (scenarioId: string) => void;

  // Reset
  resetAll: () => void;
}

// ── Class Configurations ────────────────────────────────────────────────────────

export const CLASS_CONFIGS: Record<PlayerClass, ClassConfig> = {
  ape: {
    id: "ape",
    name: "The Ape",
    emoji: "🐵",
    description: "Fast portfolio growth, but falls for FOMO scams easily.",
    startingBonus: "Fast portfolio growth",
    weakness: "Falls for FOMO scams",
    uniqueAbility: "Diamond Hands — survive one rug",
    statModifiers: { security: -5, detection: -10, wealth: 15, knowledge: 0, hp: 0 },
  },
  analyst: {
    id: "analyst",
    name: "The Analyst",
    emoji: "🧠",
    description: "High detection and knowledge, but slower portfolio growth.",
    startingBonus: "High detection",
    weakness: "Slower growth",
    uniqueAbility: "Deep Dive — 2 free inspections/day",
    statModifiers: { security: 5, detection: 15, wealth: -10, knowledge: 5, hp: 0 },
  },
  shadow: {
    id: "shadow",
    name: "The Shadow",
    emoji: "🥷",
    description: "Balanced stats with slight edges in security and HP.",
    startingBonus: "Balanced",
    weakness: "No specialty",
    uniqueAbility: "Incognito — blocks some social scams",
    statModifiers: { security: 5, detection: 5, wealth: 0, knowledge: 0, hp: 5 },
  },
  degen: {
    id: "degen",
    name: "The Degen",
    emoji: "🎲",
    description: "Extreme swings with high wealth and HP, but poor security.",
    startingBonus: "Extreme swings",
    weakness: "Unpredictable",
    uniqueAbility: "Gut Feeling — random auto-detect",
    statModifiers: { security: -10, detection: -5, wealth: 10, knowledge: 0, hp: 10 },
  },
};

// ── Exported Helpers (used by screens) ───────────────────────────────────────────

export const CLASS_META: Record<PlayerClass, { emoji: string; name: string }> = {
  ape: { emoji: "🐵", name: "The Ape" },
  analyst: { emoji: "🧠", name: "The Analyst" },
  shadow: { emoji: "🥷", name: "The Shadow" },
  degen: { emoji: "🎲", name: "The Degen" },
};

const XP_PER_LEVEL = 300;

export function getLevel(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (remaining >= level * XP_PER_LEVEL && level < 30) {
    remaining -= level * XP_PER_LEVEL;
    level += 1;
  }
  return level;
}

export function getLevelProgress(xp: number): {
  level: number;
  current: number;
  required: number;
  pct: number;
} {
  let level = 1;
  let remaining = xp;
  while (remaining >= level * XP_PER_LEVEL && level < 30) {
    remaining -= level * XP_PER_LEVEL;
    level += 1;
  }
  const required = level * XP_PER_LEVEL;
  return { level, current: remaining, required, pct: (remaining / required) * 100 };
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first-survive", emoji: "🛡️", name: "First Survive", unlocked: false },
  { id: "first-rekt", emoji: "💀", name: "First REKT", unlocked: false },
  { id: "week-streak", emoji: "🔥", name: "One Week Streak", unlocked: false },
  { id: "five-survived", emoji: "⭐", name: "5 Survived", unlocked: false },
  { id: "ten-survived", emoji: "🏆", name: "10 Survived", unlocked: false },
  { id: "token-hoarder", emoji: "💎", name: "Token Hoarder", unlocked: false },
];

export function getAchievements(state: {
  survived: number;
  rektCount: number;
  streak: number;
  securityTokens: number;
}): Achievement[] {
  return ALL_ACHIEVEMENTS.map((a) => {
    let unlocked = false;
    if (a.id === "first-survive") unlocked = state.survived >= 1;
    if (a.id === "first-rekt") unlocked = state.rektCount >= 1;
    if (a.id === "week-streak") unlocked = state.streak >= 7;
    if (a.id === "five-survived") unlocked = state.survived >= 5;
    if (a.id === "ten-survived") unlocked = state.survived >= 10;
    if (a.id === "token-hoarder") unlocked = state.securityTokens >= 10;
    return { ...a, unlocked };
  });
}

// ── Internal Helpers ─────────────────────────────────────────────────────────────

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

function getTitleForLevel(level: number): string {
  if (level <= 5) return "NOOB";
  if (level <= 10) return "TRADER";
  if (level <= 15) return "COLLECTOR";
  if (level <= 20) return "FARMER";
  if (level <= 25) return "VETERAN";
  return "SURVIVOR";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_STATS: PlayerStats = {
  security: 20,
  detection: 20,
  wealth: 20,
  knowledge: 10,
  hp: 100,
};

const INITIAL_STATE: PlayerState = {
  username: "",
  playerClass: null,
  hasOnboarded: false,

  level: 1,
  xp: 0,
  xpToNextLevel: 300,
  title: "NOOB",

  stats: { ...DEFAULT_STATS },

  coins: 10000,
  securityTokens: 0,
  reputation: 0,

  streak: 0,
  lastClaimDate: null,

  equippedGear: ["paper-wallet"],
  unlockedGear: ["paper-wallet"],

  abilityUsesRemaining: 0,
  diamondHandsUsed: false,

  survived: 0,
  rektCount: 0,
  completedScenarios: [],
};

// ── Store ────────────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Setup ───────────────────────────────────────────────────────────────

      setUsername: (name) => set({ username: name }),

      selectClass: (playerClass) => {
        const config = CLASS_CONFIGS[playerClass];
        const mods = config.statModifiers;
        set((s) => ({
          playerClass,
          stats: {
            security: clamp(s.stats.security + mods.security, 0, 100),
            detection: clamp(s.stats.detection + mods.detection, 0, 100),
            wealth: clamp(s.stats.wealth + mods.wealth, 0, 100),
            knowledge: clamp(s.stats.knowledge + mods.knowledge, 0, 100),
            hp: clamp(s.stats.hp + mods.hp, 0, 100),
          },
          abilityUsesRemaining: playerClass === "analyst" ? 2 : 1,
        }));
      },

      completeOnboarding: () => set({ hasOnboarded: true }),

      // ── XP & Leveling ──────────────────────────────────────────────────────

      addXP: (amount) => {
        set((s) => {
          let xp = s.xp + amount;
          let level = s.level;
          let xpToNextLevel = s.xpToNextLevel;
          let title = s.title;

          while (xp >= xpToNextLevel && level < 30) {
            xp -= xpToNextLevel;
            level += 1;
            xpToNextLevel = level * 300;
            title = getTitleForLevel(level);
          }

          if (level >= 30) {
            xp = Math.min(xp, 0);
            xpToNextLevel = 0;
          }

          return { xp, level, xpToNextLevel, title };
        });
      },

      levelUp: () => {
        set((s) => {
          if (s.level >= 30) return s;
          const newLevel = s.level + 1;
          return {
            level: newLevel,
            xpToNextLevel: newLevel * 300,
            title: getTitleForLevel(newLevel),
          };
        });
      },

      // ── Stats ──────────────────────────────────────────────────────────────

      updateStat: (stat, amount) => {
        set((s) => ({
          stats: {
            ...s.stats,
            [stat]: clamp(s.stats[stat] + amount, 0, 100),
          },
        }));
      },

      takeDamage: (amount) => {
        set((s) => ({
          stats: {
            ...s.stats,
            hp: clamp(s.stats.hp - amount, 0, 100),
          },
        }));
      },

      healHP: (amount) => {
        set((s) => ({
          stats: {
            ...s.stats,
            hp: clamp(s.stats.hp + amount, 0, 100),
          },
        }));
      },

      isGameOver: () => get().stats.hp <= 0,

      // ── Resources ──────────────────────────────────────────────────────────

      addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),

      spendCoins: (amount) => {
        const { coins } = get();
        if (coins < amount) return false;
        set({ coins: coins - amount });
        return true;
      },

      addSecurityTokens: (amount) =>
        set((s) => ({ securityTokens: s.securityTokens + amount })),

      addReputation: (amount) =>
        set((s) => ({ reputation: s.reputation + amount })),

      // ── Streak ─────────────────────────────────────────────────────────────

      claimDailyReward: () => {
        const { lastClaimDate, streak } = get();
        const today = todayISO();
        if (lastClaimDate === today) return;

        set({ streak: streak + 1, lastClaimDate: today });
      },

      breakStreak: () => set({ streak: 0 }),

      getStreakBonus: () => {
        const { streak } = get();
        if (streak >= 100) return 3.0;
        if (streak >= 30) return 2.0;
        if (streak >= 14) return 1.75;
        if (streak >= 7) return 1.5;
        if (streak >= 3) return 1.25;
        return 1.0;
      },

      // ── Gear ───────────────────────────────────────────────────────────────

      equipGear: (gearId) => {
        set((s) => {
          if (!s.unlockedGear.includes(gearId)) return s;
          if (s.equippedGear.includes(gearId)) return s;
          return { equippedGear: [...s.equippedGear, gearId] };
        });
      },

      unequipGear: (gearId) => {
        set((s) => ({
          equippedGear: s.equippedGear.filter((id) => id !== gearId),
        }));
      },

      unlockGear: (gearId) => {
        set((s) => {
          if (s.unlockedGear.includes(gearId)) return s;
          return { unlockedGear: [...s.unlockedGear, gearId] };
        });
      },

      // ── Abilities ──────────────────────────────────────────────────────────

      useAbility: () => {
        set((s) => {
          if (s.abilityUsesRemaining <= 0) return s;
          return { abilityUsesRemaining: s.abilityUsesRemaining - 1 };
        });
      },

      resetDailyAbilities: () => {
        const { playerClass } = get();
        set({ abilityUsesRemaining: playerClass === "analyst" ? 2 : 1 });
      },

      // ── Record ──────────────────────────────────────────────────────────────

      recordSurvive: () => set((s) => ({ survived: s.survived + 1 })),
      recordRekt: () => set((s) => ({ rektCount: s.rektCount + 1 })),
      completeScenario: (scenarioId) =>
        set((s) => ({
          completedScenarios: s.completedScenarios.includes(scenarioId)
            ? s.completedScenarios
            : [...s.completedScenarios, scenarioId],
        })),

      // ── Reset ──────────────────────────────────────────────────────────────

      resetAll: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: "rekt-player-storage",
      storage: createJSONStorage(() =>
        Platform.OS === "web" ? localStorage : AsyncStorage,
      ),
    },
  ),
);
