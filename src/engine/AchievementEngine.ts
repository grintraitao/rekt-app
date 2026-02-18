/**
 * AchievementEngine — checks all achievement conditions and handles
 * streak milestones. Called after every significant game action.
 */

import type {
  Achievement,
  StreakMilestone,
  ScenarioResult,
} from "../store/gameStore";
import type { PlayerState } from "../store/playerStore";

// ── Minimal state slices the engine needs ────────────────────────────────────────

export interface PlayerSnapshot {
  level: number;
  streak: number;
  survived: number;
  completedScenarios: string[];
  unlockedGear: string[];
}

export interface PortfolioSnapshot {
  totalValue: number;
}

export interface GameSnapshot {
  completedScenarios: string[];
  scenarioResults: Record<string, ScenarioResult>;
  chapters: Array<{ id: number; scenarioIds: string[] }>;
}

// ── Engine ───────────────────────────────────────────────────────────────────────

export class AchievementEngine {
  /**
   * Master check — call after any game action.
   * Returns newly unlocked achievements (only those that weren't unlocked before).
   */
  static checkAllAchievements(
    achievements: Achievement[],
    player: PlayerSnapshot,
    portfolio: PortfolioSnapshot,
    game: GameSnapshot,
  ): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      // Skip already unlocked
      if (achievement.unlockedAt) continue;

