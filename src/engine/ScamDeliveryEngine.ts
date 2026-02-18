/**
 * ScamDeliveryEngine — decides WHEN and HOW scams appear to the player.
 *
 * Scams are injected into the same channels as legitimate activity so they
 * feel organic: notifications, activity feed, DMs, and approval popups.
 */

import type { Token, Transaction } from "../store/portfolioStore";
import type {
  DeliveryChannel,
  ScamCategory,
  ScenarioDefinition,
} from "../store/scenarioStore";
import { CHAPTERS } from "../store/gameStore";
import { ScenarioEngine } from "./ScenarioEngine";
import {
  generateLegitNotification,
  generateScamNotification,
} from "./NotificationGenerator";

// ── Helpers ──────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function relativeTimestamp(minutesAgo: number): string {
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Class weakness → scam-category mapping (for scenario weighting) ──────────

const CLASS_WEAKNESS_CATEGORIES: Record<string, ScamCategory[]> = {
  ape: ["rug-pull", "honeypot"],
  analyst: ["social-engineering"],
  shadow: ["social-engineering"],
  degen: ["honeypot", "rug-pull", "smart-contract"],
};

// ── Notification type used by the delivery engine ────────────────────────────────

export interface DeliveryNotification {
  id: string;
  type: "legit" | "scam";
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  timestamp: string;
  isRead: boolean;
  linkedScenarioId?: string;
}

// ── Legit activity-feed templates ────────────────────────────────────────────────

const LEGIT_TX_FACTORIES: Array<(holdings: Token[]) => Omit<Transaction, "id">> = [
  // Staking reward
  (holdings) => {
    const eth = holdings.find((t) => t.symbol === "ETH");
    const amount = eth ? round2(eth.pricePerUnit * 0.008) : randInt(5, 30);
    return {
      type: "staking-reward",
      label: "Staking reward",
      sublabel: `+$${amount.toFixed(2)} ETH`,
      amount,
      timestamp: new Date(Date.now() - randInt(1, 72) * 3600_000).toISOString(),
      isSuspicious: false,
    };
  },

  // Swap
  (holdings) => {
    const usdcAmt = randInt(20, 300);
    const eth = holdings.find((t) => t.symbol === "ETH");
    const ethPrice = eth?.pricePerUnit ?? 2800;
    const ethAmt = round2(usdcAmt / ethPrice);
    return {
      type: "swap",
      label: "Swap",
      sublabel: `${usdcAmt} USDC \u2192 ${ethAmt} ETH`,
      amount: usdcAmt,
      timestamp: new Date(Date.now() - randInt(1, 48) * 3600_000).toISOString(),
      isSuspicious: false,
    };
  },

  // Receive
  () => {
    const amount = randInt(10, 500);
    return {
      type: "received",
      label: "Received",
      sublabel: `+$${amount} USDC from 0x...${randInt(1000, 9999)}`,
      amount,
      timestamp: new Date(Date.now() - randInt(2, 96) * 3600_000).toISOString(),
      isSuspicious: false,
    };
  },

  // Send
  () => {
    const amount = randInt(5, 200);
    return {
      type: "sent",
      label: "Sent",
      sublabel: `-$${amount} USDC to 0x...${randInt(1000, 9999)}`,
      amount: -amount,
      timestamp: new Date(Date.now() - randInt(4, 120) * 3600_000).toISOString(),
      isSuspicious: false,
    };
  },

  // Investment return
  () => {
    const amount = round2(randInt(5, 50) + Math.random());
    return {
      type: "investment-return",
      label: "Yield earned",
      sublabel: `+$${amount.toFixed(2)} from staking pool`,
      amount,
      timestamp: new Date(Date.now() - randInt(6, 72) * 3600_000).toISOString(),
      isSuspicious: false,
    };
  },
];

// ── Suspicious activity-feed templates ───────────────────────────────────────────

