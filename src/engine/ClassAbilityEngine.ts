/**
 * ClassAbilityEngine — each class has a unique ability that can
 * trigger during scenarios, providing different advantages.
 */

import type { ScamCategory, ScenarioDefinition } from "../store/scenarioStore";

// ── Ability Definitions ──────────────────────────────────────────────────────────

interface AbilityResult {
  abilityTriggered: boolean;
  abilityName: string;
  effect: string;
  preventsRekt?: boolean;
  revealsClue?: boolean;
  autoSurvives?: boolean;
}

const NO_TRIGGER: AbilityResult = {
  abilityTriggered: false,
  abilityName: "",
  effect: "",
};

// ── Engine ───────────────────────────────────────────────────────────────────────

export class ClassAbilityEngine {
  /**
   * Check if the player's class ability triggers for a given scenario.
   *
   * Ape — "Diamond Hands":
   *   One-time per playthrough. Auto-survive a rug pull rekt.
   *   Only triggers on rug-pull category.
   *
   * Analyst — "Deep Dive":
   *   2 free investigations per day. Reveals an extra clue automatically.
   *   Triggers if uses remain.
   *
   * Shadow — "Incognito":
   *   30% chance to auto-skip social-engineering scams entirely.
   *
   * Degen — "Gut Feeling":
   *   25% chance to auto-detect ANY scam type. Unreliable but powerful.
   */
  static checkAbility(
    playerClass: string,
    scamCategory: ScamCategory,
    abilityUsesRemaining: number,
    scenario: ScenarioDefinition,
  ): AbilityResult {
    switch (playerClass) {
      case "ape":
        return this._checkDiamondHands(scamCategory, abilityUsesRemaining);

      case "analyst":
        return this._checkDeepDive(abilityUsesRemaining, scenario);

      case "shadow":
        return this._checkIncognito(scamCategory);

      case "degen":
        return this._checkGutFeeling(scamCategory);

      default:
        return NO_TRIGGER;
    }
  }

  /**
   * Get the ability name and description for a class.
   */
  static getAbilityInfo(playerClass: string): {
    name: string;
    description: string;
    maxUses: number;
    usesPerDay: boolean;
  } {
    const abilities: Record<
      string,
      { name: string; description: string; maxUses: number; usesPerDay: boolean }
    > = {
      ape: {
        name: "Diamond Hands",
        description:
          "Survive one rug pull that would have rekt you. One-time use per playthrough.",
        maxUses: 1,
        usesPerDay: false,
      },
      analyst: {
        name: "Deep Dive",
        description:
          "2 free investigations per day. Normally investigations cost resources.",
        maxUses: 2,
        usesPerDay: true,
      },
      shadow: {
        name: "Incognito",
        description:
          "30% chance to auto-skip social-engineering scams entirely.",
        maxUses: -1, // passive, unlimited
        usesPerDay: false,
      },
      degen: {
        name: "Gut Feeling",
        description:
          "25% chance to auto-detect any scam type. Unreliable but powerful.",
        maxUses: -1, // passive, unlimited
        usesPerDay: false,
      },
    };

    return (
      abilities[playerClass] ?? {
        name: "None",
        description: "No ability",
        maxUses: 0,
        usesPerDay: false,
      }
    );
  }

  // ── Private: Ability checks ────────────────────────────────────────────────────

  /**
   * Ape — Diamond Hands: one-time auto-survive a rug pull.
   * Only triggers on rug-pull category and if uses remain.
   */
  private static _checkDiamondHands(
    scamCategory: ScamCategory,
    usesRemaining: number,
  ): AbilityResult {
    if (scamCategory !== "rug-pull" || usesRemaining <= 0) {
      return NO_TRIGGER;
    }

    return {
      abilityTriggered: true,
      abilityName: "Diamond Hands",
      effect:
        "Your Diamond Hands kicked in! You held through the rug pull and survived!",
      preventsRekt: true,
      autoSurvives: true,
    };
  }

  /**
   * Analyst — Deep Dive: 2 free investigations per day.
   * Reveals an extra clue from the scenario's active investigations.
   */
  private static _checkDeepDive(
    usesRemaining: number,
    scenario: ScenarioDefinition,
  ): AbilityResult {
    if (usesRemaining <= 0 || scenario.activeInvestigations.length === 0) {
      return NO_TRIGGER;
    }

    // Pick a random investigation to reveal
    const inv =
      scenario.activeInvestigations[
        Math.floor(Math.random() * scenario.activeInvestigations.length)
      ];

    return {
      abilityTriggered: true,
      abilityName: "Deep Dive",
      effect: `Your analytical mind reveals: ${inv.result}`,
      revealsClue: true,
    };
  }

  /**
   * Shadow — Incognito: 30% chance to auto-skip social-engineering scams.
   */
  private static _checkIncognito(scamCategory: ScamCategory): AbilityResult {
    if (scamCategory !== "social-engineering") {
      return NO_TRIGGER;
    }

    if (Math.random() < 0.3) {
      return {
        abilityTriggered: true,
        abilityName: "Incognito",
        effect:
          "Your Incognito ability activated! The scammer couldn't identify your real wallet.",
        autoSurvives: true,
      };
    }

    return NO_TRIGGER;
  }

  /**
   * Degen — Gut Feeling: 25% chance to auto-detect ANY scam.
   */
  private static _checkGutFeeling(
    _scamCategory: ScamCategory,
  ): AbilityResult {
    if (Math.random() < 0.25) {
      return {
        abilityTriggered: true,
        abilityName: "Gut Feeling",
        effect:
          "Your Gut Feeling is screaming — something about this doesn't feel right!",
        revealsClue: true,
      };
    }

    return NO_TRIGGER;
  }
}
