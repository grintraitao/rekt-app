/**
 * ProgressionEngine — consolidates all XP, leveling, and stat calculation
 * logic in one place so it's consistent across the app.
 */

import type { PlayerStats } from "../store/playerStore";

// ── Constants ────────────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 300;
const MAX_LEVEL = 30;

export const XP_REWARDS = {
  // Scenarios
  scenarioSurvived: 200,
  scenarioRekt: 50,
  bossScenarioSurvived: 500,
  bossScenarioRekt: 100,

  // Daily
  dailyLogin: 50,
  streakBonus: (streak: number): number => Math.min(streak * 10, 200),

  // Actions
  readEducation: 30,
  inspectLink: 10,
  checkContract: 15,
  verifyIdentity: 10,

  // Achievements
  achievementUnlocked: 100,

  // Portfolio
  portfolioMilestone: 200,
} as const;

const DIFFICULTY_MULTIPLIER: Record<number, number> = {
  1: 1.0,
  2: 1.2,
  3: 1.5,
  4: 2.0,
  5: 3.0,
};

const CLASS_STAT_MODIFIERS: Record<string, Partial<PlayerStats>> = {
  ape: { wealth: 15, detection: -10, security: -5 },
  analyst: { detection: 15, knowledge: 5, security: 5, wealth: -10 },
  shadow: { security: 5, detection: 5, hp: 5 },
  degen: { wealth: 10, hp: 10, security: -10, detection: -5 },
};

/** Wealth stat brackets based on portfolio value */
const WEALTH_BRACKETS: Array<{ threshold: number; stat: number }> = [
  { threshold: 150_000, stat: 90 },
  { threshold: 60_000, stat: 70 },
  { threshold: 25_000, stat: 50 },
  { threshold: 5_000, stat: 30 },
  { threshold: 0, stat: 10 },
];

/** Gear → damage reduction percentages for calculateDamage */
const GEAR_DAMAGE_REDUCTION: Record<string, number> = {
  "paper-wallet": 5,
  "hardware-wallet": 15,
  "cold-storage": 25,
  "2fa-shield": 10,
  "revoke-tool": 15,
  "security-bot": 5,
  "burner-wallet": 40,
};

const LEVEL_TITLES: Array<{ maxLevel: number; title: string }> = [
  { maxLevel: 5, title: "NOOB" },
  { maxLevel: 10, title: "TRADER" },
  { maxLevel: 15, title: "COLLECTOR" },
  { maxLevel: 20, title: "FARMER" },
  { maxLevel: 25, title: "VETERAN" },
  { maxLevel: 30, title: "SURVIVOR" },
];

// ── Engine ───────────────────────────────────────────────────────────────────────

export class ProgressionEngine {
  /**
   * Calculate XP reward for completing a scenario.
   *
   * Formula:
   *   baseXP × difficultyMultiplier × streakMultiplier
   *
   * Streak multiplier: 1 + (streak × 0.05), max 2.0
   * Only applies to survived outcomes.
   */
  static calculateScenarioXP(
    outcome: "rekt" | "survived",
    difficulty: number,
    isBoss: boolean,
    streak: number,
  ): number {
    // Pick base XP
    let base: number;
    if (outcome === "survived") {
      base = isBoss ? XP_REWARDS.bossScenarioSurvived : XP_REWARDS.scenarioSurvived;
    } else {
      base = isBoss ? XP_REWARDS.bossScenarioRekt : XP_REWARDS.scenarioRekt;
    }

    // Difficulty multiplier
    const diffMult = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.0;

    // Streak multiplier (only for survived)
    const streakMult =
      outcome === "survived"
        ? Math.min(2.0, 1 + streak * 0.05)
        : 1.0;

    return Math.round(base * diffMult * streakMult);
  }

  /**
   * Check if XP amount triggers a level up (may be multiple levels).
   * Uses the formula: xpToNextLevel = level × 300
   */
  static checkLevelUp(
    currentLevel: number,
    currentXP: number,
    xpGained: number,
  ): {
    newLevel: number;
    newXP: number;
    levelsGained: number;
    newTitle: string;
  } {
    let xp = currentXP + xpGained;
    let level = currentLevel;

    while (xp >= level * XP_PER_LEVEL && level < MAX_LEVEL) {
      xp -= level * XP_PER_LEVEL;
      level += 1;
    }

    // Cap at max level
    if (level >= MAX_LEVEL) {
      xp = Math.min(xp, 0);
    }

    return {
      newLevel: level,
      newXP: xp,
      levelsGained: level - currentLevel,
      newTitle: this.getTitleForLevel(level),
    };
  }

