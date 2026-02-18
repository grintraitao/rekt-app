/**
 * Scenario JSON Schema & Validation
 *
 * Re-exports the canonical ScenarioDefinition from scenarioStore and provides
 * a runtime validator for JSON files loaded from disk/network.
 */

export type {
  ScenarioDefinition,
  ScenarioNode,
  ScenarioMessage,
  ScenarioChoice,
  ScenarioEducation,
  ScamCategory,
  DeliveryChannel,
  ChoiceOutcome,
} from "../../store/scenarioStore";

import type { ScenarioDefinition } from "../../store/scenarioStore";

// ── Required top-level fields ───────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof ScenarioDefinition)[] = [
  "id",
  "chapter",
  "scenarioIndex",
  "title",
  "subtitle",
  "icon",
  "difficulty",
  "category",
  "deliveryChannel",
  "npcAvatar",
  "npcName",
  "isBoss",
  "nodes",
  "passiveClues",
  "activeInvestigations",
  "education",
  "rektConsequences",
  "survivedRewards",
  "communityRektRate",
];

const VALID_CATEGORIES = [
  "phishing",
  "honeypot",
  "social-engineering",
  "smart-contract",
  "rug-pull",
];

const VALID_CHANNELS = [
  "notification",
  "dm",
  "activity-feed",
  "approval-popup",
  "npc-conversation",
];

// ── Validation ──────────────────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export function validateScenario(
  data: unknown,
): { valid: true; scenario: ScenarioDefinition } | { valid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "root", message: "Data must be an object" }] };
  }

  const obj = data as Record<string, unknown>;

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      errors.push({ field, message: `Missing required field: ${field}` });
    }
  }

  // If too many fields missing, bail early
  if (errors.length > 5) {
    return { valid: false, errors };
  }

  // Type checks for critical fields
  if (typeof obj.id !== "string" || obj.id.length === 0) {
    errors.push({ field: "id", message: "id must be a non-empty string" });
  }

  if (typeof obj.chapter !== "number" || obj.chapter < 1 || obj.chapter > 5) {
    errors.push({ field: "chapter", message: "chapter must be 1-5" });
  }

  if (typeof obj.difficulty !== "number" || obj.difficulty < 1 || obj.difficulty > 5) {
    errors.push({ field: "difficulty", message: "difficulty must be 1-5" });
  }

  if (typeof obj.category === "string" && !VALID_CATEGORIES.includes(obj.category)) {
    errors.push({ field: "category", message: `Invalid category: ${obj.category}` });
  }

  if (typeof obj.deliveryChannel === "string" && !VALID_CHANNELS.includes(obj.deliveryChannel)) {
    errors.push({ field: "deliveryChannel", message: `Invalid delivery channel: ${obj.deliveryChannel}` });
  }

  // Nodes validation
  if (Array.isArray(obj.nodes)) {
    if (obj.nodes.length === 0) {
      errors.push({ field: "nodes", message: "nodes must have at least one entry" });
    }
    for (let i = 0; i < obj.nodes.length; i++) {
      const node = obj.nodes[i] as Record<string, unknown>;
      if (!node.id) {
        errors.push({ field: `nodes[${i}].id`, message: "Each node must have an id" });
      }
      if (!Array.isArray(node.messages)) {
        errors.push({ field: `nodes[${i}].messages`, message: "Each node must have messages array" });
      }
      if (!Array.isArray(node.choices)) {
        errors.push({ field: `nodes[${i}].choices`, message: "Each node must have choices array" });
      }
    }
  } else if ("nodes" in obj) {
    errors.push({ field: "nodes", message: "nodes must be an array" });
  }

  // Education validation
  if (obj.education && typeof obj.education === "object") {
    const edu = obj.education as Record<string, unknown>;
    if (!edu.attackName) errors.push({ field: "education.attackName", message: "Missing attackName" });
    if (!Array.isArray(edu.redFlags)) errors.push({ field: "education.redFlags", message: "Missing redFlags array" });
    if (!Array.isArray(edu.howItWorked)) errors.push({ field: "education.howItWorked", message: "Missing howItWorked array" });
    if (!Array.isArray(edu.irlProtection)) errors.push({ field: "education.irlProtection", message: "Missing irlProtection array" });
  }

  // Consequences & rewards validation
  if (obj.rektConsequences && typeof obj.rektConsequences === "object") {
    const rekt = obj.rektConsequences as Record<string, unknown>;
    if (typeof rekt.moneyLost !== "number") errors.push({ field: "rektConsequences.moneyLost", message: "moneyLost must be a number" });
    if (typeof rekt.hpLost !== "number") errors.push({ field: "rektConsequences.hpLost", message: "hpLost must be a number" });
  }

  if (obj.survivedRewards && typeof obj.survivedRewards === "object") {
    const rewards = obj.survivedRewards as Record<string, unknown>;
    if (typeof rewards.xp !== "number") errors.push({ field: "survivedRewards.xp", message: "xp must be a number" });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, scenario: data as ScenarioDefinition };
}
