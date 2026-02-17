import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, fontSize, fonts, borderRadius } from "../../src/theme";

export default function ScannerScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 Scam Scanner</Text>
        <Text style={styles.headerSub}>
          Paste any link, contract, or token address
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.comingSoonCard}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            Complete Chapter 1 to unlock the Scam Scanner.
          </Text>
          <Text style={styles.comingSoonText}>
            Paste any link or contract address and get an instant risk
            assessment powered by real threat data.
          </Text>

          <View style={styles.featureList}>
            {[
              "Contract analysis",
              "Phishing detection",
              "Rug pull signals",
              "Community risk score",
            ].map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={styles.featureDot}>◆</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  headerSub: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "center",
  },
  comingSoonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
  },
  lockIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  comingSoonTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.purple,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  comingSoonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  featureList: {
    marginTop: spacing.md,
    alignSelf: "stretch",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  featureDot: {
    fontSize: 8,
    color: colors.cyan,
  },
  featureText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
