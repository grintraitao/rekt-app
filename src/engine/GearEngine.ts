/**
 * GearEngine — calculates combined gear effects, auto-detection rolls,
 * bonus clues, and damage mitigation.
 */

import type { ScamCategory, ScenarioDefinition } from "../store/scenarioStore";
import { GEAR_ITEMS, getGearById, type GearItemDef } from "../data/gear";

// ── Engine ───────────────────────────────────────────────────────────────────────

export class GearEngine {
  /**
   * Get all gear items.
   */
  static getAllGear(): GearItemDef[] {
    return GEAR_ITEMS;
  }

  /**
   * Check if a player can unlock a gear item.
   */
  static canUnlock(
    gearId: string,
    playerLevel: number,
    securityTokens: number,
    completedChapters: number[],
    _achievements: string[],
  ): { canUnlock: boolean; reason?: string } {
    const gear = getGearById(gearId);
    if (!gear) return { canUnlock: false, reason: "Unknown gear item" };

    const cond = gear.unlockCondition;

    switch (cond.type) {
      case "default":
        return { canUnlock: true };

      case "level":
        if (playerLevel >= (cond.value ?? 0)) {
          return { canUnlock: true };
        }
        return {
          canUnlock: false,
          reason: `Requires level ${cond.value}`,
        };

      case "purchase":
        if (!cond.cost) return { canUnlock: false, reason: "No cost defined" };
        if (cond.cost.currency === "securityTokens") {
          if (securityTokens >= cond.cost.amount) {
            return { canUnlock: true };
          }
          return {
            canUnlock: false,
            reason: `Requires ${cond.cost.amount} security tokens (you have ${securityTokens})`,
          };
        }
        return { canUnlock: true };

      case "chapter":
        if (completedChapters.includes(cond.value ?? 0)) {
          return { canUnlock: true };
        }
        return {
          canUnlock: false,
          reason: `Complete Chapter ${cond.value} to unlock`,
        };

      case "achievement":
        // Achievements are unlocked via specific actions
        return { canUnlock: false, reason: "Requires achievement" };

      default:
        return { canUnlock: false, reason: "Unknown unlock condition" };
    }
  }

  /**
   * Calculate combined effects of all equipped gear.
   * Damage reduction caps at 75%.
   */
  static calculateCombinedEffects(equippedGearIds: string[]): {
    totalDamageReduction: number;
    totalAutoDetectChance: number;
    allBonusClueTypes: string[];
    blockedScamTypes: ScamCategory[];
    portfolioProtection: number;
  } {
    let totalDamageReduction = 0;
    let totalAutoDetectChance = 0;
    const allBonusClueTypes: string[] = [];
    const blockedScamTypesSet = new Set<ScamCategory>();
    let portfolioProtection = 0;

    for (const gearId of equippedGearIds) {
      const gear = getGearById(gearId);
      if (!gear) continue;

      const fx = gear.effects;
      totalDamageReduction += fx.damageReduction ?? 0;
      totalAutoDetectChance += fx.autoDetectChance ?? 0;
      portfolioProtection += fx.portfolioProtection ?? 0;

      if (fx.bonusClueTypes) {
        allBonusClueTypes.push(...fx.bonusClueTypes);
      }
      if (fx.blockScamTypes) {
        for (const cat of fx.blockScamTypes) {
          blockedScamTypesSet.add(cat);
        }
      }
    }

    return {
      totalDamageReduction: Math.min(75, totalDamageReduction),
      totalAutoDetectChance: Math.min(0.95, totalAutoDetectChance),
      allBonusClueTypes,
      blockedScamTypes: [...blockedScamTypesSet],
      portfolioProtection: Math.min(75, portfolioProtection),
    };
  }

