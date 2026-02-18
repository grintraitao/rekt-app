/**
 * Chapter 1 Scenario JSON Validation Tests
 *
 * Validates all 5 Chapter 1 scenario JSON files against the
 * ScenarioDefinition schema and checks structural correctness.
 */

jest.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { validateScenario } from "../schema";
import type { ScenarioDefinition } from "../../../store/scenarioStore";

// Import all 5 Ch.1 scenario JSONs directly
import fakeSupportDm from "../ch1-fake-support-dm.json";
import seedPhraseRequest from "../ch1-seed-phrase-request.json";
import fakeAirdrop from "../ch1-fake-airdrop.json";
import phishingEmail from "../ch1-phishing-email.json";
import seedPhraseTrap from "../ch1-seed-phrase-trap.json";

const ALL_SCENARIOS: { name: string; data: unknown }[] = [
  { name: "ch1-fake-support-dm", data: fakeSupportDm },
  { name: "ch1-seed-phrase-request", data: seedPhraseRequest },
  { name: "ch1-fake-airdrop", data: fakeAirdrop },
  { name: "ch1-phishing-email", data: phishingEmail },
  { name: "ch1-seed-phrase-trap", data: seedPhraseTrap },
];

// ── Schema Validation ───────────────────────────────────────────────────────────

describe("Chapter 1 scenarios — schema validation", () => {
  it.each(ALL_SCENARIOS)("$name passes schema validation", ({ data }) => {
    const result = validateScenario(data);
    if (!result.valid) {
      // Print detailed errors for debugging
      const msgs = result.errors.map((e) => `  ${e.field}: ${e.message}`).join("\n");
      fail(`Validation failed:\n${msgs}`);
    }
    expect(result.valid).toBe(true);
  });
});

// ── Structural checks ───────────────────────────────────────────────────────────

