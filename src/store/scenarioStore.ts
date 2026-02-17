import { create } from "zustand";

/* ── Scenario data types ───────────────────────────────────────────────────── */

export type MessageSender = "system" | "npc";

export type ScenarioMessage = {
  sender: MessageSender;
  text: string;
};

export type ChoiceOutcome = "rekt" | "survived" | "clue" | "hint";

export type ScenarioChoice = {
  id: string;
  text: string;
  outcome: ChoiceOutcome;
  next?: string; // step ID to advance to for "clue" outcomes
};

export type ApprovalPopupData = {
  type: "safe" | "scam";
  actionTitle: string;
  amount: string;
  contract: string;
  verified: boolean;
  gas: string;
};

export type ScenarioStep = {
  id: string;
  messages: ScenarioMessage[];
  choices: ScenarioChoice[];
  approval?: ApprovalPopupData;
};

export type ScenarioEducation = {
  title: string;
  summary: string;
  redFlags: string[];
  tip: string;
};

export type ScenarioData = {
  id: string;
  chapter: number;
  difficulty: number;
  type: string;
  title: string;
  subtitle: string;
  icon: string;
  npcAvatar: string;
  npcName: string;
  steps: ScenarioStep[];
  hints: string[];
  education: ScenarioEducation;
};

/* ── Chat message (rendered in UI) ─────────────────────────────────────────── */

export type ChatMessage = {
  id: string;
  sender: MessageSender | "hint";
  text: string;
};

/* ── Store ─────────────────────────────────────────────────────────────────── */

type ScenarioState = {
  scenario: ScenarioData | null;
  currentStepId: string;
  chatHistory: ChatMessage[];
  hintsUsed: number;
  maxHints: number;
  outcome: "rekt" | "survived" | null;
  showChoices: boolean;

  loadScenario: (data: ScenarioData) => void;
  selectChoice: (choice: ScenarioChoice) => void;
  reset: () => void;
};

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenario: null,
  currentStepId: "",
  chatHistory: [],
  hintsUsed: 0,
  maxHints: 2,
  outcome: null,
  showChoices: false,

  loadScenario: (data) => {
    const firstStep = data.steps[0];
    if (!firstStep) return;

    const initialMessages: ChatMessage[] = firstStep.messages.map((m, i) => ({
      id: `${firstStep.id}-${i}`,
      sender: m.sender,
      text: m.text,
    }));

    set({
      scenario: data,
      currentStepId: firstStep.id,
      chatHistory: initialMessages,
      hintsUsed: 0,
      outcome: null,
      showChoices: true,
    });
  },

  selectChoice: (choice) => {
    const { scenario, chatHistory, hintsUsed, maxHints, currentStepId } = get();
    if (!scenario) return;

    // ── Hint ──────────────────────────────────────────────────────────
    if (choice.outcome === "hint") {
      if (hintsUsed >= maxHints) return;
      const hintText = scenario.hints[hintsUsed] ?? "No more hints available.";
      set({
        chatHistory: [
          ...chatHistory,
          { id: `hint-${hintsUsed}`, sender: "hint", text: `🧠 Sensei: ${hintText}` },
        ],
        hintsUsed: hintsUsed + 1,
      });
      return;
    }

    // Add player's choice as a visible message
    const updatedChat: ChatMessage[] = [
      ...chatHistory,
      { id: `choice-${choice.id}`, sender: "system", text: `You chose: ${choice.text}` },
    ];

    // ── Terminal outcomes ─────────────────────────────────────────────
    if (choice.outcome === "rekt" || choice.outcome === "survived") {
      set({
        chatHistory: updatedChat,
        outcome: choice.outcome,
        showChoices: false,
      });
      return;
    }

    // ── Clue — advance to next step ──────────────────────────────────
    if (choice.outcome === "clue" && choice.next) {
      const nextStep = scenario.steps.find((s) => s.id === choice.next);
      if (!nextStep) return;

      const newMessages: ChatMessage[] = nextStep.messages.map((m, i) => ({
        id: `${nextStep.id}-${i}`,
        sender: m.sender,
        text: m.text,
      }));

      set({
        currentStepId: nextStep.id,
        chatHistory: [...updatedChat, ...newMessages],
        showChoices: true,
      });
    }
  },

  reset: () =>
    set({
      scenario: null,
      currentStepId: "",
      chatHistory: [],
      hintsUsed: 0,
      outcome: null,
      showChoices: false,
    }),
}));
