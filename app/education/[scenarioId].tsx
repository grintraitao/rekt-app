import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../../src/theme";

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
  const { scenarioId = "" } = useLocalSearchParams<{ scenarioId: string }>();

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

  const difficulty = (edu as any).difficulty ?? scenario.difficulty ?? 1;
  const category = (edu as any).category ?? scenario.type ?? "Unknown";
  const steps: string[] = (edu as any).steps ?? [];
  const irlTips: string[] = (edu as any).irlTips ?? [];

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
        <Text style={styles.headerTitle}>{edu.title}</Text>
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

        {/* ── Continue button ─────────────────────────────────────────── */}
        <Pressable
          style={styles.continueBtn}
          onPress={() => router.replace("/(tabs)" as never)}
        >
          <Text style={styles.continueBtnText}>Got it! Continue →</Text>
        </Pressable>
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

  /* Continue button */
  continueBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    marginTop: spacing["2xl"],
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
