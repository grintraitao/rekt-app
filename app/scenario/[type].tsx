import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../../src/theme";
import {
  useScenarioStore,
  registerScenario,
  type ScenarioMessage,
  type ScenarioChoice,
  type ScamCategory,
} from "../../src/store/scenarioStore";
import { usePlayerStore } from "../../src/store/playerStore";
import { usePortfolioStore } from "../../src/store/portfolioStore";
import { GearEngine } from "../../src/engine/GearEngine";
import { ClassAbilityEngine } from "../../src/engine/ClassAbilityEngine";
import ApprovalPopup from "../../src/components/ApprovalPopup";

// ── Scenario data registry ────────────────────────────────────────────────
import fakeSupport from "../../src/data/scenarios/ch1-fake-support-dm.json";
import approvalScam from "../../src/data/scenarios/ch1-approval-scam.json";

// Register scenarios so scenarioStore.loadScenario(id) can find them
registerScenario(fakeSupport as any);
registerScenario(approvalScam as any);

// Maps route param → scenario ID for backward compatibility
const SCENARIO_ID_MAP: Record<string, string> = {
  phishing: "ch1-fake-support-dm",
  "fake-airdrop": "ch1-fake-support-dm",
  impersonation: "ch1-fake-support-dm",
  "fake-support-dm": "ch1-fake-support-dm",
  honeypot: "ch1-approval-scam",
  "approval-scam": "ch1-approval-scam",
};

/* ── Chat bubble ───────────────────────────────────────────────────────────── */

function ChatBubble({
  msg,
  npcAvatar,
}: {
  msg: ScenarioMessage;
  npcAvatar: string;
}) {
  if (msg.sender === "system") {
    // Hint messages from Sensei use hint styling
    if (msg.senderName === "Sensei") {
      return (
        <View style={styles.hintBubble}>
          <Text style={styles.hintText}>{msg.text}</Text>
        </View>
      );
    }
    return (
      <View style={styles.systemBubble}>
        <Text style={styles.systemText}>{msg.text}</Text>
      </View>
    );
  }

  if (msg.sender === "player") {
    return (
      <View style={styles.systemBubble}>
        <Text style={styles.systemText}>{msg.text}</Text>
      </View>
    );
  }

  // NPC message
  return (
    <View style={styles.npcRow}>
      <View style={styles.npcAvatar}>
        <Text style={styles.npcAvatarText}>{npcAvatar}</Text>
      </View>
      <View style={styles.npcBubble}>
        <Text style={styles.npcText}>{msg.text}</Text>
      </View>
    </View>
  );
}

/* ── Choice button ─────────────────────────────────────────────────────────── */

