import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, fonts, fontSize, spacing } from "../../src/theme";
import NPCDialogue from "../../src/components/NPCDialogue";
import type { NPCChoice } from "../../src/components/NPCDialogue";

// ── NPC data registry ──────────────────────────────────────────────────────────

import satoshiSensei from "../../src/data/npcs/satoshi-sensei.json";
import devDan from "../../src/data/npcs/dev-dan.json";

type NPCData = typeof satoshiSensei;

const NPC_MAP: Record<string, NPCData> = {
  "satoshi-sensei": satoshiSensei,
  "dev-dan": devDan as unknown as NPCData,
};

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function NPCDialogueScreen() {
  const router = useRouter();
  const { npcId, dialogueId } = useLocalSearchParams<{
    npcId: string;
    dialogueId?: string;
  }>();

  const npcData = NPC_MAP[npcId ?? ""];

  // Fallback — NPC not found
  if (!npcData) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.fallbackEmoji}>⚠️</Text>
          <Text style={styles.fallbackTitle}>NPC not found</Text>
          <Text style={styles.fallbackSub}>
            No data for NPC "{npcId}"
          </Text>
        </View>
      </View>
    );
  }

  // Find the requested dialogue (or use the first one)
  const dialogue =
    npcData.dialogues.find((d) => d.id === dialogueId) ??
    npcData.dialogues[0];

  if (!dialogue) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.fallbackEmoji}>⚠️</Text>
          <Text style={styles.fallbackTitle}>Dialogue not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      {/* ── NPC Dialogue ─────────────────────────────────────────── */}
      <NPCDialogue
        npcName={npcData.npcName}
        npcSubtitle={(npcData as any).npcSubtitle}
        npcEmoji={npcData.npcEmoji}
        nameColor={npcData.nameColor}
        borderColor={npcData.borderColor}
        dialogueText={dialogue.dialogueText}
        choices={dialogue.choices as NPCChoice[]}
        warningHint={(npcData as any).warningHint}
        followUp={dialogue.followUp}
        onComplete={() => router.back()}
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
