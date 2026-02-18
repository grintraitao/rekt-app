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

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function RektScreen() {
  const router = useRouter();
  const {
    amountLost = "34201",
    attackType = "Unknown Scam",
    scenarioId = "",
  } = useLocalSearchParams<{
    amountLost: string;
    attackType: string;
    scenarioId: string;
  }>();

  const lostNum = parseInt(amountLost, 10) || 34201;
  const streak = usePortfolioStore((s) => s.streak);
  const takeDamage = usePortfolioStore((s) => s.takeDamage);
  const subtractValue = usePortfolioStore((s) => s.subtractValue);
  const resetStreak = usePlayerStore((s) => s.breakStreak);
  const recordRekt = usePlayerStore((s) => s.recordRekt);

  // ── Shake animation ──────────────────────────────────────────────────
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Apply game penalties
    takeDamage(20);
    subtractValue(lostNum);
    resetStreak();
    recordRekt();

    // Entry animations: shake then fade in
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = shakeAnim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -8, 8, -6, 6, 0],
  });

  const formattedLoss = lostNum.toLocaleString("en-US");

  return (
    <View style={styles.container}>
      {/* Red border tint */}
      <View style={styles.redBorder} />

      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateX }], opacity: fadeAnim },
        ]}
      >
        {/* Skull + title */}
        <Text style={styles.emoji}>💀</Text>
        <Text style={styles.title}>REKT</Text>
        <Text style={styles.lossAmount}>-${formattedLoss}</Text>

        {/* Info card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Attack type</Text>
            <Text style={styles.rowValue}>{attackType}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Survived</Text>
            <Text style={styles.rowValue}>{streak} days 🔥</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Others rekt</Text>
            <Text style={styles.rowValue}>73%</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Pressable
            style={styles.shareBtn}
            onPress={() => {
              router.push({
                pathname: "/share-card",
                params: {
                  type: "rekt",
                  amount: amountLost,
                  detail: attackType,
                  stat: "73% fell for this",
                },
              } as never);
            }}
          >
            <Text style={styles.shareBtnText}>📸 Share</Text>
          </Pressable>

          <Pressable
            style={styles.learnBtn}
            onPress={() => {
              router.replace({
                pathname: `/education/${scenarioId}`,
                params: {
                  outcomeType: "rekt",
                  amount: amountLost,
                  detail: attackType,
                },
              } as never);
            }}
          >
            <Text style={styles.learnBtnText}>Learn Why →</Text>
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
  redBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(255, 51, 102, 0.3)",
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
    color: colors.red,
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  lossAmount: {
    fontFamily: fonts.mono,
    fontSize: 22,
    fontWeight: "700",
    color: colors.red,
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
    marginBottom: spacing["3xl"],
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
  learnBtn: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
  },
  learnBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.bg,
  },
});
