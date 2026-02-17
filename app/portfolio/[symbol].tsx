import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
  typography,
  activity as activityTheme,
} from "../../src/theme";
import { usePortfolioStore } from "../../src/store/portfolioStore";

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function formatValue(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function showToast(msg: string) {
  if (Platform.OS === "web") {
    window.alert(msg);
  } else {
    Alert.alert(msg);
  }
}

/* ── Chart placeholder ─────────────────────────────────────────────────────── */

const CHART_H = 140;

function MiniChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Build SVG-style polygon points for a simple area chart rendered with Views
  // Since we can't use SVG without a dep, render bars at each data point
  return (
    <View style={chartStyles.container}>
      {/* Gradient-ish background */}
      <View style={[chartStyles.bg, { backgroundColor: color + "08" }]} />
      {/* Data bars */}
      <View style={chartStyles.barsRow}>
        {data.map((val, i) => {
          const pct = ((val - min) / range) * 100;
          return (
            <View key={i} style={chartStyles.barCol}>
              <View style={{ flex: 1 }} />
              <View
                style={[
                  chartStyles.bar,
                  {
                    height: `${Math.max(pct, 4)}%` as unknown as number,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      {/* Bottom line */}
      <View style={[chartStyles.bottomLine, { backgroundColor: color + "33" }]} />
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    height: CHART_H,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.md,
  },
  barsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: 1,
    gap: 4,
  },
  barCol: {
    flex: 1,
    height: "100%" as unknown as number,
    justifyContent: "flex-end",
  },
  bar: {
    borderRadius: 2,
    minHeight: 4,
  },
  bottomLine: {
    height: 1,
  },
});

/* ── Time range buttons ────────────────────────────────────────────────────── */

const TIME_RANGES = ["1D", "1W", "1M", "ALL"] as const;

function TimeRangeBar({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (r: string) => void;
}) {
  return (
    <View style={rangeStyles.row}>
      {TIME_RANGES.map((r) => (
        <Pressable
          key={r}
          style={[rangeStyles.btn, selected === r && rangeStyles.btnActive]}
          onPress={() => onSelect(r)}
        >
          <Text
            style={[
              rangeStyles.btnText,
              selected === r && rangeStyles.btnTextActive,
            ]}
          >
            {r}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const rangeStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  btn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenDim,
  },
  btnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
  btnTextActive: {
    color: colors.green,
  },
});

/* ── Transaction type icons ────────────────────────────────────────────────── */

const txMeta: Record<string, { icon: string; iconBg: string }> = {
  Received: { icon: "📥", iconBg: colors.greenDim },
  Sent: { icon: "📤", iconBg: colors.redDim },
  Swap: { icon: "🔄", iconBg: colors.purpleDim },
  Staking: { icon: "🏦", iconBg: colors.cyanDim },
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function PortfolioDetailScreen() {
  const router = useRouter();
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const holdings = usePortfolioStore((s) => s.holdings);
  const token = holdings.find(
    (h) => h.symbol.toLowerCase() === (symbol ?? "").toLowerCase(),
  );

  const [timeRange, setTimeRange] = useState("1W");

  if (!token) {
    return (
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Wallet</Text>
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.notFound}>Token not found</Text>
        </View>
      </View>
    );
  }

  const pctColor =
    token.changePct > 0
      ? colors.green
      : token.changePct < 0
        ? colors.red
        : colors.textDim;
  const pctSign = token.changePct > 0 ? "+" : "";

  return (
    <View style={styles.container}>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Wallet</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Token header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <View
            style={[styles.iconCircle, { backgroundColor: token.iconBg }]}
          >
            <Text style={[styles.iconText, { color: token.iconColor }]}>
              {token.icon}
            </Text>
          </View>
          <Text style={styles.tokenName}>{token.name}</Text>
          <Text style={styles.tokenSymbol}>{token.symbol}</Text>
        </View>

        {/* ── Balance ───────────────────────────────────────────────── */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceAmount}>${formatValue(token.value)}</Text>
          <Text style={styles.balanceSub}>{token.displayAmount}</Text>
          <Text style={[styles.changeLine, { color: pctColor }]}>
            {pctSign}{token.changePct}% today
          </Text>
        </View>

        {/* ── Chart ─────────────────────────────────────────────────── */}
        <MiniChart data={token.chartData} color={pctColor} />
        <TimeRangeBar selected={timeRange} onSelect={setTimeRange} />

        {/* ── Action buttons ────────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionBtn, styles.actionBuy]}
            onPress={() => showToast("Coming in next update")}
          >
            <Text style={[styles.actionBtnText, { color: colors.green }]}>
              Buy
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionSell]}
            onPress={() => showToast("Coming in next update")}
          >
            <Text style={[styles.actionBtnText, { color: colors.red }]}>
              Sell
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionStake]}
            onPress={() => showToast("Coming in next update")}
          >
            <Text style={[styles.actionBtnText, { color: colors.purple }]}>
              Stake
            </Text>
          </Pressable>
        </View>

        {/* ── Transaction history ───────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={typography.sectionTitle}>TRANSACTIONS</Text>
          <View style={styles.txCard}>
            {token.transactions.map((tx, idx) => {
              const meta = txMeta[tx.type] ?? txMeta.Received;
              return (
                <View
                  key={tx.id}
                  style={[
                    activityTheme.row,
                    idx > 0 && styles.txDivider,
                  ]}
                >
                  <View
                    style={[
                      activityTheme.icon,
                      { backgroundColor: meta.iconBg },
                    ]}
                  >
                    <Text style={styles.txIcon}>{meta.icon}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={activityTheme.label}>{tx.type}</Text>
                    <Text style={activityTheme.sub}>{tx.date}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>{tx.amount}</Text>
                    <Text style={styles.txValue}>{tx.value}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    color: colors.textDim,
  },

  /* Top bar */
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    paddingVertical: spacing.xs,
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
    paddingBottom: spacing["3xl"],
  },

  /* Header */
  header: {
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  iconText: {
    fontSize: 22,
    fontWeight: "700",
  },
  tokenName: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    color: colors.text,
  },
  tokenSymbol: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginTop: 2,
  },

  /* Balance */
  balanceSection: {
    alignItems: "center",
    paddingBottom: spacing.xl,
  },
  balanceAmount: {
    fontFamily: fonts.mono,
    fontSize: fontSize.display,
    fontWeight: "700",
    color: colors.white,
  },
  balanceSub: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.textDim,
    marginTop: 2,
  },
  changeLine: {
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 4,
  },

  /* Action buttons */
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBuy: {
    borderColor: colors.green,
    backgroundColor: colors.greenDim,
  },
  actionSell: {
    borderColor: colors.red,
    backgroundColor: colors.redDim,
  },
  actionStake: {
    borderColor: colors.purple,
    backgroundColor: colors.purpleDim,
  },
  actionBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    fontWeight: "600",
  },

  /* Transactions */
  section: {
    paddingHorizontal: spacing.lg,
  },
  txCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  txDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.03)",
  },
  txIcon: {
    fontSize: 12,
  },
  txInfo: {
    flex: 1,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  txValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 1,
  },
});