const SUSPICIOUS_TX_FACTORIES: Array<() => Omit<Transaction, "id">> = [
  // Unknown token airdrop
  () => {
    const token = pick(["PEPE2.0", "FREE-ETH", "CLAIM-ME", "BONUS-UNI"]);
    return {
      type: "airdrop",
      label: `Received ${token}`,
      sublabel: "Unknown sender \u2014 do not interact",
      amount: 0,
      timestamp: new Date(Date.now() - randInt(1, 24) * 3600_000).toISOString(),
      isSuspicious: true,
    };
  },

  // Dust attack
  () => ({
    type: "dust-attack",
    label: "Dust received",
    sublabel: `0.0001 ${pick(["ETH", "BNB", "MATIC"])} from unknown address`,
    amount: 0.01,
    timestamp: new Date(Date.now() - randInt(2, 48) * 3600_000).toISOString(),
    isSuspicious: true,
  }),

  // Claim-now item
  () => ({
    type: "airdrop",
    label: "Reward available",
    sublabel: `Claim ${randInt(100, 5000)} tokens \u2014 tap to collect`,
    amount: 0,
    timestamp: new Date(Date.now() - randInt(1, 12) * 3600_000).toISOString(),
    isSuspicious: true,
  }),
];

// ── Engine ───────────────────────────────────────────────────────────────────────

export class ScamDeliveryEngine {
  /**
   * Generate a mix of legit + scam notifications for the player.
   *
   * Rules:
   * - 4-8 notifications total
   * - ~60% legit, ~40% scam (shifts toward more scam in later chapters)
   * - Scam notifications link to UNCOMPLETED scenarios only
   * - Randomized order (no clustering)
   */
  static generateNotifications(
    chapter: number,
    completedScenarios: string[],
    gameDay: number,
  ): DeliveryNotification[] {
    const total = randInt(4, 8);

    // Scam ratio: base 40%, +5% per chapter past ch1
    const scamRatio = Math.min(0.6, 0.4 + (chapter - 1) * 0.05);
    const scamCount = Math.round(total * scamRatio);
    const legitCount = total - scamCount;

    // ── Legit notifications ──────────────────────────────────────────────
    const legits: DeliveryNotification[] = [];
    const emptyHoldings: Token[] = [
      {
        id: "eth",
        name: "Ethereum",
        symbol: "ETH",
        emoji: "\u039E",
        iconColor: "#627eea",
        amount: 2.5,
        pricePerUnit: 2800,
        dailyChangePct: 3,
        riskLevel: "low",
        scamExposure: "low",
        isScamToken: false,
        isSuspicious: false,
      },
    ];

    for (let i = 0; i < legitCount; i++) {
      const tpl = generateLegitNotification(emptyHoldings);
      legits.push({
        id: `notif-legit-${generateId()}`,
        type: "legit",
        title: tpl.title,
        subtitle: tpl.subtitle,
        icon: tpl.icon,
        iconBg: tpl.iconBg,
        timestamp: relativeTimestamp(randInt(5, 60 * 24 * gameDay)),
        isRead: Math.random() < 0.3,
      });
    }

    // ── Scam notifications ───────────────────────────────────────────────
    const chapterInfo = CHAPTERS.find((c) => c.id === chapter);
    const scenarioIds = chapterInfo?.scenarioIds ?? [];
    const uncompleted = scenarioIds.filter(
      (id) => !completedScenarios.includes(id),
    );

    const scams: DeliveryNotification[] = [];

    // Map uncompleted scenarios to scam categories (we'll load them lazily)
    // For now, pick from available scam categories based on chapter theme
    const chapterCategories = this._getChapterCategories(chapter);

    for (let i = 0; i < scamCount; i++) {
      const scenarioId = uncompleted.length > 0 ? uncompleted[i % uncompleted.length] : undefined;
      const category = pick(chapterCategories);
      const tpl = generateScamNotification(category);

      scams.push({
        id: `notif-scam-${generateId()}`,
        type: "scam",
        title: tpl.title,
        subtitle: tpl.subtitle,
        icon: tpl.icon,
        iconBg: tpl.iconBg,
        timestamp: relativeTimestamp(randInt(5, 60 * 12)),
        isRead: false,
        linkedScenarioId: scenarioId,
      });
    }

    // ── Shuffle to avoid clustering ──────────────────────────────────────
    return shuffle([...legits, ...scams]);
  }

