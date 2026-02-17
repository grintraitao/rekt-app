import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, fontSize, spacing, borderRadius } from "../../src/theme";

export default function RektScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💀</Text>
      <Text style={styles.title}>GOT REKT</Text>
      <Text style={styles.subtitle}>
        You shared your seed phrase with a scammer.
      </Text>
      <Text style={styles.loss}>-$34,201</Text>
      <Text style={styles.stat}>73% of players fell for this</Text>

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
    color: colors.red,
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
  loss: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.red,
    marginBottom: spacing.sm,
  },
  stat: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginBottom: spacing["3xl"],
  },
  btn: {
    width: "100%" as unknown as number,
    backgroundColor: colors.red,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
  },
  btnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.white,
  },
});
