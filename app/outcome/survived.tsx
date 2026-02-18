import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../../src/theme";
import { usePlayerStore } from "../../src/store/playerStore";
import { usePortfolioStore } from "../../src/store/portfolioStore";

/* ── Constants ─────────────────────────────────────────────────────────────── */

const XP_REWARD = 350;
const TOKEN_REWARD = 2;

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function SurvivedScreen() {
  const router = useRouter();
  const {
    amountSaved = "47832",
    blockedAttack = "Fake DM Phishing",
    scenarioId = "",
  } = useLocalSearchParams<{
    amountSaved: string;
    blockedAttack: string;
    scenarioId: string;
  }>();

  const savedNum = parseInt(amountSaved, 10) || 47832;
  const streak = usePortfolioStore((s) => s.streak);
  const incrementStreak = usePortfolioStore((s) => s.incrementStreak);
  const addXp = usePlayerStore((s) => s.addXp);
  const addSecurityTokens = usePlayerStore((s) => s.addSecurityTokens);
  const completeScenario = usePlayerStore((s) => s.completeScenario);
  const recordSurvive = usePlayerStore((s) => s.recordSurvive);

  // ── Pulse / glow animation ───────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Apply rewards
    addXp(XP_REWARD);
    addSecurityTokens(TOKEN_REWARD);
    incrementStreak();
    recordSurvive();
    if (scenarioId) completeScenario(scenarioId);

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse glow on shield
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const formattedSaved = savedNum.toLocaleString("en-US");
  // streak was already incremented, display the new value
  const displayStreak = streak;

  return (
    <View style={styles.container}>
      {/* Green border tint */}
      <View style={styles.greenBorder} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Shield + title */}
        <Animated.Text
          style={[styles.emoji, { transform: [{ scale: pulseAnim }] }]}
        >
          🛡️
        </Animated.Text>
        <Text style={styles.title}>SURVIVED</Text>
        <Text style={styles.savedAmount}>${formattedSaved} saved</Text>

        {/* Info card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Blocked</Text>
            <Text style={styles.rowValue}>{blockedAttack}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Streak</Text>
            <Text style={styles.rowValue}>
              {displayStreak} days {displayStreak >= 7 ? "🔥🔥" : "🔥"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Safer than</Text>
            <Text style={[styles.rowValue, { color: colors.green }]}>
              Top 27%
            </Text>
          </View>
        </View>

        {/* Reward text */}
        <Text style={styles.reward}>
          +{XP_REWARD} XP · +{TOKEN_REWARD} 🛡️ Security Tokens
        </Text>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Pressable
            style={styles.shareBtn}
            onPress={() => {
              router.push({
                pathname: "/share-card",
                params: {
                  type: "survived",
                  amount: amountSaved,
                  detail: `Blocked ${blockedAttack}`,
                  stat: `${displayStreak} day streak 🔥`,
                },
              } as never);
            }}
          >
            <Text style={styles.shareBtnText}>📸 Share</Text>
          </Pressable>

          <Pressable
            style={styles.continueBtn}
            onPress={() => {
              router.replace({
                pathname: `/education/${scenarioId}`,
                params: {
                  outcomeType: "survived",
                  amount: amountSaved,
                  detail: `Blocked ${blockedAttack}`,
                },
              } as never);
            }}
          >
            <Text style={styles.continueBtnText}>Continue →</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  greenBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(0, 255, 136, 0.3)",
    borderRadius: 1,
    pointerEvents: "none",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["3xl"],
  },

  emoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 32,
    fontWeight: "700",
    color: colors.green,
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  savedAmount: {
    fontFamily: fonts.mono,
    fontSize: 22,
    fontWeight: "700",
    color: colors.green,
    marginBottom: spacing["2xl"],
  },

  /* Info card */
  card: {
    width: "100%" as unknown as number,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    fontSize: fontSize.md,
    color: colors.textDim,
  },
  rowValue: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  /* Reward */
  reward: {
    fontSize: 11,
    color: colors.textDim,
    marginBottom: spacing["3xl"],
  },

  /* Buttons */
  buttons: {
    width: "100%" as unknown as number,
    flexDirection: "row",
    gap: spacing.sm,
  },
  shareBtn: {
    flex: 1,
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
    flex: 1,
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
});
