import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, fontSize, spacing, borderRadius } from "../../src/theme";

export default function SurvivedScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🛡️</Text>
      <Text style={styles.title}>SURVIVED</Text>
      <Text style={styles.subtitle}>
        You identified the scam and protected your wallet.
      </Text>
      <Text style={styles.safe}>$47,832 safe</Text>
      <Text style={styles.stat}>Only 27% of players caught this</Text>

      <Pressable
        style={styles.btn}
        onPress={() => router.replace("/(tabs)" as never)}
      >
        <Text style={styles.btnText}>Back to Wallet</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["3xl"],
  },
  emoji: { fontSize: 64, marginBottom: spacing.lg },
  title: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.green,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textMid,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  safe: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.green,
    marginBottom: spacing.sm,
  },
  stat: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginBottom: spacing["3xl"],
  },
  btn: {
    width: "100%" as unknown as number,
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
  },
  btnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.bg,
  },
});