function ChoiceButton({
  choice,
  hintsUsed,
  maxHints,
  onPress,
}: {
  choice: ScenarioChoice;
  hintsUsed: number;
  maxHints: number;
  onPress: () => void;
}) {
  const isHint = choice.outcome === "hint";
  const hintsLeft = maxHints - hintsUsed;
  const disabled = isHint && hintsLeft <= 0;

  return (
    <Pressable
      style={[styles.choiceBtn, disabled && styles.choiceBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.choiceText, disabled && styles.choiceTextDisabled]}>
        {isHint ? `${choice.text} (${hintsLeft} left)` : choice.text}
      </Text>
    </Pressable>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function ScamScenarioScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const scenario = useScenarioStore((s) => s.activeScenario);
  const currentNodeId = useScenarioStore((s) => s.currentNodeId);
  const visibleMessages = useScenarioStore((s) => s.visibleMessages);
  const choicesVisible = useScenarioStore((s) => s.choicesVisible);
  const outcome = useScenarioStore((s) => s.outcome);
  const senseiUsesLeft = useScenarioStore((s) => s.senseiUsesLeft);
  const loadScenario = useScenarioStore((s) => s.loadScenario);
  const startScenario = useScenarioStore((s) => s.startScenario);
  const selectChoice = useScenarioStore((s) => s.selectChoice);
  const resetScenario = useScenarioStore((s) => s.resetScenario);

  const playerClass = usePlayerStore((s) => s.playerClass);
  const equippedGear = usePlayerStore((s) => s.equippedGear);
  const abilityUsesRemaining = usePlayerStore((s) => s.abilityUsesRemaining);
  const useAbilityAction = usePlayerStore((s) => s.useAbility);
  const totalValue = usePortfolioStore((s) => s.totalValue);
  const [autoDetected, setAutoDetected] = useState(false);

  const MAX_HINTS = 2;

  // Load scenario on mount
  useEffect(() => {
    // Resolve route param to scenario ID
    const scenarioId = SCENARIO_ID_MAP[type ?? ""] ?? type ?? "";
    if (scenarioId) {
      loadScenario(scenarioId);
      startScenario();
    }
    return () => resetScenario();
  }, [type]);

  // Check gear auto-detect and class abilities after scenario loads
  useEffect(() => {
    if (!scenario || autoDetected) return;

    const category = scenario.category as ScamCategory;

    // Check gear auto-detect
    const gearResult = GearEngine.rollAutoDetect(equippedGear, category);
    if (gearResult.detected) {
      setAutoDetected(true);
      return;
    }

    // Check class ability
    if (playerClass && abilityUsesRemaining > 0) {
      const abilityResult = ClassAbilityEngine.checkAbility(
        playerClass,
        category,
        abilityUsesRemaining,
        scenario,
      );
      if (abilityResult.abilityTriggered) {
        useAbilityAction();
        setAutoDetected(true);
      }
    }
  }, [scenario?.id]);

  // If auto-detected, navigate to survived after a delay
  useEffect(() => {
    if (!autoDetected || !scenario) return;
    const timer = setTimeout(() => {
      router.replace({
        pathname: "/outcome/survived",
        params: {
          amountSaved: String(Math.round(totalValue * 0.1)),
          blockedAttack: scenario.education?.attackName ?? "Unknown Scam",
          scenarioId: scenario.id ?? "",
        },
      } as never);
    }, 1500);
    return () => clearTimeout(timer);
  }, [autoDetected]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [visibleMessages.length, choicesVisible]);

  // Navigate on outcome — pass scenario context to outcome screens
  useEffect(() => {
    if (!outcome) return;
    const lossAmount = Math.round(totalValue * 0.3);
    const savedAmount = Math.round(totalValue * 0.1);
    const timer = setTimeout(() => {
      if (outcome === "rekt") {
        router.replace({
          pathname: "/outcome/rekt",
          params: {
            amountLost: String(lossAmount),
            attackType: scenario?.education?.attackName ?? "Unknown Scam",
            scenarioId: scenario?.id ?? "",
          },
        } as never);
      } else {
        router.replace({
          pathname: "/outcome/survived",
          params: {
            amountSaved: String(savedAmount),
            blockedAttack: scenario?.education?.attackName ?? "Unknown Scam",
            scenarioId: scenario?.id ?? "",
          },
        } as never);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [outcome]);

  // Current node's choices & approval data
  const currentNode = scenario?.nodes.find((n) => n.id === currentNodeId);
  const choices = currentNode?.choices ?? [];
  const approvalData = (currentNode as any)?.approval;
  const [showApproval, setShowApproval] = useState(false);

  // Show approval popup when node has approval data
  useEffect(() => {
    if (approvalData && choicesVisible && !outcome) {
      const timer = setTimeout(() => setShowApproval(true), 400);
      return () => clearTimeout(timer);
    }
    setShowApproval(false);
  }, [currentNodeId, approvalData, choicesVisible, outcome]);

  // Show auto-detect screen
  if (autoDetected && scenario) {
    return (
      <View style={styles.container}>
        <View style={[styles.center, { gap: 12 }]}>
          <Text style={{ fontSize: 48 }}>🛡️</Text>
          <Text style={[styles.scenarioTitle, { color: colors.green, fontSize: 18 }]}>
            SCAM AUTO-DETECTED!
          </Text>
          <Text style={{ color: colors.textDim, textAlign: "center", fontSize: 13, paddingHorizontal: 32 }}>
            Your gear or class ability detected this scam before it could harm you.
          </Text>
        </View>
      </View>
    );
  }

  // Fallback if no scenario data found
  if (!scenario) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.fallbackEmoji}>⚠️</Text>
          <Text style={styles.fallbackTitle}>Scenario not found</Text>
          <Text style={styles.fallbackSub}>
            No scenario data for type "{type}"
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => { resetScenario(); router.back(); }}>
          <Text style={styles.backText}>← Notifications</Text>
        </Pressable>
      </View>

      {/* ── Scenario header ──────────────────────────────────────────── */}
      <View style={styles.scenarioHeader}>
        <Text style={styles.scenarioIcon}>{scenario.icon}</Text>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.scenarioSub}>{scenario.subtitle}</Text>
      </View>

      {/* ── Chat area ────────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {visibleMessages.map((msg: ScenarioMessage) => (
          <ChatBubble
            key={msg.id}
            msg={msg}
            npcAvatar={scenario.npcAvatar}
          />
        ))}

        {/* Outcome flash */}
        {outcome && (
          <View
            style={[
              styles.outcomeBanner,
              outcome === "rekt" ? styles.outcomeBannerRekt : styles.outcomeBannerSurvived,
            ]}
          >
            <Text style={styles.outcomeEmoji}>
              {outcome === "rekt" ? "💀" : "🛡️"}
            </Text>
            <Text
              style={[
                styles.outcomeText,
                { color: outcome === "rekt" ? colors.red : colors.green },
              ]}
            >
              {outcome === "rekt" ? "YOU GOT REKT" : "SURVIVED!"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Choices (hidden when approval popup is active) ─────────── */}
      {choicesVisible && !outcome && !approvalData && (
        <View style={styles.choicesContainer}>
          <Text style={styles.choicesLabel}>YOUR RESPONSE:</Text>
          {choices.map((c: ScenarioChoice) => (
            <ChoiceButton
              key={c.id}
              choice={c}
              hintsUsed={MAX_HINTS - senseiUsesLeft}
              maxHints={MAX_HINTS}
              onPress={() => selectChoice(c.id)}
            />
          ))}
        </View>
      )}

      {/* ── Approval Popup ─────────────────────────────────────────── */}
      {approvalData && (
        <ApprovalPopup
          visible={showApproval}
          type={approvalData.type as "safe" | "scam"}
          details={approvalData}
          onApprove={() => {
            setShowApproval(false);
            if (approvalData.type === "scam") {
              selectChoice("approve-scam");
            } else {
              // Safe approval — proceed back to wallet
              resetScenario();
              router.replace("/(tabs)" as never);
            }
          }}
          onReject={() => {
            setShowApproval(false);
            if (approvalData.type === "scam") {
              selectChoice("reject-scam");
            }
            // Safe rejection — stay on current screen, go back to previous step
            // (dismiss popup, user can navigate back)
          }}
        />
      )}
    </View>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* Top bar */
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.green,
  },

  /* Scenario header */
  scenarioHeader: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scenarioIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  scenarioTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  scenarioSub: {
    fontSize: fontSize.sm,
    color: colors.textDim,
  },

  /* Chat area */
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.lg,
    gap: 6,
    paddingBottom: spacing["2xl"],
  },

  /* System bubble */
  systemBubble: {
    alignSelf: "center",
    backgroundColor: colors.purpleDim,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  systemText: {
    fontSize: fontSize.sm,
    color: colors.purple,
    textAlign: "center",
  },

  /* Hint bubble */
  hintBubble: {
    alignSelf: "center",
    backgroundColor: colors.cyanDim,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.2)",
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.cyan,
    textAlign: "center",
  },

  /* NPC bubble */
  npcRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginVertical: 2,
  },
  npcAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  npcAvatarText: {
    fontSize: 12,
  },
  npcBubble: {
    maxWidth: "82%" as unknown as number,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  npcText: {
    fontSize: 11,
    lineHeight: 16.5,
    color: colors.text,
  },

  /* Outcome banner */
  outcomeBanner: {
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["2xl"],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
  },
  outcomeBannerRekt: {
    backgroundColor: colors.redDim,
    borderColor: "rgba(255, 51, 102, 0.3)",
  },
  outcomeBannerSurvived: {
    backgroundColor: colors.greenDim,
    borderColor: "rgba(0, 255, 136, 0.3)",
  },
  outcomeEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  outcomeText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    fontWeight: "700",
    letterSpacing: 2,
  },

  /* Choices */
  choicesContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  choicesLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  choiceBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: 5,
  },
  choiceBtnDisabled: {
    opacity: 0.35,
  },
  choiceText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  choiceTextDisabled: {
    color: colors.textDim,
  },

  /* Fallback */
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
  },
  fallbackEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  fallbackTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  fallbackSub: {
    fontSize: fontSize.lg,
    color: colors.textMid,
    textAlign: "center",
  },
});
