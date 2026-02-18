/**
 * ScenarioEngine — utility class that loads, validates, and provides
 * helper methods for scenario JSON files. Not a store; purely functional.
 */

import type { ScenarioDefinition } from "../store/scenarioStore";
import type { Transaction } from "../store/portfolioStore";
import { SCENARIO_REGISTRY } from "../data/scenarios/index";
import { validateScenario } from "../data/scenarios/schema";
import { CHAPTERS } from "../store/gameStore";

// ── Gear → scam-category mapping ────────────────────────────────────────────────

const GEAR_EFFECTS: Record<
  string,
  {
    detectsCategories: string[];
    hints: string[];
    damageReduction: number; // percentage
  }
> = {
  "paper-wallet": {
    detectsCategories: [],
    hints: ["Your seed phrase is written on paper — never type it online."],
    damageReduction: 0,
  },
  "bookmark-bar": {
    detectsCategories: ["phishing"],
    hints: ["This URL doesn't match your bookmarks!"],
    damageReduction: 0,
  },
  "2fa-shield": {
    detectsCategories: ["social-engineering"],
    hints: ["2FA is active — they can't access your account with just a password."],
    damageReduction: 10,
  },
  "hardware-wallet": {
    detectsCategories: ["smart-contract"],
    hints: ["Your hardware wallet is asking you to verify this transaction on-device."],
    damageReduction: 25,
  },
  "contract-reader": {
    detectsCategories: ["honeypot", "smart-contract", "rug-pull"],
    hints: [
      "Contract Reader detected a suspicious function!",
      "This contract has an owner-only withdraw function.",
    ],
    damageReduction: 0,
  },
  "revoke-tool": {
    detectsCategories: [],
    hints: ["You can revoke this approval if something seems off."],
    damageReduction: 15,
  },
  "security-bot": {
    detectsCategories: ["phishing", "social-engineering"],
    hints: ["Security Bot flagged this message as potentially suspicious."],
    damageReduction: 5,
  },
  "cold-storage": {
    detectsCategories: [],
    hints: [],
    damageReduction: 50,
  },
  "burner-wallet": {
    detectsCategories: [],
    hints: ["Using a burner wallet — your main funds are safe even if this goes wrong."],
    damageReduction: 40,
  },
};

// ── Class → scam-category mapping ───────────────────────────────────────────────

const CLASS_WEAKNESSES: Record<string, string[]> = {
  ape: ["rug-pull", "honeypot"],          // FOMO-driven
  analyst: [],                             // no weaknesses
  shadow: ["social-engineering"],           // less social awareness
  degen: ["honeypot", "rug-pull", "smart-contract"], // high risk tolerance
};

const CLASS_ABILITIES: Record<string, { applicableTo: string[]; clues: string[] }> = {
  ape: {
    applicableTo: ["rug-pull"],
    clues: ["Your Diamond Hands instinct tells you this token feels off..."],
  },
  analyst: {
    applicableTo: ["smart-contract", "honeypot", "phishing", "rug-pull"],
    clues: [
      "Your analytical mind notices inconsistencies in the data.",
      "The numbers don't add up — something is being hidden.",
    ],
  },
  shadow: {
    applicableTo: ["phishing"],
    clues: ["Your Incognito ability lets you browse without revealing your wallet."],
  },
  degen: {
    applicableTo: ["social-engineering"],
    clues: ["Your Gut Feeling is tingling — this person might not be who they say."],
  },
};

// ── Engine ───────────────────────────────────────────────────────────────────────

export class ScenarioEngine {
  /**
   * Load a scenario by ID from the registry, validate it, and return.
   * Throws if the scenario ID is unknown or validation fails.
   */
  static async loadScenario(scenarioId: string): Promise<ScenarioDefinition> {
    const loader = SCENARIO_REGISTRY[scenarioId];
    if (!loader) {
      throw new Error(`Unknown scenario ID: ${scenarioId}`);
    }

    const raw = await loader();
    const result = validateScenario(raw);

    if (!result.valid) {
      const msgs = result.errors.map((e) => `${e.field}: ${e.message}`).join("; ");
      throw new Error(`Invalid scenario "${scenarioId}": ${msgs}`);
    }

    return result.scenario;
  }

  /**
   * Return scenario IDs belonging to a chapter (from gameStore constants).
   */
  static getScenariosForChapter(chapter: number): string[] {
    const ch = CHAPTERS.find((c) => c.id === chapter);
    return ch ? ch.scenarioIds : [];
  }

