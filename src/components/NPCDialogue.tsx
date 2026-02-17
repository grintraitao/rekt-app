import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../theme";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface NPCChoice {
  text: string;
  outcome: string;
}

export interface NPCDialogueProps {
  npcName: string;
  npcSubtitle?: string;
  npcEmoji: string;
  nameColor?: string;
  borderColor?: string;
  dialogueText: string | string[];
  choices: NPCChoice[];
  warningHint?: string;
  followUp?: Record<string, string>;
  onChoiceSelected?: (choice: NPCChoice) => void;
  onComplete?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function NPCDialogue({
  npcName,
  npcSubtitle,
  npcEmoji,
  nameColor = colors.green,
  borderColor: portraitBorder = colors.border,
  dialogueText,
  choices,
  warningHint,
  followUp,
  onChoiceSelected,
  onComplete,
}: NPCDialogueProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const lines = Array.isArray(dialogueText) ? dialogueText : [dialogueText];
  const followUpText = selectedOutcome ? followUp?.[selectedOutcome] : null;

  function handleChoice(choice: NPCChoice) {
    setSelectedOutcome(choice.outcome);
    onChoiceSelected?.(choice);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── NPC Portrait ──────────────────────────────────────────────── */}
      <View
        style={[styles.portrait, { borderColor: portraitBorder }]}
      >
        <Text style={styles.portraitEmoji}>{npcEmoji}</Text>
      </View>

      {/* ── Name Tag ──────────────────────────────────────────────────── */}
      <Text style={[styles.nameTag, { color: nameColor }]}>
        {npcName}
        {npcSubtitle ? (
          <Text style={styles.nameSubtitle}> — {npcSubtitle}</Text>
        ) : null}
      </Text>

      {/* ── Dialogue Box ──────────────────────────────────────────────── */}
      <View style={styles.dialogBox}>
        {lines.map((line, i) => (
          <Text key={i} style={styles.dialogText}>
            {line}
          </Text>
        ))}
      </View>

      {/* ── Follow-up response (after choice) ─────────────────────────── */}
      {followUpText && (
        <View style={styles.dialogBox}>
          <Text style={styles.dialogText}>{followUpText}</Text>
        </View>
      )}

      {/* ── Choices ───────────────────────────────────────────────────── */}
      {!selectedOutcome && (
        <View style={styles.choicesContainer}>
          {choices.map((choice, i) => (
            <Pressable
              key={i}
              style={styles.choiceBtn}
              onPress={() => handleChoice(choice)}
            >
              <Text style={styles.choiceText}>{choice.text}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* ── Continue button (after choice) ─────────────────────────────── */}
      {selectedOutcome && (
        <Pressable style={styles.continueBtn} onPress={onComplete}>
          <Text style={styles.continueBtnText}>Continue</Text>
        </Pressable>
      )}

      {/* ── Warning Hint ──────────────────────────────────────────────── */}
      {warningHint && !selectedOutcome && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{warningHint}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing["3xl"],
    paddingBottom: spacing["4xl"],
  },

  /* Portrait */
  portrait: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  portraitEmoji: {
    fontSize: 32,
  },

  /* Name tag */
  nameTag: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  nameSubtitle: {
    color: colors.textMid,
    fontWeight: "400",
  },

  /* Dialogue box */
  dialogBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  dialogText: {
    fontSize: fontSize.md,
    lineHeight: 19,
    color: colors.text,
  },

  /* Choices */
  choicesContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  choiceBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  choiceText: {
    fontSize: fontSize.md,
    color: colors.text,
  },

  /* Continue button */
  continueBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  continueBtnText: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.bg,
  },

  /* Warning hint */
  warningBox: {
    backgroundColor: colors.yellowDim,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.25)",
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  warningText: {
    fontSize: fontSize.md,
    color: colors.yellow,
    textAlign: "center",
  },
});
