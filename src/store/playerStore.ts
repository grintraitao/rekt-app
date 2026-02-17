import { create } from "zustand";

export type PlayerClass = "ape" | "analyst" | "shadow" | "degen";

export type Achievement = {
  id: string;
  emoji: string;
  name: string;
  unlocked: boolean;
};

type PlayerState = {
  selectedClass: PlayerClass;
  username: string;
  setClass: (cls: PlayerClass) => void;

  // Daily reward / streak
  streak: number;
  lastClaimDate: string; // ISO date string, e.g. "2026-02-17"
  canClaimToday: () => boolean;
  claimDailyReward: () => void;
  resetStreak: () => void;

  // XP & rewards
  xp: number;
  securityTokens: number;
  completedScenarios: string[];
  addXp: (amount: number) => void;
  addSecurityTokens: (amount: number) => void;
  completeScenario: (scenarioId: string) => void;

  // Record
  survived: number;
  rektCount: number;
  recordSurvive: () => void;
  recordRekt: () => void;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function wasYesterday(dateStr: string): boolean {
  if (!dateStr) return false;
  const last = new Date(dateStr + "T00:00:00");
  const today = new Date(todayISO() + "T00:00:00");
  const diff = today.getTime() - last.getTime();
  return diff === 86_400_000; // exactly 1 day
}

// ── Level helpers ──────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 250;

export function getLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getLevelProgress(xp: number): {
  level: number;
  current: number;
  required: number;
  pct: number;
} {
  const level = getLevel(xp);
  const base = (level - 1) * XP_PER_LEVEL;
  const current = xp - base;
  return { level, current, required: XP_PER_LEVEL, pct: (current / XP_PER_LEVEL) * 100 };
}

export const CLASS_META: Record<
  PlayerClass,
  { emoji: string; name: string }
> = {
  ape: { emoji: "🐵", name: "The Ape" },
  analyst: { emoji: "🧠", name: "The Analyst" },
  shadow: { emoji: "🥷", name: "The Shadow" },
  degen: { emoji: "🎲", name: "The Degen" },
};

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

// ── Store ──────────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerState>((set, get) => ({
  selectedClass: "ape",
  username: "ApeKing_VN",
  setClass: (cls) => set({ selectedClass: cls }),

  streak: 13,
  lastClaimDate: "",

  canClaimToday: () => {
    const { lastClaimDate } = get();
    return lastClaimDate !== todayISO();
  },

  claimDailyReward: () => {
    const { lastClaimDate, streak } = get();
    const today = todayISO();
    if (lastClaimDate === today) return; // already claimed

    const newStreak = wasYesterday(lastClaimDate) ? streak + 1 : 1;
    set({ streak: newStreak, lastClaimDate: today });
  },

  resetStreak: () => set({ streak: 0 }),

  // XP & rewards
  xp: 0,
  securityTokens: 0,
  completedScenarios: [],

  addXp: (amount) => set((s) => ({ xp: s.xp + amount })),

  addSecurityTokens: (amount) =>
    set((s) => ({ securityTokens: s.securityTokens + amount })),

  completeScenario: (scenarioId) =>
    set((s) => ({
      completedScenarios: s.completedScenarios.includes(scenarioId)
        ? s.completedScenarios
        : [...s.completedScenarios, scenarioId],
    })),

  // Record
  survived: 18,
  rektCount: 3,
  recordSurvive: () => set((s) => ({ survived: s.survived + 1 })),
  recordRekt: () => set((s) => ({ rektCount: s.rektCount + 1 })),
}));
