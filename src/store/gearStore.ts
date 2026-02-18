import { create } from "zustand";

// ── Types ────────────────────────────────────────────────────────────────────

export type GearSlot =
  | "Wallet"
  | "Utility"
  | "Scanner"
  | "Shield"
  | "Companion";

export type GearItem = {
  id: string;
  icon: string;
  name: string;
  slot: GearSlot;
  description: string;
  effect: string;
  unlocked: boolean;
  /** If locked, describe how to unlock */
  unlockHint?: string;
  /** Level required to unlock (0 = available immediately) */
  unlockLevel: number;
  /** Token cost to purchase (0 = free / level-gated) */
  tokenCost: number;
};

type GearState = {
  equippedIds: string[];
  allGear: GearItem[];

  equippedGear: () => GearItem[];
  availableGear: () => GearItem[];
  equippedCount: () => number;

  equipGear: (id: string) => void;
  unequipGear: (id: string) => void;
  toggleGear: (id: string) => void;
};

// ── Default gear data ────────────────────────────────────────────────────────

const DEFAULT_GEAR: GearItem[] = [
  // Sprint 1 starter gear (unlocked)
  {
    id: "paper-wallet",
    icon: "📄",
    name: "Paper Wallet",
    slot: "Wallet",
    description: "A simple paper backup for your seed phrase.",
    effect: "Basic protection",
    unlocked: true,
    unlockLevel: 0,
    tokenCost: 0,
  },
  {
    id: "bookmark-bar",
    icon: "🔖",
    name: "Bookmark Bar",
    slot: "Utility",
    description: "Saves verified URLs so you never visit fakes.",
    effect: "Auto-detects fake URLs",
    unlocked: true,
    unlockLevel: 0,
    tokenCost: 0,
  },
  {
    id: "2fa-shield",
    icon: "🔐",
    name: "2FA Shield",
    slot: "Shield",
    description: "Two-factor authentication layer for all accounts.",
    effect: "Blocks account takeover",
    unlocked: true,
    unlockLevel: 0,
    tokenCost: 0,
  },

  // Locked gear (future unlocks)
  {
    id: "hardware-wallet",
    icon: "🔒",
    name: "Hardware Wallet",
    slot: "Wallet",
    description: "Physical device that blocks remote approvals.",
    effect: "Blocks remote approvals",
    unlocked: false,
    unlockHint: "Unlocks at Level 10",
    unlockLevel: 10,
    tokenCost: 0,
  },
  {
    id: "contract-reader",
    icon: "🔒",
    name: "Contract Reader",
    slot: "Scanner",
    description: "Reveals hidden functions in smart contracts.",
    effect: "Shows hidden functions",
    unlocked: false,
    unlockHint: "Unlocks at Level 15",
    unlockLevel: 15,
    tokenCost: 0,
  },
  {
    id: "revoke-tool",
    icon: "🔒",
    name: "Revoke Tool",
    slot: "Utility",
    description: "Undo one token approval per day.",
    effect: "Undo 1 approval/day",
    unlocked: false,
    unlockHint: "Buy with 50 🛡️ tokens",
    unlockLevel: 0,
    tokenCost: 50,
  },
  {
    id: "security-bot",
    icon: "🔒",
    name: "Security Bot",
    slot: "Companion",
    description: "AI companion that sends random scam warnings.",
    effect: "Random scam warnings",
    unlocked: false,
    unlockHint: "Unlocks at Level 20",
    unlockLevel: 20,
    tokenCost: 0,
  },
  {
    id: "cold-storage",
    icon: "🔒",
    name: "Cold Storage",
    slot: "Wallet",
    description: "Keeps 50% of your portfolio untouchable by scams.",
    effect: "50% portfolio untouchable",
    unlocked: false,
    unlockHint: "Unlocks at Level 25",
    unlockLevel: 25,
    tokenCost: 0,
  },
  {
    id: "burner-wallet",
    icon: "🔒",
    name: "Burner Wallet",
    slot: "Utility",
    description: "Disposable wallet for safe contract interactions.",
    effect: "Safe contract interaction",
    unlocked: false,
    unlockHint: "Buy with 100 🛡️ tokens",
    unlockLevel: 0,
    tokenCost: 100,
  },
];

const DEFAULT_EQUIPPED = ["paper-wallet", "bookmark-bar", "2fa-shield"];

// ── Store ────────────────────────────────────────────────────────────────────

export const useGearStore = create<GearState>((set, get) => ({
  equippedIds: DEFAULT_EQUIPPED,
  allGear: DEFAULT_GEAR,

  equippedGear: () => {
    const { equippedIds, allGear } = get();
    return allGear.filter((g) => equippedIds.includes(g.id));
  },

  availableGear: () => {
    const { equippedIds, allGear } = get();
    return allGear.filter((g) => !equippedIds.includes(g.id));
  },

  equippedCount: () => get().equippedIds.length,

  equipGear: (id) =>
    set((s) => {
      const item = s.allGear.find((g) => g.id === id);
      if (!item || !item.unlocked || s.equippedIds.includes(id)) return s;
      return { equippedIds: [...s.equippedIds, id] };
    }),

  unequipGear: (id) =>
    set((s) => ({
      equippedIds: s.equippedIds.filter((eid) => eid !== id),
    })),

  toggleGear: (id) => {
    const { equippedIds } = get();
    if (equippedIds.includes(id)) {
      get().unequipGear(id);
    } else {
      get().equipGear(id);
    }
  },
}));
