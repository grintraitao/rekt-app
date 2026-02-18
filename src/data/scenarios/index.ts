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

// Stub loader for scenarios whose JSON files haven't been created yet.
// Returns a rejected promise so callers know the data is unavailable.
const notYetCreated = (id: string) => (): Promise<ScenarioDefinition> =>
  Promise.reject(new Error(`Scenario "${id}" JSON not yet created`));

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

  // ── Chapter 2: DEX District (JSON files not yet created) ───────────────────
  "ch2-fake-dex": notYetCreated("ch2-fake-dex"),
  "ch2-honeypot-token": notYetCreated("ch2-honeypot-token"),
  "ch2-unlimited-approval": notYetCreated("ch2-unlimited-approval"),
  "ch2-fake-swap": notYetCreated("ch2-fake-swap"),
  "ch2-rug-pull": notYetCreated("ch2-rug-pull"),

  // ── Chapter 3: NFT Bazaar (JSON files not yet created) ─────────────────────
  "ch3-fake-mint": notYetCreated("ch3-fake-mint"),
  "ch3-discord-hack": notYetCreated("ch3-discord-hack"),
  "ch3-counterfeit-nft": notYetCreated("ch3-counterfeit-nft"),
  "ch3-fake-collab": notYetCreated("ch3-fake-collab"),
  "ch3-discord-migration": notYetCreated("ch3-discord-migration"),

  // ── Chapter 4: Bridge City (JSON files not yet created) ────────────────────
  "ch4-fake-bridge": notYetCreated("ch4-fake-bridge"),
  "ch4-chain-approval": notYetCreated("ch4-chain-approval"),
  "ch4-bridge-exploit": notYetCreated("ch4-bridge-exploit"),
  "ch4-fake-l2": notYetCreated("ch4-fake-l2"),
  "ch4-bridge-phishing": notYetCreated("ch4-bridge-phishing"),

  // ── Chapter 5: The Dark Pool (JSON files not yet created) ──────────────────
  "ch5-governance-attack": notYetCreated("ch5-governance-attack"),
  "ch5-social-whale": notYetCreated("ch5-social-whale"),
  "ch5-mev-trap": notYetCreated("ch5-mev-trap"),
  "ch5-insider-info": notYetCreated("ch5-insider-info"),
  "ch5-inside-job": notYetCreated("ch5-inside-job"),
};

/** All known scenario IDs */
export const ALL_SCENARIO_IDS = Object.keys(SCENARIO_REGISTRY);