describe("Chapter 1 scenarios — structural checks", () => {
  it.each(ALL_SCENARIOS)("$name belongs to chapter 1", ({ data }) => {
    expect((data as ScenarioDefinition).chapter).toBe(1);
  });

  it.each(ALL_SCENARIOS)("$name has unique scenario ID matching filename", ({ name, data }) => {
    expect((data as ScenarioDefinition).id).toBe(name);
  });

  it.each(ALL_SCENARIOS)("$name has at least one node with choices", ({ data }) => {
    const scenario = data as ScenarioDefinition;
    expect(scenario.nodes.length).toBeGreaterThanOrEqual(1);

    // First node must have at least 2 choices
    expect(scenario.nodes[0].choices.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ALL_SCENARIOS)("$name has at least one REKT and one SURVIVED path", ({ data }) => {
    const scenario = data as ScenarioDefinition;
    const allChoices = scenario.nodes.flatMap((n) => n.choices);

    const hasRekt = allChoices.some((c) => c.outcome === "rekt");
    const hasSurvived = allChoices.some((c) => c.outcome === "survived");

    expect(hasRekt).toBe(true);
    expect(hasSurvived).toBe(true);
  });

  it.each(ALL_SCENARIOS)("$name has education with red flags and protection tips", ({ data }) => {
    const scenario = data as ScenarioDefinition;
    expect(scenario.education.redFlags.length).toBeGreaterThanOrEqual(2);
    expect(scenario.education.irlProtection.length).toBeGreaterThanOrEqual(2);
    expect(scenario.education.howItWorked.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ALL_SCENARIOS)("$name has passive clues", ({ data }) => {
    const scenario = data as ScenarioDefinition;
    expect(scenario.passiveClues.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ALL_SCENARIOS)("$name has active investigations", ({ data }) => {
    const scenario = data as ScenarioDefinition;
    expect(scenario.activeInvestigations.length).toBeGreaterThanOrEqual(1);
  });

  it.each(ALL_SCENARIOS)("$name has valid difficulty (1-2 for Ch.1)", ({ data }) => {
    const scenario = data as ScenarioDefinition;
    expect(scenario.difficulty).toBeGreaterThanOrEqual(1);
    expect(scenario.difficulty).toBeLessThanOrEqual(2);
  });

  it.each(ALL_SCENARIOS)("$name 'continue' choices have valid nextNodeId", ({ data }) => {
    const scenario = data as ScenarioDefinition;
    const nodeIds = scenario.nodes.map((n) => n.id);

    for (const node of scenario.nodes) {
      for (const choice of node.choices) {
        if (choice.outcome === "continue" && choice.nextNodeId) {
          expect(nodeIds).toContain(choice.nextNodeId);
        }
      }
    }
  });

  it.each(ALL_SCENARIOS)("$name has no duplicate node IDs", ({ data }) => {
    const scenario = data as ScenarioDefinition;
    const nodeIds = scenario.nodes.map((n) => n.id);
    expect(new Set(nodeIds).size).toBe(nodeIds.length);
  });

  it.each(ALL_SCENARIOS)("$name has no duplicate choice IDs within a node", ({ data }) => {
    const scenario = data as ScenarioDefinition;
    for (const node of scenario.nodes) {
      const choiceIds = node.choices.map((c) => c.id);
      expect(new Set(choiceIds).size).toBe(choiceIds.length);
    }
  });
});

// ── Specific scenario checks ────────────────────────────────────────────────────

describe("Chapter 1 specific scenario checks", () => {
  it("ch1-fake-support-dm is difficulty 1, phishing, dm", () => {
    const s = fakeSupportDm as ScenarioDefinition;
    expect(s.difficulty).toBe(1);
    expect(s.category).toBe("phishing");
    expect(s.deliveryChannel).toBe("dm");
    expect(s.isBoss).toBe(false);
  });

  it("ch1-seed-phrase-request is difficulty 1, phishing, notification", () => {
    const s = seedPhraseRequest as ScenarioDefinition;
    expect(s.difficulty).toBe(1);
    expect(s.category).toBe("phishing");
    expect(s.deliveryChannel).toBe("notification");
  });

  it("ch1-fake-airdrop is difficulty 2, honeypot, activity-feed", () => {
    const s = fakeAirdrop as ScenarioDefinition;
    expect(s.difficulty).toBe(2);
    expect(s.category).toBe("honeypot");
    expect(s.deliveryChannel).toBe("activity-feed");
  });

  it("ch1-phishing-email is difficulty 2, phishing, notification", () => {
    const s = phishingEmail as ScenarioDefinition;
    expect(s.difficulty).toBe(2);
    expect(s.category).toBe("phishing");
    expect(s.deliveryChannel).toBe("notification");
  });

  it("ch1-seed-phrase-trap is BOSS, difficulty 2, social-engineering", () => {
    const s = seedPhraseTrap as ScenarioDefinition;
    expect(s.difficulty).toBe(2);
    expect(s.category).toBe("social-engineering");
    expect(s.deliveryChannel).toBe("npc-conversation");
    expect(s.isBoss).toBe(true);
  });

  it("ch1-seed-phrase-trap has 5 nodes (boss length)", () => {
    const s = seedPhraseTrap as ScenarioDefinition;
    expect(s.nodes.length).toBe(5);
  });

  it("ch1-fake-airdrop includes approval-screen node", () => {
    const s = fakeAirdrop as ScenarioDefinition;
    const approvalNode = s.nodes.find((n) => n.id === "approval-screen");
    expect(approvalNode).toBeDefined();

    // Should contain text about UNLIMITED approval
    const allText = approvalNode!.messages.map((m) => m.text).join(" ");
    expect(allText).toContain("UNLIMITED");
  });

  it("scenarios have sequential scenarioIndex 0-4", () => {
    const indices = ALL_SCENARIOS.map((s) => (s.data as ScenarioDefinition).scenarioIndex);
    expect(indices).toEqual([0, 1, 2, 3, 4]);
  });

  it("boss scenario has higher rewards than non-boss", () => {
    const boss = seedPhraseTrap as ScenarioDefinition;
    const nonBoss = fakeSupportDm as ScenarioDefinition;
    expect(boss.survivedRewards.xp).toBeGreaterThan(nonBoss.survivedRewards.xp);
    expect(boss.survivedRewards.coins).toBeGreaterThan(nonBoss.survivedRewards.coins);
  });
});