  /**
   * Roll auto-detect against a specific scam category.
   * Each gear that can block/detect this category gets its own roll.
   */
  static rollAutoDetect(
    equippedGearIds: string[],
    scamCategory: ScamCategory,
  ): {
    detected: boolean;
    gearThatDetected?: string;
    message?: string;
  } {
    for (const gearId of equippedGearIds) {
      const gear = getGearById(gearId);
      if (!gear) continue;

      const fx = gear.effects;

      // Check if this gear can detect this scam category
      const canDetect =
        fx.blockScamTypes?.includes(scamCategory) ||
        (fx.autoDetectChance != null && fx.autoDetectChance > 0);

      if (!canDetect) continue;

      // Gear that specifically blocks this category gets its full chance
      const chance = fx.blockScamTypes?.includes(scamCategory)
        ? fx.autoDetectChance ?? 0.3
        : (fx.autoDetectChance ?? 0) * 0.5; // general detect is half as likely

      if (Math.random() < chance) {
        return {
          detected: true,
          gearThatDetected: gearId,
          message: this._getDetectionMessage(gear, scamCategory),
        };
      }
    }

    return { detected: false };
  }

  /**
   * Get bonus clues from gear for a scenario.
   */
  static getGearClues(
    equippedGearIds: string[],
    scenario: ScenarioDefinition,
  ): string[] {
    const clues: string[] = [];

    for (const gearId of equippedGearIds) {
      const gear = getGearById(gearId);
      if (!gear) continue;

      const fx = gear.effects;

      // Contract reader reveals investigation clues
      if (fx.bonusClueTypes && fx.bonusClueTypes.length > 0) {
        for (const inv of scenario.activeInvestigations) {
          if (fx.bonusClueTypes.includes(inv.type)) {
            clues.push(`${gear.emoji} ${gear.name}: ${inv.result}`);
          }
        }
      }

      // Gear that blocks this scam type provides a general warning
      if (fx.blockScamTypes?.includes(scenario.category)) {
        clues.push(
          `${gear.emoji} ${gear.name} flagged this as a potential ${scenario.category} scam!`,
        );
      }
    }

    return clues;
  }

  /**
   * Calculate damage after gear mitigation.
   *
   * 1. Apply damage reduction (capped at 75%)
   * 2. Portfolio protection reduces the effective portfolio at risk
   */
  static mitigateDamage(
    baseDamage: number,
    equippedGearIds: string[],
    portfolioValue: number,
  ): {
    finalDamage: number;
    amountProtected: number;
    gearUsed: string[];
  } {
    const combined = this.calculateCombinedEffects(equippedGearIds);
    const gearUsed: string[] = [];

    // Track which gear contributed
    for (const gearId of equippedGearIds) {
      const gear = getGearById(gearId);
      if (!gear) continue;
      if (
        (gear.effects.damageReduction ?? 0) > 0 ||
        (gear.effects.portfolioProtection ?? 0) > 0
      ) {
        gearUsed.push(gearId);
      }
    }

    // Apply damage reduction
    const damageMultiplier = 1 - combined.totalDamageReduction / 100;
    let finalDamage = Math.round(baseDamage * damageMultiplier);

    // Portfolio protection: reduce damage further if it would exceed unprotected portion
    const protectedAmount = Math.round(
      portfolioValue * (combined.portfolioProtection / 100),
    );
    const maxVulnerable = portfolioValue - protectedAmount;
    finalDamage = Math.min(finalDamage, maxVulnerable);

    // Never go negative
    finalDamage = Math.max(0, finalDamage);

    return {
      finalDamage,
      amountProtected: protectedAmount,
      gearUsed,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────────

  private static _getDetectionMessage(
    gear: GearItemDef,
    _scamCategory: ScamCategory,
  ): string {
    const messages: Record<string, string> = {
      "bookmark-bar": `${gear.emoji} Your Bookmark Bar flagged this URL as suspicious!`,
      "2fa-shield": `${gear.emoji} Your 2FA Shield blocked an account takeover attempt!`,
      "security-bot": `${gear.emoji} Security Bot detected suspicious activity!`,
      "hardware-wallet": `${gear.emoji} Your Hardware Wallet rejected a suspicious approval!`,
      "burner-wallet": `${gear.emoji} Your Burner Wallet intercepted a dangerous contract!`,
    };
    return (
      messages[gear.id] ??
      `${gear.emoji} ${gear.name} detected something suspicious!`
    );
  }
}
