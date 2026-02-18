import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
  card,
} from "../src/theme";
import { usePlayerStore } from "../src/store/playerStore";
import { usePortfolioStore } from "../src/store/portfolioStore";
import { useGameStore } from "../src/store/gameStore";
import { EconomyEngine } from "../src/engine/EconomyEngine";

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function DailyRewardScreen() {
  const router = useRouter();
  const { streak, claimDailyReward, addXP: addXp, addCoins, playerClass, level } = usePlayerStore();
  const { totalValue, holdings, addFunds, simulateMarketDay } = usePortfolioStore();
  const advanceGameDay = useGameStore((s) => s.advanceGameDay);
  const [claimed, setClaimed] = useState(false);

  // Calculate rewards using EconomyEngine
  const rewards = EconomyEngine.calculateDailyReward(
    holdings,
    streak,
    level,
    playerClass ?? "ape",
  );

  // Float animation for chest
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  // Flash animation on claim
  const flashAnim = useRef(new Animated.Value(0)).current;

  const stakingYield = rewards.stakingYield;
  const loginXP = rewards.loginXP;
  const streakBonusXP = rewards.streakBonusXP;
  const bonusCoins = rewards.bonusCoins;
  const newTotal = totalValue + stakingYield;

  function handleClaim() {
    if (claimed) return;

    // Apply rewards
    claimDailyReward();
    addXp(loginXP + streakBonusXP);
    if (stakingYield > 0) addFunds(stakingYield, "staking-yield");
    if (bonusCoins > 0) addCoins(bonusCoins);

    // Advance game state
    advanceGameDay();
    simulateMarketDay();

    setClaimed(true);

    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace("/(tabs)" as never);
    });
  }

  return (
    <View style={styles.container}>
      {/* Green radial glow (simulated) */}
      <View style={styles.glowCircle} />

      {/* Floating chest */}
      <Animated.Text
        style={[styles.chest, { transform: [{ translateY: floatAnim }] }]}
      >
        📦
      </Animated.Text>

      {/* Title */}
      <Text style={styles.title}>DAILY REWARDS</Text>
      <Text style={styles.subtitle}>
        Day {streak} · Streak bonus 🔥
      </Text>

      {/* Reward card */}
      <View style={styles.rewardCard}>
        <RewardRow emoji="🪙" label="Staking yield" value={`+$${stakingYield.toFixed(2)}`} valueColor={colors.green} />
        <RewardRow emoji="⭐" label="Login XP" value={`+${loginXP} XP`} valueColor={colors.cyan} />
        <RewardRow emoji="🔥" label="Streak bonus" value={`+${streakBonusXP} XP`} valueColor={colors.yellow} />
        {bonusCoins > 0 && (
          <RewardRow emoji="💰" label="Streak coins" value={`+${bonusCoins}`} valueColor={colors.yellow} />
        )}

        <View style={styles.divider} />

        <View style={styles.rewardRow}>
          <Text style={styles.rewardLabel}>Portfolio</Text>
          <Text style={[styles.rewardValue, { color: colors.green, fontWeight: "700" }]}>
            ${newTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Claim button */}
      <Pressable
        style={[styles.claimBtn, claimed && styles.claimBtnDisabled]}
        onPress={handleClaim}
        disabled={claimed}
      >
        <Text style={styles.claimBtnText}>
          {claimed ? "Claimed ✓" : "Claim →"}
        </Text>
      </Pressable>

      {/* Flash overlay */}
      <Animated.View
        style={[styles.flashOverlay, { opacity: flashAnim }]}
        pointerEvents="none"
      />
    </View>
  );
}

/* ── Reward row helper ─────────────────────────────────────────────────────── */

function RewardRow({
  emoji,
  label,
  value,
  valueColor,
}: {
  emoji: string;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View style={styles.rewardRow}>
      <Text style={styles.rewardLabel}>
        {emoji} {label}
      </Text>
      <Text style={[styles.rewardValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["3xl"],
  },

  /* Green radial glow */
  glowCircle: {
    position: "absolute",
    top: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(0, 255, 136, 0.06)",
  },

  /* Chest */
  chest: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },

  /* Title / subtitle */
  title: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textDim,
    marginBottom: spacing.xl,
  },

  /* Reward card */
  rewardCard: {
    ...card,
    width: "100%" as unknown as number,
  },
  rewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  rewardLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.text,
  },
  rewardValue: {
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  /* Claim button */
  claimBtn: {
    width: "100%" as unknown as number,
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  claimBtnDisabled: {
    opacity: 0.5,
  },
  claimBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.bg,
  },

  /* Flash overlay */
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 255, 136, 0.25)",
  },
});
