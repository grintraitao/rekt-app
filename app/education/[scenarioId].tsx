import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../../src/theme";
import { usePlayerStore } from "../../src/store/playerStore";

// ── Scenario data registry (same as scenario screen) ──────────────────────
import fakeSupport from "../../src/data/scenarios/ch1-fake-support-dm.json";
import approvalScam from "../../src/data/scenarios/ch1-approval-scam.json";

const SCENARIO_MAP: Record<string, typeof fakeSupport> = {
  "ch1-fake-support-dm": fakeSupport,
  "ch1-approval-scam": approvalScam as unknown as typeof fakeSupport,
};

/* ── Difficulty stars helper ───────────────────────────────────────────────── */

function difficultyStars(level: number): string {
  const filled = Math.min(level, 5);
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function EducationPostMortem() {
  const router = useRouter();
  const updateStat = usePlayerStore((s) => s.updateStat);
  const addXP = usePlayerStore((s) => s.addXP);
  const {
    scenarioId = "",
    outcomeType = "",
    amount = "",
    detail = "",
  } = useLocalSearchParams<{
    scenarioId: string;
    outcomeType: string;
    amount: string;
    detail: string;
  }>();

  const scenario = SCENARIO_MAP[scenarioId];
  const edu = scenario?.education;

  if (!edu) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.fallbackEmoji}>📚</Text>
          <Text style={styles.fallbackTitle}>No data found</Text>
          <Text style={styles.fallbackSub}>
            Education content for "{scenarioId}" is not available.
          </Text>
        </View>
      </View>
    );
  }

  const difficulty = scenario.difficulty ?? 1;
  const category = edu.category ?? scenario.category ?? "Unknown";
  const steps: string[] = edu.howItWorked?.map((s: { text: string }) => s.text) ?? [];
  const irlTips: string[] = edu.irlProtection ?? [];

  return (
    <View style={styles.container}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Text style={styles.headerLabel}>ATTACK ANALYSIS</Text>
        <Text style={styles.headerTitle}>{edu.attackName}</Text>
        <Text style={styles.headerSub}>
          {difficultyStars(difficulty)} · {category}
        </Text>

        {/* ── How it worked ───────────────────────────────────────────── */}
        {steps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>How it worked</Text>
            <View style={styles.stepsContainer}>
              {steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Red flags ───────────────────────────────────────────────── */}
        {edu.redFlags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Red flags</Text>
            <View style={styles.redFlagsCard}>
              {edu.redFlags.map((flag, i) => (
                <Text key={i} style={styles.redFlagText}>
                  {flag}
                </Text>
              ))}
            </View>
          </>
        )}

        {/* ── IRL Protection ──────────────────────────────────────────── */}
        {irlTips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>IRL Protection</Text>
            <View style={styles.irlCard}>
              {irlTips.map((tip, i) => (
                <Text key={i} style={styles.irlText}>
                  {tip}
                </Text>
              ))}
            </View>
          </>
        )}

        {/* ── Action buttons ─────────────────────────────────────────── */}
        <View style={styles.actionButtons}>
          {outcomeType && amount ? (
            <Pressable
              style={styles.shareBtn}
              onPress={() => {
                const isRekt = outcomeType === "rekt";
                router.push({
                  pathname: "/share-card",
                  params: {
                    type: outcomeType,
                    amount,
                    detail: detail || edu.attackName,
                    stat: isRekt ? "73% fell for this" : "Top 27% safest",
                  },
                } as never);
              }}
            >
              <Text style={styles.shareBtnText}>📸 Share Result</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.continueBtn}
            onPress={() => {
              updateStat("knowledge", 5);
              addXP(30);
              router.replace("/(tabs)" as never);
            }}
          >
            <Text style={styles.continueBtnText}>Back to Wallet →</Text>
          </Pressable>
        </View>
      </ScrollView>
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

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing["4xl"],
  },

  /* Header */
  headerLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.red,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSub: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginBottom: spacing["2xl"],
  },

  /* Section titles */
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },

  /* How it worked steps */
  stepsContainer: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.greenDim,
    borderWidth: 1,
    borderColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNum: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.green,
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.md,
    lineHeight: 18,
    color: colors.text,
  },

  /* Red flags card */
  redFlagsCard: {
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: "rgba(255, 51, 102, 0.2)",
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  redFlagText: {
    fontSize: fontSize.md,
    lineHeight: 18,
    color: colors.red,
  },

  /* IRL Protection card */
  irlCard: {
    backgroundColor: colors.greenDim,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.2)",
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  irlText: {
    fontSize: fontSize.md,
    lineHeight: 18,
    color: colors.green,
  },

  /* Action buttons */
  actionButtons: {
    gap: spacing.sm,
    marginTop: spacing["2xl"],
  },
  shareBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
  },
  shareBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
  },
  continueBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
  },
  continueBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.bg,
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
