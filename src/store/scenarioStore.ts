import { create } from "zustand";
import { usePlayerStore } from "./playerStore";
import { usePortfolioStore } from "./portfolioStore";

// ── Type Definitions ────────────────────────────────────────────────────────────

export type ScamCategory =
  | "phishing"
  | "honeypot"
  | "social-engineering"
  | "smart-contract"
  | "rug-pull";

export type DeliveryChannel =
  | "notification"
  | "dm"
  | "activity-feed"
  | "approval-popup"
  | "npc-conversation";

export type ChoiceOutcome =
  | "rekt"
  | "survived"
  | "clue"
  | "hint"
  | "continue"
  | "approval-popup";

export interface ScenarioMessage {
  id: string;
  sender: "npc" | "system" | "player";
  senderName?: string;
  senderAvatar?: string;
  text: string;
  delay?: number;
}

export interface ScenarioChoice {
  id: string;
  text: string;
  emoji: string;
  outcome: ChoiceOutcome;
  nextNodeId?: string;
  xpReward?: number;
  statChange?: { stat: string; amount: number };
  revealText?: string;
  damageAmount?: number;
}

export interface ScenarioNode {
  id: string;
  messages: ScenarioMessage[];
  choices: ScenarioChoice[];
  isEnd?: boolean;
}

export interface ScenarioEducation {
  attackName: string;
  difficulty: string;
  category: ScamCategory;
  howItWorked: Array<{ step: number; text: string; highlight?: string }>;
  redFlags: string[];
  irlProtection: string[];
}

export interface ScenarioDefinition {
  id: string;
  chapter: number;
  scenarioIndex: number;
  title: string;
  subtitle: string;
  icon: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: ScamCategory;
  deliveryChannel: DeliveryChannel;
  npcAvatar: string;
  npcName: string;
  isBoss: boolean;

  // Dialogue tree
  nodes: ScenarioNode[];

  // Passive clues
  passiveClues: string[];

  // Active investigation options
  activeInvestigations: Array<{
    type:
      | "inspect-link"
      | "check-contract"
      | "verify-identity"
      | "search-news"
      | "ask-sensei";
    result: string;
    cost?: number;
  }>;

  // Education content
  education: ScenarioEducation;

  // Rewards/Consequences
  rektConsequences: {
    moneyLost: number;
    moneyLostType: "fixed" | "percentage";
    hpLost: number;
    streakBroken: boolean;
  };
  survivedRewards: {
    xp: number;
    securityTokens: number;
    coins: number;
    statBoosts: Array<{ stat: string; amount: number }>;
  };

  // Stats
  communityRektRate: number;
}

// ── Runtime State ───────────────────────────────────────────────────────────────

export interface ScenarioState {
  // Current scenario
  activeScenario: ScenarioDefinition | null;
  currentNodeId: string;

  // Dialogue state
  visibleMessages: ScenarioMessage[];
  isTyping: boolean;

  // Player state within scenario
  choicesMade: string[];
  cluesDiscovered: string[];
  senseiUsesLeft: number;

  // Outcome
  outcome: "rekt" | "survived" | null;
  outcomeDetails: {
    choiceThatCausedIt: string;
    amountLost?: number;
    amountSaved?: number;
    attackType?: string;
  } | null;

  // UI helpers
  choicesVisible: boolean;
  approvalPopupVisible: boolean;
  messageRevealIndex: number;
}

interface ScenarioActions {
  // Scenario lifecycle
  loadScenario: (scenarioId: string) => void;
  startScenario: () => void;
  getCurrentNode: () => ScenarioNode | null;

  // Dialogue progression
  revealNextMessage: () => void;
  showChoices: () => void;

  // Player actions
  selectChoice: (choiceId: string) => void;

  // Investigation
  performInvestigation: (type: string) => void;

  // Outcome processing
  processRekt: () => void;
  processSurvived: () => void;

  // Education
  getEducation: () => ScenarioEducation | null;

  // Reset
  resetScenario: () => void;
}

// ── Scenario Registry ───────────────────────────────────────────────────────────
// Register scenario definitions here so loadScenario(id) can find them.

const scenarioRegistry = new Map<string, ScenarioDefinition>();

export function registerScenario(scenario: ScenarioDefinition): void {
  scenarioRegistry.set(scenario.id, scenario);
}

export function registerScenarios(scenarios: ScenarioDefinition[]): void {
  for (const s of scenarios) {
    scenarioRegistry.set(s.id, s);
  }
}

export function getRegisteredScenario(
  id: string,
): ScenarioDefinition | undefined {
  return scenarioRegistry.get(id);
}

// ── Initial State ───────────────────────────────────────────────────────────────