      const met = this._checkCondition(achievement, player, portfolio, game);
      if (met) {
        newlyUnlocked.push({
          ...achievement,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    return newlyUnlocked;
  }

  /**
   * Apply achievement rewards to the player.
   * Returns a list of human-readable reward descriptions.
   */
  static applyReward(
    achievement: Achievement,
    playerActions: {
      addXP: (amount: number) => void;
      addCoins: (amount: number) => void;
      addSecurityTokens: (amount: number) => void;
      unlockGear: (gearId: string) => void;
    },
  ): { rewardsApplied: string[] } {
    const rewardsApplied: string[] = [];
    const r = achievement.reward;

    if (r.xp) {
      playerActions.addXP(r.xp);
      rewardsApplied.push(`+${r.xp} XP`);
    }
    if (r.coins) {
      playerActions.addCoins(r.coins);
      rewardsApplied.push(`+${r.coins} coins`);
    }
    if (r.securityTokens) {
      playerActions.addSecurityTokens(r.securityTokens);
      rewardsApplied.push(`+${r.securityTokens} security tokens`);
    }
    if (r.gearUnlock) {
      playerActions.unlockGear(r.gearUnlock);
      rewardsApplied.push(`Gear unlocked: ${r.gearUnlock}`);
    }
    if (r.title) {
      rewardsApplied.push(`Title: ${r.title}`);
    }

    return { rewardsApplied };
  }

  /**
   * Get achievement progress — how close the player is to unlocking.
   */
  static getProgress(
    achievement: Achievement,
    player: PlayerSnapshot,
    portfolio: PortfolioSnapshot,
    game: GameSnapshot,
  ): { current: number; target: number; percentage: number } {
    const target = achievement.condition.value;
    let current = 0;

    switch (achievement.condition.type) {
      case "streak":
        current = player.streak;
        break;

      case "scenarios-survived":
        current = this._countSurvived(game);
        break;

      case "scenarios-completed":
        current = game.completedScenarios.length;
        break;

      case "portfolio-value":
        current = portfolio.totalValue;
        break;

      case "scams-caught":
        current = this._countSurvived(game);
        break;

      case "chapter-complete": {
        // Count completed chapters
        const completedChapterCount = game.chapters.filter((ch) =>
          ch.scenarioIds.every((id) => game.completedScenarios.includes(id)),
        ).length;
        current = completedChapterCount;
        break;
      }

      case "level-reached":
        current = player.level;
        break;

      case "gear-collected":
        current = player.unlockedGear.length;
        break;

      case "specific-action":
        // Binary: either done (1) or not (0)
        current = game.completedScenarios.includes(
          achievement.condition.specificId ?? "",
        )
          ? 1
          : 0;
        break;
    }

    const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    return { current, target, percentage };
  }

  /**
   * Check streak milestones — returns the highest unclaimed milestone
   * that the player has just reached, or null.
   */
  static checkStreakMilestones(
    currentStreak: number,
    milestones: StreakMilestone[],
  ): StreakMilestone | null {
    // Find unclaimed milestones the player has reached, pick the highest
    const reachable = milestones
      .filter((m) => !m.claimed && currentStreak >= m.days)
      .sort((a, b) => b.days - a.days);

    return reachable.length > 0 ? reachable[0] : null;
  }

  /**
   * Format an achievement unlock notification for UI display.
   */
  static formatUnlockNotification(achievement: Achievement): {
    title: string;
    subtitle: string;
    emoji: string;
  } {
    const rewardParts: string[] = [];
    const r = achievement.reward;
    if (r.xp) rewardParts.push(`+${r.xp} XP`);
    if (r.coins) rewardParts.push(`+${r.coins} coins`);
    if (r.securityTokens) rewardParts.push(`+${r.securityTokens} tokens`);
    if (r.gearUnlock) rewardParts.push(`Gear: ${r.gearUnlock}`);
    if (r.title) rewardParts.push(`Title: ${r.title}`);

    const rewardStr = rewardParts.length > 0 ? ` — ${rewardParts.join(", ")}` : "";

    return {
      title: "Achievement Unlocked!",
      subtitle: `${achievement.emoji} ${achievement.name} — ${achievement.description}${rewardStr}`,
      emoji: "\uD83C\uDFC6",
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────────

  private static _checkCondition(
    achievement: Achievement,
    player: PlayerSnapshot,
    portfolio: PortfolioSnapshot,
    game: GameSnapshot,
  ): boolean {
    const { type, value, specificId } = achievement.condition;

    switch (type) {
      case "streak":
        return player.streak >= value;

      case "scenarios-survived":
        return this._countSurvived(game) >= value;

      case "scenarios-completed":
        return game.completedScenarios.length >= value;

      case "portfolio-value":
        return portfolio.totalValue >= value;

      case "scams-caught":
        return this._countSurvived(game) >= value;

      case "chapter-complete": {
        // For value=5 check all chapters, otherwise check specific chapter
        if (value === 5) {
          return game.chapters
            .filter((ch) => ch.id >= 1 && ch.id <= 5)
            .every((ch) =>
              ch.scenarioIds.every((id) =>
                game.completedScenarios.includes(id),
              ),
            );
        }
        const chapter = game.chapters.find((ch) => ch.id === value);
        if (!chapter) return false;
        return chapter.scenarioIds.every((id) =>
          game.completedScenarios.includes(id),
        );
      }

      case "level-reached":
        return player.level >= value;

      case "gear-collected":
        return player.unlockedGear.length >= value;

      case "specific-action":
        // Check if the specificId appears in completed scenarios or
        // could be a tracked action ID
        if (!specificId) return false;
        return game.completedScenarios.includes(specificId);

      default:
        return false;
    }
  }

  private static _countSurvived(game: GameSnapshot): number {
    return Object.values(game.scenarioResults).filter(
      (r) => r.outcome === "survived",
    ).length;
  }
}

// ── processGameAction helper ─────────────────────────────────────────────────────

/**
 * Convenience function to call after any significant game action.
 * Checks achievements and streak milestones, applies rewards,
 * and returns what happened for UI notifications.
 */
export function processGameAction(
  action:
    | "scenario-complete"
    | "daily-claim"
    | "level-up"
    | "gear-change"
    | "portfolio-change",
  stores: {
    achievements: Achievement[];
    player: PlayerSnapshot;
    portfolio: PortfolioSnapshot;
    game: GameSnapshot;
    streak: number;
    milestones: StreakMilestone[];
    playerActions: {
      addXP: (amount: number) => void;
      addCoins: (amount: number) => void;
      addSecurityTokens: (amount: number) => void;
      unlockGear: (gearId: string) => void;
    };
    unlockAchievement: (id: string) => void;
  },
): {
  newAchievements: Achievement[];
  streakMilestone: StreakMilestone | null;
  notifications: Array<{ title: string; subtitle: string; emoji: string }>;
} {
  // 1. Check achievements
  const newAchievements = AchievementEngine.checkAllAchievements(
    stores.achievements,
    stores.player,
    stores.portfolio,
    stores.game,
  );

  const notifications: Array<{ title: string; subtitle: string; emoji: string }> = [];

  // 2. Apply rewards and queue notifications
  for (const achievement of newAchievements) {
    stores.unlockAchievement(achievement.id);
    AchievementEngine.applyReward(achievement, stores.playerActions);
    notifications.push(AchievementEngine.formatUnlockNotification(achievement));
  }

  // 3. Check streak milestones
  const streakMilestone = AchievementEngine.checkStreakMilestones(
    stores.streak,
    stores.milestones,
  );

  return { newAchievements, streakMilestone, notifications };
}