  /**
   * Pick a random uncompleted scenario from the given chapter.
   * Weighted toward lower difficulty (easier scenarios first).
   * Returns null if all scenarios in the chapter are completed.
   */
  static pickRandomScam(
    chapter: number,
    excludeCompleted: string[],
  ): string | null {
    const ids = this.getScenariosForChapter(chapter);
    const available = ids.filter((id) => !excludeCompleted.includes(id));

    if (available.length === 0) return null;

    // Weight by position in the array (earlier = easier = higher weight).
    // scenario at index 0 has weight 5, index 4 has weight 1.
    const weights = available.map((id) => {
      const idx = ids.indexOf(id);
      return Math.max(1, ids.length - idx);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * totalWeight;

    for (let i = 0; i < available.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return available[i];
    }

    return available[available.length - 1];
  }

  /**
   * Generate a notification-style entry from a scenario definition.
   * Used by the notification feed to surface incoming scams.
   */
  static generateScamNotification(scenario: ScenarioDefinition): {
    title: string;
    subtitle: string;
    icon: string;
    isSuspicious: boolean;
    linkedScenarioId: string;
  } {
    return {
      title: `${scenario.npcAvatar} ${scenario.npcName}`,
      subtitle: scenario.subtitle,
      icon: scenario.icon,
      isSuspicious: true,
      linkedScenarioId: scenario.id,
    };
  }

  /**
   * Generate a suspicious transaction for the activity feed.
   */
  static generateScamActivity(scenario: ScenarioDefinition): Transaction {
    const channelLabels: Record<string, string> = {
      notification: "Incoming notification",
      dm: "Direct message",
      "activity-feed": "New activity",
      "approval-popup": "Approval request",
      "npc-conversation": "New conversation",
    };

    return {
      id: `scam-tx-${scenario.id}-${Date.now()}`,
      type: "airdrop" as const,
      label: channelLabels[scenario.deliveryChannel] ?? "New activity",
      sublabel: scenario.subtitle,
      amount: 0,
      timestamp: new Date().toISOString(),
      isSuspicious: true,
      linkedScenarioId: scenario.id,
    };
  }

  /**
   * Check how equipped gear interacts with this scenario's scam category.
   */
  static checkGearEffects(
    scenario: ScenarioDefinition,
    equippedGear: string[],
  ): {
    autoDetected: boolean;
    hintsRevealed: string[];
    damageReduced: number;
  } {
    let autoDetected = false;
    const hintsRevealed: string[] = [];
    let damageReduced = 0;

    for (const gearId of equippedGear) {
      const effects = GEAR_EFFECTS[gearId];
      if (!effects) continue;

      // Check if this gear detects this scam category
      if (effects.detectsCategories.includes(scenario.category)) {
        autoDetected = true;
        hintsRevealed.push(...effects.hints);
      }

      // Accumulate damage reduction (capped at 75%)
      damageReduced += effects.damageReduction;
    }

    return {
      autoDetected,
      hintsRevealed,
      damageReduced: Math.min(damageReduced, 75),
    };
  }

  /**
   * Check how the player's class interacts with this scenario.
   */
  static checkClassEffects(
    scenario: ScenarioDefinition,
    playerClass: string,
  ): {
    isWeakAgainst: boolean;
    abilityApplicable: boolean;
    bonusClues: string[];
  } {
    const weaknesses = CLASS_WEAKNESSES[playerClass] ?? [];
    const abilities = CLASS_ABILITIES[playerClass];

    const isWeakAgainst = weaknesses.includes(scenario.category);

    let abilityApplicable = false;
    const bonusClues: string[] = [];

    if (abilities) {
      abilityApplicable = abilities.applicableTo.includes(scenario.category);
      if (abilityApplicable) {
        bonusClues.push(...abilities.clues);
      }
    }

    return { isWeakAgainst, abilityApplicable, bonusClues };
  }

  /**
   * Calculate how much damage the player takes when REKT.
   * Factors in scenario consequences, portfolio value, gear mitigation,
   * and class weaknesses.
   */
  static calculateRektDamage(
    scenario: ScenarioDefinition,
    portfolioValue: number,
    equippedGear: string[],
    playerClass: string,
  ): {
    moneyLost: number;
    hpLost: number;
    finalDamage: number;
  } {
    const { rektConsequences } = scenario;

    // Base money loss
    let moneyLost: number;
    if (rektConsequences.moneyLostType === "percentage") {
      moneyLost = Math.round(portfolioValue * (rektConsequences.moneyLost / 100));
    } else {
      moneyLost = rektConsequences.moneyLost;
    }

    // Base HP loss
    let hpLost = rektConsequences.hpLost;

    // Gear damage reduction
    const { damageReduced } = this.checkGearEffects(scenario, equippedGear);
    const gearMultiplier = 1 - damageReduced / 100;
    moneyLost = Math.round(moneyLost * gearMultiplier);
    hpLost = Math.round(hpLost * gearMultiplier);

    // Class weakness amplifies damage by 25%
    const { isWeakAgainst } = this.checkClassEffects(scenario, playerClass);
    if (isWeakAgainst) {
      moneyLost = Math.round(moneyLost * 1.25);
      hpLost = Math.round(hpLost * 1.25);
    }

    // Cannot lose more than portfolio value
    moneyLost = Math.min(moneyLost, portfolioValue);

    return {
      moneyLost,
      hpLost,
      finalDamage: moneyLost + hpLost * 100, // composite score
    };
  }

  /**
   * Calculate rewards for surviving a scenario.
   * Applies streak multiplier: 1 + (streak * 0.05), capped at 2x.
   */
  static calculateSurvivedRewards(
    scenario: ScenarioDefinition,
    playerLevel: number,
    streak: number,
  ): {
    xp: number;
    coins: number;
    securityTokens: number;
    statBoosts: Array<{ stat: string; amount: number }>;
  } {
    const { survivedRewards } = scenario;
    const streakMultiplier = Math.min(2, 1 + streak * 0.05);

    // Level scaling: small bonus per level (+2% per level above 1)
    const levelMultiplier = 1 + (playerLevel - 1) * 0.02;

    const combinedMultiplier = streakMultiplier * levelMultiplier;

    return {
      xp: Math.round(survivedRewards.xp * combinedMultiplier),
      coins: Math.round(survivedRewards.coins * combinedMultiplier),
      securityTokens: survivedRewards.securityTokens, // flat, no scaling
      statBoosts: survivedRewards.statBoosts.map((boost) => ({
        stat: boost.stat,
        amount: boost.amount,
      })),
    };
  }
}