  /**
   * Get title for a level.
   */
  static getTitleForLevel(level: number): string {
    for (const { maxLevel, title } of LEVEL_TITLES) {
      if (level <= maxLevel) return title;
    }
    return "SURVIVOR";
  }

  /**
   * Calculate stat changes from an action.
   */
  static calculateStatChanges(
    action:
      | "survived"
      | "rekt"
      | "investigated"
      | "education-read"
      | "gear-equipped"
      | "daily-login",
    context?: {
      difficulty?: number;
      investigationType?: string;
      usedInspection?: boolean;
      firstTry?: boolean;
    },
  ): Partial<PlayerStats> {
    const changes: Partial<PlayerStats> = {};

    switch (action) {
      case "survived": {
        // +3 detection if correctly identified on first try
        if (context?.firstTry) {
          changes.detection = 3;
        }
        // +3 security if used inspection to survive
        if (context?.usedInspection) {
          changes.security = 3;
        }
        // +1 knowledge for learning from survival
        changes.knowledge = (changes.knowledge ?? 0) + 1;
        break;
      }

      case "rekt": {
        // Small knowledge gain — you learned something
        changes.knowledge = 1;
        break;
      }

      case "investigated": {
        // +1 detection per investigation used
        changes.detection = 1;
        // Specific investigation type bonuses
        if (context?.investigationType === "check-contract") {
          changes.security = (changes.security ?? 0) + 1;
        }
        if (context?.investigationType === "inspect-link") {
          changes.security = (changes.security ?? 0) + 1;
        }
        break;
      }

      case "education-read": {
        // +5 knowledge per education post-mortem read
        changes.knowledge = 5;
        break;
      }

      case "gear-equipped": {
        // +2 security per security gear equipped
        changes.security = 2;
        break;
      }

      case "daily-login": {
        // HP recovery is handled separately via calculateHPRecovery
        // +2 knowledge for Sensei conversation (part of daily loop)
        changes.knowledge = 2;
        break;
      }
    }

    return changes;
  }

  /**
   * Calculate wealth stat from portfolio value.
   *
   * Brackets:
   *   $0–5k → 10, $5k–25k → 30, $25k–60k → 50,
   *   $60k–150k → 70, $150k+ → 90
   */
  static calculateWealthStat(portfolioValue: number): number {
    for (const { threshold, stat } of WEALTH_BRACKETS) {
      if (portfolioValue >= threshold) return stat;
    }
    return 10;
  }

  /**
   * Calculate HP recovery for daily login.
   *
   * +5 HP per login, +10 if streak > 7, max 100.
   */
  static calculateHPRecovery(currentHP: number, streak: number): number {
    const recovery = streak > 7 ? 10 : 5;
    const newHP = Math.min(100, currentHP + recovery);
    return newHP - currentHP; // actual amount recovered
  }

  /**
   * Calculate damage when REKT.
   *
   * Gear damage reduction stacks additively, capped at 75%.
   * Class weakness is NOT applied here (handled by ScenarioEngine).
   */
  static calculateDamage(
    baseDamage: number,
    equippedGear: string[],
    _playerClass: string,
  ): number {
    let totalReduction = 0;

    for (const gearId of equippedGear) {
      totalReduction += GEAR_DAMAGE_REDUCTION[gearId] ?? 0;
    }

    // Cap at 75%
    totalReduction = Math.min(75, totalReduction);

    const multiplier = 1 - totalReduction / 100;
    return Math.round(baseDamage * multiplier);
  }

  /**
   * Get required XP for a specific level.
   */
  static getXPForLevel(level: number): number {
    return level * XP_PER_LEVEL;
  }

  /**
   * Get level progress as percentage (0–100).
   */
  static getLevelProgress(currentXP: number, xpToNextLevel: number): number {
    if (xpToNextLevel <= 0) return 100;
    return Math.min(100, Math.round((currentXP / xpToNextLevel) * 100));
  }

  /**
   * Get the class stat modifiers for a player class.
   */
  static getClassStatModifiers(playerClass: string): Partial<PlayerStats> {
    return CLASS_STAT_MODIFIERS[playerClass] ?? {};
  }

  /**
   * Calculate daily login XP with streak bonus.
   */
  static calculateDailyLoginXP(streak: number): number {
    const base = XP_REWARDS.dailyLogin;
    const streakBonus = XP_REWARDS.streakBonus(streak);
    const streakMult = Math.min(2.0, 1 + streak * 0.05);
    return Math.round(base * streakMult) + streakBonus;
  }
}