const INITIAL_STATE: ScenarioState = {
  activeScenario: null,
  currentNodeId: "",

  visibleMessages: [],
  isTyping: false,

  choicesMade: [],
  cluesDiscovered: [],
  senseiUsesLeft: 2,

  outcome: null,
  outcomeDetails: null,

  choicesVisible: false,
  approvalPopupVisible: false,
  messageRevealIndex: 0,
};

// ── Store ───────────────────────────────────────────────────────────────────────

export const useScenarioStore = create<ScenarioState & ScenarioActions>()(
  (set, get) => ({
    ...INITIAL_STATE,

    // ── Scenario Lifecycle ──────────────────────────────────────────────

    loadScenario: (scenarioId) => {
      const scenario = scenarioRegistry.get(scenarioId);
      if (!scenario) return;

      set({
        ...INITIAL_STATE,
        activeScenario: scenario,
        currentNodeId: scenario.nodes[0]?.id ?? "",
        senseiUsesLeft: 2,
      });
    },

    startScenario: () => {
      const { activeScenario } = get();
      if (!activeScenario) return;

      const firstNode = activeScenario.nodes[0];
      if (!firstNode) return;

      // Reveal all messages from the first node immediately
      set({
        currentNodeId: firstNode.id,
        visibleMessages: [...firstNode.messages],
        messageRevealIndex: firstNode.messages.length,
        isTyping: false,
        choicesVisible: true,
      });
    },

    getCurrentNode: () => {
      const { activeScenario, currentNodeId } = get();
      if (!activeScenario) return null;
      return (
        activeScenario.nodes.find((n) => n.id === currentNodeId) ?? null
      );
    },

    // ── Dialogue Progression ────────────────────────────────────────────

    revealNextMessage: () => {
      const node = get().getCurrentNode();
      if (!node) return;

      const idx = get().messageRevealIndex;
      if (idx >= node.messages.length) return;

      const nextMsg = node.messages[idx];
      const isLast = idx + 1 >= node.messages.length;

      set((s) => ({
        visibleMessages: [...s.visibleMessages, nextMsg],
        messageRevealIndex: idx + 1,
        isTyping: !isLast,
        choicesVisible: isLast,
      }));
    },

    showChoices: () => {
      set({ choicesVisible: true, isTyping: false });
    },

    // ── Player Actions ──────────────────────────────────────────────────

    selectChoice: (choiceId) => {
      const { activeScenario, visibleMessages, senseiUsesLeft } = get();
      if (!activeScenario) return;

      const node = get().getCurrentNode();
      if (!node) return;

      const choice = node.choices.find((c) => c.id === choiceId);
      if (!choice) return;

      // Track choice
      set((s) => ({ choicesMade: [...s.choicesMade, choiceId] }));

      // Player's message bubble
      const playerMsg: ScenarioMessage = {
        id: `player-${choiceId}`,
        sender: "player",
        text: `${choice.emoji} ${choice.text}`,
      };

      switch (choice.outcome) {
        case "rekt": {
          const moneyLost =
            choice.damageAmount ?? activeScenario.rektConsequences.moneyLost;

          set({
            visibleMessages: [...visibleMessages, playerMsg],
            outcome: "rekt",
            outcomeDetails: {
              choiceThatCausedIt: choiceId,
              amountLost: moneyLost,
              attackType: activeScenario.education.attackName,
            },
            choicesVisible: false,
            approvalPopupVisible: false,
          });
          break;
        }

        case "survived": {
          set({
            visibleMessages: [...visibleMessages, playerMsg],
            outcome: "survived",
            outcomeDetails: {
              choiceThatCausedIt: choiceId,
              amountSaved: usePortfolioStore.getState().totalValue,
              attackType: activeScenario.education.attackName,
            },
            choicesVisible: false,
            approvalPopupVisible: false,
          });
          break;
        }

        case "clue": {
          const clueMsg: ScenarioMessage = {
            id: `clue-${choiceId}`,
            sender: "system",
            text: choice.revealText ?? "No additional information.",
          };
          set((s) => ({
            visibleMessages: [...visibleMessages, playerMsg, clueMsg],
            cluesDiscovered: [
              ...s.cluesDiscovered,
              choice.revealText ?? "",
            ],
          }));
          break;
        }

        case "hint": {
          if (senseiUsesLeft <= 0) return;

          const hintMsg: ScenarioMessage = {
            id: `hint-${choiceId}`,
            sender: "system",
            senderName: "Sensei",
            text: `\uD83E\uDDE0 ${choice.revealText ?? "Trust your instincts."}`,
          };
          set((s) => ({
            visibleMessages: [...s.visibleMessages, playerMsg, hintMsg],
            senseiUsesLeft: s.senseiUsesLeft - 1,
          }));
          break;
        }

        case "continue": {
          if (!choice.nextNodeId) return;

          const nextNode = activeScenario.nodes.find(
            (n) => n.id === choice.nextNodeId,
          );
          if (!nextNode) return;

          // Apply immediate rewards for intermediate choices
          if (choice.xpReward) {
            usePlayerStore.getState().addXP(choice.xpReward);
          }
          if (choice.statChange) {
            usePlayerStore
              .getState()
              .updateStat(
                choice.statChange.stat as "security" | "detection" | "wealth" | "knowledge" | "hp",
                choice.statChange.amount,
              );
          }

          set({
            currentNodeId: choice.nextNodeId,
            visibleMessages: [
              ...visibleMessages,
              playerMsg,
              ...nextNode.messages,
            ],
            messageRevealIndex: nextNode.messages.length,
            isTyping: false,
            choicesVisible: !nextNode.isEnd,
          });
          break;
        }

        case "approval-popup": {
          set({
            visibleMessages: [...visibleMessages, playerMsg],
            approvalPopupVisible: true,
            choicesVisible: false,
          });
          break;
        }
      }
    },

    // ── Investigation ───────────────────────────────────────────────────

    performInvestigation: (type) => {
      const { activeScenario } = get();
      if (!activeScenario) return;

      const investigation = activeScenario.activeInvestigations.find(
        (inv) => inv.type === type,
      );
      if (!investigation) return;

      // Check if already discovered
      if (get().cluesDiscovered.includes(investigation.result)) return;

      // Deduct cost if applicable (uses sensei charges as currency)
      if (investigation.cost && investigation.cost > 0) {
        const { senseiUsesLeft } = get();
        if (senseiUsesLeft < investigation.cost) return;
        set((s) => ({
          senseiUsesLeft: s.senseiUsesLeft - investigation.cost!,
        }));
      }

      const resultMsg: ScenarioMessage = {
        id: `investigate-${type}`,
        sender: "system",
        text: `\uD83D\uDD0D ${investigation.result}`,
      };

      set((s) => ({
        visibleMessages: [...s.visibleMessages, resultMsg],
        cluesDiscovered: [...s.cluesDiscovered, investigation.result],
      }));
    },

    // ── Outcome Processing ──────────────────────────────────────────────

    processRekt: () => {
      const { activeScenario, outcomeDetails } = get();
      if (!activeScenario || !outcomeDetails) return;

      const consequences = activeScenario.rektConsequences;
      const player = usePlayerStore.getState();
      const portfolio = usePortfolioStore.getState();

      // Apply HP loss
      player.takeDamage(consequences.hpLost);

      // Apply money loss
      if (consequences.moneyLostType === "fixed") {
        portfolio.drainFunds(
          consequences.moneyLost,
          `REKT: ${activeScenario.title}`,
        );
      } else {
        const amount = portfolio.totalValue * (consequences.moneyLost / 100);
        portfolio.drainFunds(amount, `REKT: ${activeScenario.title}`);
      }

      // Add loss transaction
      portfolio.addTransaction({
        type: "rekt-loss",
        label: `REKT: ${activeScenario.title}`,
        sublabel: activeScenario.education.attackName,
        amount: -(outcomeDetails.amountLost ?? 0),
        isSuspicious: true,
        linkedScenarioId: activeScenario.id,
      });

      // Break streak if specified
      if (consequences.streakBroken) {
        player.breakStreak();
      }

      // Record rekt in player stats
      player.recordRekt();
      player.completeScenario(activeScenario.id);
    },

    processSurvived: () => {
      const { activeScenario } = get();
      if (!activeScenario) return;

      const rewards = activeScenario.survivedRewards;
      const player = usePlayerStore.getState();
      const portfolio = usePortfolioStore.getState();

      // Apply XP
      player.addXP(rewards.xp);

      // Apply security tokens
      player.addSecurityTokens(rewards.securityTokens);

      // Apply coins
      player.addCoins(rewards.coins);

      // Apply stat boosts
      for (const boost of rewards.statBoosts) {
        player.updateStat(
          boost.stat as "security" | "detection" | "wealth" | "knowledge" | "hp",
          boost.amount,
        );
      }

      // Add reward transaction
      portfolio.addTransaction({
        type: "received",
        label: `Survived: ${activeScenario.title}`,
        sublabel: `+${rewards.xp} XP, +${rewards.coins} coins`,
        amount: rewards.coins,
        isSuspicious: false,
        linkedScenarioId: activeScenario.id,
      });

      // Record survived in player stats
      player.recordSurvive();
      player.completeScenario(activeScenario.id);
    },

    // ── Education ───────────────────────────────────────────────────────

    getEducation: () => {
      const { activeScenario } = get();
      return activeScenario?.education ?? null;
    },

    // ── Reset ───────────────────────────────────────────────────────────

    resetScenario: () => set({ ...INITIAL_STATE }),
  }),
);
