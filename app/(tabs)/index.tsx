import { StyleSheet, Text, View, ScrollView } from "react-native";
import { colors, spacing, fontSize, fonts, borderRadius, card } from "../../src/theme";

export default function WalletScreen() {
  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarBtn}>
          <Text style={styles.topBarBtnText}>🏆 Challenge</Text>
        </View>
        <Text style={styles.balance}>$47,832</Text>
        <View style={styles.topBarBtn}>
          <Text style={styles.topBarBtnText}>🔔 3</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Portfolio Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Portfolio</Text>
          <Text style={styles.portfolioValue}>$47,832.00</Text>
          <Text style={styles.portfolioChange}>+12.4% today</Text>
        </View>

        {/* Holdings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Holdings</Text>
          {[
            { token: "BTC", amount: "0.82", value: "$31,204", change: "+5.2%" },
            { token: "ETH", amount: "4.5", value: "$10,125", change: "+8.1%" },
            { token: "SOL", amount: "120", value: "$6,503", change: "-2.3%" },
          ].map((holding) => (
            <View key={holding.token} style={styles.holdingRow}>
              <View>
                <Text style={styles.holdingToken}>{holding.token}</Text>
                <Text style={styles.holdingAmount}>{holding.amount}</Text>
              </View>
              <View style={styles.holdingRight}>
                <Text style={styles.holdingValue}>{holding.value}</Text>
                <Text
                  style={[
                    styles.holdingChange,
                    { color: holding.change.startsWith("+") ? colors.green : colors.red },
                  ]}
                >
                  {holding.change}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <Text style={styles.activityPlaceholder}>
            Scenario results will appear here...
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarBtn: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  topBarBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  balance: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    ...card,
  },
  cardTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  portfolioValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  portfolioChange: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.green,
    marginTop: spacing.xs,
  },
  holdingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holdingToken: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  holdingAmount: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  holdingRight: {
    alignItems: "flex-end",
  },
  holdingValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  holdingChange: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  activityPlaceholder: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: "italic",
  },
});
