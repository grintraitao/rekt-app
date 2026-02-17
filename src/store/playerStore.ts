import { create } from "zustand";

export type PlayerClass = "ape" | "analyst" | "shadow" | "degen";

type PlayerState = {
  selectedClass: PlayerClass;
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

export const usePlayerStore = create<PlayerState>((set, get) => ({
  selectedClass: "ape",
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
}));
