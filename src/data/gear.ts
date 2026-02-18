/**
 * Gear definitions — all 9 gear items with full metadata for
 * the gear system, shop, and engine calculations.
 */

import type { ScamCategory } from "../store/scenarioStore";

// ── Types ────────────────────────────────────────────────────────────────────────

export type GearSlot = "wallet" | "utility" | "scanner" | "shield" | "companion";

export interface GearItemDef {
  id: string;
  name: string;
  emoji: string;
  slot: GearSlot;
  description: string;
  gameEffect: string;
  realWorldEquivalent: string;
  unlockCondition: {
    type: "default" | "level" | "purchase" | "achievement" | "chapter";
    value?: number;
    cost?: { currency: "coins" | "securityTokens"; amount: number };
  };
  effects: {
    damageReduction?: number;
    autoDetectChance?: number;
    bonusClueTypes?: string[];
    blockScamTypes?: ScamCategory[];
    portfolioProtection?: number;
    dailyUses?: number;
  };
}

// ── Gear Definitions ─────────────────────────────────────────────────────────────

export const GEAR_ITEMS: GearItemDef[] = [
  // 1. Paper Wallet — DEFAULT starter gear
  {
    id: "paper-wallet",
    name: "Paper Wallet",
    emoji: "\uD83D\uDCC4",
    slot: "wallet",
    description: "A simple paper backup for your seed phrase.",
    gameEffect: "-5% damage from scams",
    realWorldEquivalent: "Writing your seed phrase on paper and storing it safely",
    unlockCondition: { type: "default" },
    effects: {
      damageReduction: 5,
    },
  },

  // 2. Hardware Wallet — level 10
  {
    id: "hardware-wallet",
    name: "Hardware Wallet",
    emoji: "\uD83D\uDD12",
    slot: "wallet",
    description: "Physical device that blocks remote approvals.",
    gameEffect: "-15% damage, blocks remote approval scams",
    realWorldEquivalent: "Ledger, Trezor — signs transactions on-device only",
    unlockCondition: { type: "level", value: 10 },
    effects: {
      damageReduction: 15,
      blockScamTypes: ["smart-contract"],
    },
  },

  // 3. Bookmark Bar — level 5 OR 14-day streak
  {
    id: "bookmark-bar",
    name: "Bookmark Bar",
    emoji: "\uD83D\uDD16",
    slot: "utility",
    description: "Saves verified URLs so you never visit fakes.",
    gameEffect: "30% chance to auto-detect fake URLs (phishing)",
    realWorldEquivalent: "Bookmarking official DEX/exchange URLs in your browser",
    unlockCondition: { type: "level", value: 5 },
    effects: {
      autoDetectChance: 0.3,
      blockScamTypes: ["phishing"],
    },
  },

  // 4. Contract Reader — level 15
  {
    id: "contract-reader",
    name: "Contract Reader",
    emoji: "\uD83D\uDD0D",
    slot: "scanner",
    description: "Reveals hidden functions in smart contracts.",
    gameEffect: "Reveals hidden contract functions as bonus clues",
    realWorldEquivalent: "Reading contract source code on Etherscan before interacting",
    unlockCondition: { type: "level", value: 15 },
    effects: {
      bonusClueTypes: ["check-contract", "hidden-function"],
    },
  },

  // 5. 2FA Shield — purchase 30 security tokens
  {
    id: "2fa-shield",
    name: "2FA Shield",
    emoji: "\uD83D\uDD10",
    slot: "shield",
    description: "Two-factor authentication layer for all accounts.",
    gameEffect: "50% chance to block account takeover (social-engineering) scams",
    realWorldEquivalent: "Enabling 2FA on all exchange and wallet accounts",
    unlockCondition: {
      type: "purchase",
      cost: { currency: "securityTokens", amount: 30 },
    },
    effects: {
      autoDetectChance: 0.5,
      blockScamTypes: ["social-engineering"],
      damageReduction: 10,
    },
  },

  // 6. Revoke Tool — level 12
  {
    id: "revoke-tool",
    name: "Revoke Tool",
    emoji: "\u2699\uFE0F",
    slot: "utility",
    description: "Undo one token approval per day.",
    gameEffect: "Undo 1 approval per day",
    realWorldEquivalent: "Using revoke.cash to remove old token approvals",
    unlockCondition: { type: "level", value: 12 },
    effects: {
      dailyUses: 1,
      damageReduction: 15,
    },
  },

  // 7. Security Bot — purchase 50 security tokens
  {
    id: "security-bot",
    name: "Security Bot",
    emoji: "\uD83E\uDD16",
    slot: "companion",
    description: "AI companion that sends random scam warnings.",
    gameEffect: "20% chance to warn about any incoming scam",
    realWorldEquivalent: "Wallet security alerts and monitoring services",
    unlockCondition: {
      type: "purchase",
      cost: { currency: "securityTokens", amount: 50 },
    },
    effects: {
      autoDetectChance: 0.2,
      damageReduction: 5,
    },
  },

  // 8. Cold Storage — level 20
  {
    id: "cold-storage",
    name: "Cold Storage",
    emoji: "\u2744\uFE0F",
    slot: "wallet",
    description: "Keeps 50% of your portfolio untouchable by scams.",
    gameEffect: "50% of portfolio is protected when rekt",
    realWorldEquivalent: "Keeping most funds in a cold wallet, only hot wallet for daily use",
    unlockCondition: { type: "level", value: 20 },
    effects: {
      portfolioProtection: 50,
      damageReduction: 25,
    },
  },

  // 9. Burner Wallet — chapter 3 completion
  {
    id: "burner-wallet",
    name: "Burner Wallet",
    emoji: "\uD83D\uDD25",
    slot: "utility",
    description: "Disposable wallet for safe contract interactions.",
    gameEffect: "40% chance to block approval-based scams",
    realWorldEquivalent: "Using a separate wallet with minimal funds for new dApps",
    unlockCondition: { type: "chapter", value: 3 },
    effects: {
      autoDetectChance: 0.4,
      blockScamTypes: ["smart-contract"],
      damageReduction: 40,
    },
  },
];

// ── Lookup helpers ───────────────────────────────────────────────────────────────

const GEAR_MAP = new Map(GEAR_ITEMS.map((g) => [g.id, g]));

export function getGearById(id: string): GearItemDef | undefined {
  return GEAR_MAP.get(id);
}
