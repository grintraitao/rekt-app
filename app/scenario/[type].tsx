import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, fonts, fontSize, spacing, borderRadius } from "../../src/theme";

const scamInfo: Record<string, { emoji: string; title: string; desc: string }> = {
  phishing: {
    emoji: "🎣",
    title: "Phishing Attack",
    desc: "A fake verification request designed to steal your credentials.",
  },
  "fake-airdrop": {
    emoji: "🍯",
    title: "Fake Airdrop",
    desc: "A honeypot airdrop that tricks you into approving malicious contracts.",
  },
  impersonation: {
    emoji: "🎭",
    title: "Support Impersonation",
    desc: "Someone pretending to be official support to gain wallet access.",
  },
};

const fallback = { emoji: "⚠️", title: "Scam Scenario", desc: "Unknown scam type." };

export default function ScamScenarioScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const info = scamInfo[type ?? ""] ?? fallback;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Notifications</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.emoji}>{info.emoji}</Text>
        <Text style={styles.title}>{info.title}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{(type ?? "unknown").toUpperCase()}</Text>
        </View>
        <Text style={styles.desc}>{info.desc}</Text>
        <Text style={styles.coming}>Scenario gameplay coming soon</Text>
      </View>
    </View>
  );
}

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
  emoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.redDim,
    marginBottom: spacing.lg,
  },
  typeBadgeText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.red,
  },
  desc: {
    fontSize: fontSize.lg,
    color: colors.textMid,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  coming: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
});