  /**
   * Generate an activity feed mixing legit + suspicious transactions.
   *
   * Rules:
   * - 10-15 items total
   * - ~70% legit, ~30% suspicious
   * - Suspicious items link to uncompleted scenarios
   * - Older items have older timestamps
   */
  static generateActivityFeed(
    chapter: number,
    holdings: Token[],
    completedScenarios: string[],
    gameDay: number,
  ): Transaction[] {
    const total = randInt(10, 15);

    // Suspicious ratio: base 30%, slight increase in later chapters
    const suspiciousRatio = Math.min(0.45, 0.3 + (chapter - 1) * 0.03);
    const suspiciousCount = Math.round(total * suspiciousRatio);
    const legitCount = total - suspiciousCount;

    const chapterInfo = CHAPTERS.find((c) => c.id === chapter);
    const scenarioIds = chapterInfo?.scenarioIds ?? [];
    const uncompleted = scenarioIds.filter(
      (id) => !completedScenarios.includes(id),
    );

    // ── Legit transactions ───────────────────────────────────────────────
    const legits: Transaction[] = [];
    for (let i = 0; i < legitCount; i++) {
      const factory = pick(LEGIT_TX_FACTORIES);
      const tx = factory(holdings);
      legits.push({ ...tx, id: `tx-legit-${generateId()}` });
    }

    // ── Suspicious transactions ──────────────────────────────────────────
    const suspicious: Transaction[] = [];
    for (let i = 0; i < suspiciousCount; i++) {
      const factory = pick(SUSPICIOUS_TX_FACTORIES);
      const tx = factory();
      suspicious.push({
        ...tx,
        id: `tx-sus-${generateId()}`,
        linkedScenarioId:
          uncompleted.length > 0
            ? uncompleted[i % uncompleted.length]
            : undefined,
      });
    }

    // ── Combine and sort by timestamp (newest first) ─────────────────────
    const all = [...legits, ...suspicious];
    all.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return all;
  }

  /**
   * Decide if a scam should trigger right now.
   *
   * Rules:
   * - Minimum 1 game day between scams
   * - Maximum 3 game days without a scam
   * - Boss only when all other chapter scenarios are done
   * - Higher chapters = slightly more frequent
   */
  static shouldTriggerScam(
    lastScamTime: string,
    gameDay: number,
    chapter: number,
    completedScenarios: string[],
    totalScenariosInChapter: number,
  ): boolean {
    // Calculate days since last scam
    const lastDay = lastScamTime
      ? Math.floor(
          (Date.now() - new Date(lastScamTime).getTime()) / (1000 * 60 * 60 * 24),
        )
      : Infinity;

    // Minimum cooldown: 1 game day (scaled slightly by chapter)
    const minCooldown = Math.max(1, 2 - Math.floor(chapter / 3));
    if (lastDay < minCooldown) return false;

    // Force trigger if it's been too long (3 days max gap)
    if (lastDay >= 3) return true;

    // Check if only the boss is left
    const chapterInfo = CHAPTERS.find((c) => c.id === chapter);
    if (chapterInfo) {
      const nonBossIds = chapterInfo.scenarioIds.filter(
        (id) => id !== chapterInfo.bossScenarioId,
      );
      const nonBossCompleted = nonBossIds.filter((id) =>
        completedScenarios.includes(id),
      );

      // All non-boss done → boss is ready
      if (nonBossCompleted.length === nonBossIds.length) return true;
    }

    // Probability-based: higher chapter = higher chance
    // Base 50% + 5% per chapter
    const triggerChance = Math.min(0.8, 0.5 + (chapter - 1) * 0.05);
    return Math.random() < triggerChance;
  }

  /**
   * Pick which scenario to deliver next.
   *
   * Rules:
   * - Pick uncompleted scenario from current chapter
   * - Weight by class weakness (Ape faces FOMO scams first, etc.)
   * - Don't pick boss until all others are done
   * - Return null if all completed
   */
  static selectNextScenario(
    chapter: number,
    completedScenarios: string[],
    playerClass: string,
  ): { scenarioId: string; deliveryChannel: DeliveryChannel } | null {
    const chapterInfo = CHAPTERS.find((c) => c.id === chapter);
    if (!chapterInfo) return null;

    const uncompleted = chapterInfo.scenarioIds.filter(
      (id) => !completedScenarios.includes(id),
    );

    if (uncompleted.length === 0) return null;

    // Separate boss from non-boss
    const nonBoss = uncompleted.filter(
      (id) => id !== chapterInfo.bossScenarioId,
    );
    const bossAvailable = uncompleted.includes(chapterInfo.bossScenarioId);

    // If non-boss scenarios remain, pick from them
    if (nonBoss.length > 0) {
      const selected = this._weightedSelectByClass(
        nonBoss,
        chapter,
        playerClass,
      );
      return {
        scenarioId: selected,
        deliveryChannel: this._inferDeliveryChannel(selected),
      };
    }

    // All non-boss done → deliver the boss
    if (bossAvailable) {
      return {
        scenarioId: chapterInfo.bossScenarioId,
        deliveryChannel: this._inferDeliveryChannel(
          chapterInfo.bossScenarioId,
        ),
      };
    }

    return null;
  }

