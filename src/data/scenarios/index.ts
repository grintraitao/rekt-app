/**
 * Scenario Registry
 *
 * Maps scenario IDs to lazy-loaded JSON imports. The engine calls these
 * functions to load scenario data on demand without bundling everything
 * up-front.
 *
 * To add a new scenario:
 *  1. Create src/data/scenarios/{scenarioId}.json
 *  2. Add an entry to SCENARIO_REGISTRY below
 */

import type { ScenarioDefinition } from "../../store/scenarioStore";

// Each entry is a lazy loader that returns the scenario JSON module.
// The `then(m => m.default)` normalises both `import()` styles.
export const SCENARIO_REGISTRY: Record<
  string,
  () => Promise<ScenarioDefinition>
> = {
  // ── Chapter 1: Genesis Block ────────────────────────────────────────────────
  "ch1-fake-support-dm": () =>
    import("./ch1-fake-support-dm.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch1-seed-phrase-request": () =>
    import("./ch1-seed-phrase-request.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch1-fake-airdrop": () =>
    import("./ch1-fake-airdrop.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch1-phishing-email": () =>
    import("./ch1-phishing-email.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch1-seed-phrase-trap": () =>
    import("./ch1-seed-phrase-trap.json").then((m) => m.default as unknown as ScenarioDefinition),

  // ── Chapter 2: DEX District ─────────────────────────────────────────────────
  "ch2-fake-dex": () =>
    import("./ch2-fake-dex.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch2-honeypot-token": () =>
    import("./ch2-honeypot-token.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch2-unlimited-approval": () =>
    import("./ch2-unlimited-approval.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch2-fake-swap": () =>
    import("./ch2-fake-swap.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch2-rug-pull": () =>
    import("./ch2-rug-pull.json").then((m) => m.default as unknown as ScenarioDefinition),

  // ── Chapter 3: NFT Bazaar ───────────────────────────────────────────────────
  "ch3-fake-mint": () =>
    import("./ch3-fake-mint.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch3-discord-hack": () =>
    import("./ch3-discord-hack.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch3-counterfeit-nft": () =>
    import("./ch3-counterfeit-nft.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch3-fake-collab": () =>
    import("./ch3-fake-collab.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch3-discord-migration": () =>
    import("./ch3-discord-migration.json").then((m) => m.default as unknown as ScenarioDefinition),

  // ── Chapter 4: Bridge City ──────────────────────────────────────────────────
  "ch4-fake-bridge": () =>
    import("./ch4-fake-bridge.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch4-chain-approval": () =>
    import("./ch4-chain-approval.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch4-bridge-exploit": () =>
    import("./ch4-bridge-exploit.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch4-fake-l2": () =>
    import("./ch4-fake-l2.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch4-bridge-phishing": () =>
    import("./ch4-bridge-phishing.json").then((m) => m.default as unknown as ScenarioDefinition),

  // ── Chapter 5: The Dark Pool ────────────────────────────────────────────────
  "ch5-governance-attack": () =>
    import("./ch5-governance-attack.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch5-social-whale": () =>
    import("./ch5-social-whale.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch5-mev-trap": () =>
    import("./ch5-mev-trap.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch5-insider-info": () =>
    import("./ch5-insider-info.json").then((m) => m.default as unknown as ScenarioDefinition),
  "ch5-inside-job": () =>
    import("./ch5-inside-job.json").then((m) => m.default as unknown as ScenarioDefinition),
};

/** All known scenario IDs */
export const ALL_SCENARIO_IDS = Object.keys(SCENARIO_REGISTRY);