  /**
   * Generate legit notifications using the player's current holdings.
   */
  static generateLegitNotifications(
    holdings: Token[],
    count: number,
  ): DeliveryNotification[] {
    const results: DeliveryNotification[] = [];

    for (let i = 0; i < count; i++) {
      const tpl = generateLegitNotification(holdings);
      results.push({
        id: `notif-legit-${generateId()}`,
        type: "legit",
        title: tpl.title,
        subtitle: tpl.subtitle,
        icon: tpl.icon,
        iconBg: tpl.iconBg,
        timestamp: relativeTimestamp(randInt(5, 1440)),
        isRead: Math.random() < 0.3,
      });
    }

    return results;
  }

  // ── Private helpers ────────────────────────────────────────────────────────────

  /**
   * Get scam categories most relevant to a chapter's theme.
   */
  private static _getChapterCategories(chapter: number): ScamCategory[] {
    const mapping: Record<number, ScamCategory[]> = {
      1: ["phishing", "social-engineering"],
      2: ["honeypot", "smart-contract", "rug-pull"],
      3: ["phishing", "social-engineering", "honeypot"],
      4: ["smart-contract", "phishing"],
      5: ["rug-pull", "social-engineering", "smart-contract"],
    };
    return mapping[chapter] ?? ["phishing", "honeypot"];
  }

  /**
   * Select a scenario ID weighted by the player class's weaknesses.
   * Scenarios whose IDs suggest a category matching the class weakness get
   * a higher weight, so the player faces their weakness sooner.
   */
  private static _weightedSelectByClass(
    scenarioIds: string[],
    chapter: number,
    playerClass: string,
  ): string {
    const weaknesses = CLASS_WEAKNESS_CATEGORIES[playerClass] ?? [];

    // Heuristic: infer category from scenario ID keywords
    const categoryHints: Record<string, ScamCategory[]> = {
      phishing: ["phishing"],
      seed: ["phishing"],
      fake: ["phishing", "honeypot"],
      airdrop: ["honeypot"],
      honeypot: ["honeypot"],
      approval: ["smart-contract"],
      contract: ["smart-contract"],
      bridge: ["smart-contract"],
      rug: ["rug-pull"],
      pull: ["rug-pull"],
      dm: ["social-engineering"],
      discord: ["social-engineering"],
      support: ["social-engineering"],
      collab: ["social-engineering"],
      social: ["social-engineering"],
      whale: ["social-engineering"],
      governance: ["smart-contract"],
      mev: ["smart-contract"],
      insider: ["social-engineering"],
      mint: ["honeypot"],
      swap: ["smart-contract"],
      dex: ["honeypot"],
      l2: ["smart-contract"],
    };

    const weights = scenarioIds.map((id) => {
      let weight = 1;

      // Check if any keyword in the ID matches a class weakness
      for (const [keyword, categories] of Object.entries(categoryHints)) {
        if (id.toLowerCase().includes(keyword)) {
          const matchesWeakness = categories.some((cat) =>
            weaknesses.includes(cat),
          );
          if (matchesWeakness) {
            weight = 3; // 3x more likely to be picked first
            break;
          }
        }
      }

      // Earlier scenarios in the list (lower index) get a slight boost
      const allIds = ScenarioEngine.getScenariosForChapter(chapter);
      const idx = allIds.indexOf(id);
      if (idx >= 0 && idx < 2) weight += 1;

      return weight;
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * totalWeight;

    for (let i = 0; i < scenarioIds.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return scenarioIds[i];
    }

    return scenarioIds[scenarioIds.length - 1];
  }

  /**
   * Infer a delivery channel from the scenario ID.
   * Falls back to "notification" if no pattern matches.
   */
  private static _inferDeliveryChannel(scenarioId: string): DeliveryChannel {
    const id = scenarioId.toLowerCase();

    if (id.includes("dm") || id.includes("support") || id.includes("collab"))
      return "dm";
    if (id.includes("approval") || id.includes("contract"))
      return "approval-popup";
    if (
      id.includes("airdrop") ||
      id.includes("token") ||
      id.includes("dust") ||
      id.includes("swap")
    )
      return "activity-feed";
    if (
      id.includes("discord") ||
      id.includes("whale") ||
      id.includes("insider")
    )
      return "npc-conversation";

    return "notification";
  }
}
