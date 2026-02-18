import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
  layout,
  typography,
  quickAction as qaTheme,
  tokens as tokensTheme,
  activity as activityTheme,
} from "../../src/theme";
import { usePlayerStore } from "../../src/store/playerStore";
import { usePortfolioStore } from "../../src/store/portfolioStore";
import { useNotificationStore } from "../../src/store/notificationStore";

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function formatDollars(n: number): { whole: string; cents: string } {
  const [whole, cents] = n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).split(".");
  return { whole, cents };
}

function formatPct(pct: number): string {
  if (pct === 0) return "0.0%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

function txDisplayInfo(type: string): { icon: string; bg: string } {
  switch (type) {
    case "received": return { icon: "📥", bg: "rgba(0,255,136,0.1)" };
    case "sent": return { icon: "📤", bg: "rgba(255,255,255,0.05)" };
    case "swap": return { icon: "🔄", bg: "rgba(0,200,255,0.1)" };
    case "staking-reward": return { icon: "🪙", bg: "rgba(255,215,0,0.1)" };
    case "airdrop": return { icon: "🎁", bg: "rgba(200,100,255,0.1)" };
    case "investment-return": return { icon: "📈", bg: "rgba(0,255,136,0.1)" };
    case "rekt-loss": return { icon: "💀", bg: "rgba(255,51,102,0.1)" };
    case "dust-attack": return { icon: "⚠️", bg: "rgba(255,140,0,0.1)" };
    default: return { icon: "📋", bg: "rgba(255,255,255,0.05)" };
  }
}

/* ── Quick action data ─────────────────────────────────────────────────────── */

const quickActions = [
  { icon: "🔥", label: "Claim" },
  { icon: "🔄", label: "Swap" },
  { icon: "🦊", label: "Stake" },
  { icon: "🔍", label: "Inspect" },
];

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function WalletHomeScreen() {
  const router = useRouter();
  const holdings = usePortfolioStore((s) => s.holdings);
  const totalValue = usePortfolioStore((s) => s.totalValue);
  const dailyChange = usePortfolioStore((s) => s.dailyChange);
  const dailyChangePct = usePortfolioStore((s) => s.dailyChangePct);
  const transactions = usePortfolioStore((s) => s.transactions);
  const hp = usePlayerStore((s) => s.stats.hp);
  const streak = usePlayerStore((s) => s.streak);
  const notificationCount = useNotificationStore((s) => s.unreadCount());

  const { whole, cents } = formatDollars(totalValue);
  const hpPct = `${hp}%` as const;

  return (
    <View style={styles.container}>
      {/* ── Top Bar (fixed) ──────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.challengeBtn}
          onPress={() => router.push("/challenge" as never)}
        >
          <Text style={styles.challengeBtnText}>🏆 Challenge</Text>
        </Pressable>
        <View style={layout.row}>
          <Text style={styles.streak}>🔥{streak}</Text>
          <Pressable
            style={styles.bellWrap}
            onPress={() => router.push("/notifications" as never)}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── HP Bar ───────────────────────────────────────────────────── */}
      <View style={styles.hpRow}>
        <Text style={styles.hpHeart}>❤️</Text>
        <View style={styles.hpTrack}>
          <View style={[styles.hpFill, { width: hpPct }]} />
        </View>
        <Text style={styles.hpLabel}>{hp}HP</Text>
      </View>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Total Portfolio</Text>
          <Text style={styles.balanceAmount}>
            ${whole}
            <Text style={styles.balanceCents}>.{cents}</Text>
          </Text>
          <Text style={styles.balanceChange}>
            ▲ +${dailyChange.toLocaleString("en-US", { minimumFractionDigits: 2 })} ({dailyChangePct}%)
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          {quickActions.map((qa) => (
            <View key={qa.label} style={styles.quickActionItem}>
              <View style={qaTheme.circle}>
                <Text style={styles.qaIcon}>{qa.icon}</Text>
              </View>
              <Text style={qaTheme.label}>{qa.label}</Text>
            </View>
          ))}
        </View>

        {/* Holdings */}
        <View style={styles.section}>
          <Text style={typography.sectionTitle}>HOLDINGS</Text>
          <View style={styles.holdingsCard}>
            {holdings.map((token, idx) => (
              <Pressable
                key={token.id}
                style={[
                  tokensTheme.row,
                  idx > 0 && styles.tokenDivider,
                ]}
                onPress={() => router.push(`/portfolio/${token.symbol}` as never)}
              >
                {/* Token icon */}
                <View
                  style={[
                    tokensTheme.icon,
                    { backgroundColor: token.iconColor + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.tokenIconText,
                      { color: token.iconColor },
                    ]}
                  >
                    {token.emoji}
                  </Text>
                </View>

                {/* Name + amount */}
                <View style={styles.tokenInfo}>
                  <Text
                    style={[
                      tokensTheme.name,
                      token.id === "moonrise" && { color: colors.yellow },
                    ]}
                  >
                    {token.name}
                  </Text>
                  <Text style={tokensTheme.amount}>{token.amount} {token.symbol}</Text>
                </View>

                {/* Price + pct */}
                <View style={styles.tokenRight}>
                  <Text style={tokensTheme.price}>
                    ${Math.round(token.amount * token.pricePerUnit).toLocaleString()}
                  </Text>
                  <Text
                    style={
                      token.dailyChangePct > 0
                        ? tokensTheme.pctUp
                        : token.dailyChangePct < 0
                          ? tokensTheme.pctDown
                          : styles.pctNeutral
                    }
                  >
                    {formatPct(token.dailyChangePct)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.sectionTitle}>RECENT</Text>
            <Pressable onPress={() => router.push("/activity" as never)}>
              <Text style={styles.seeAll}>See all →</Text>
            </Pressable>
          </View>
          {transactions.slice(0, 3).map((tx) => {
            const { icon, bg } = txDisplayInfo(tx.type);
            const amtStr = tx.amount >= 0
              ? `+$${tx.amount.toLocaleString()}`
              : `-$${Math.abs(tx.amount).toLocaleString()}`;
            return (
              <Pressable
                key={tx.id}
                style={activityTheme.row}
                onPress={
                  tx.isSuspicious && tx.linkedScenarioId
                    ? () => router.push(`/scenario/${tx.linkedScenarioId}` as never)
                    : undefined
                }
              >
                <View
                  style={[activityTheme.icon, { backgroundColor: bg }]}
                >
                  <Text style={styles.activityIconText}>{icon}</Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text
                    style={[
                      activityTheme.label,
                      tx.isSuspicious ? { color: colors.yellow } : undefined,
                    ]}
                  >
                    {tx.label}
                  </Text>
                  <Text style={activityTheme.sub}>
                    {tx.sublabel}
                  </Text>
                </View>
                <Text
                  style={[
                    activityTheme.value,
                    { color: tx.amount >= 0 ? colors.green : colors.red },
                  ]}
                >
                  {amtStr}
                </Text>
              </Pressable>
            );
          })}
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

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  challengeBtn: {
    borderWidth: 1,
    borderColor: colors.yellow,
    backgroundColor: "rgba(255,215,0,0.1)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  challengeBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.yellow,
  },
  streak: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginRight: spacing.sm,
  },
  bellWrap: {
    position: "relative",
  },
  bellIcon: {
    fontSize: 16,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: colors.red,
    borderRadius: 6,
    minWidth: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 7,
    fontWeight: "700",
    color: colors.white,
  },

  /* HP bar */
  hpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  hpHeart: {
    fontSize: 9,
  },
  hpTrack: {
    flex: 1,
    height: 3,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: "hidden",
  },
  hpFill: {
    height: "100%" as unknown as number,
    backgroundColor: colors.green,
    borderRadius: 2,
  },
  hpLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.textDim,
  },

  /* Balance */
  balanceSection: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
  balanceAmount: {
    fontFamily: fonts.mono,
    fontSize: fontSize.display,
    fontWeight: "700",
    color: colors.white,
    marginTop: 2,
  },
  balanceCents: {
    fontSize: 16,
    color: colors.textDim,
  },
  balanceChange: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.green,
    marginTop: 2,
  },

  /* Quick actions */
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    paddingBottom: spacing.lg,
  },
  quickActionItem: {
    alignItems: "center",
  },
  qaIcon: {
    fontSize: 14,
  },

  /* Sections */
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  /* Holdings card */
  holdingsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  tokenDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.03)",
  },
  tokenIconText: {
    fontSize: 14,
    fontWeight: "700",
  },
  tokenInfo: {
    flex: 1,
  },
  tokenRight: {
    alignItems: "flex-end",
  },
  pctNeutral: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textDim,
    textAlign: "right",
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seeAll: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.green,
    marginBottom: spacing.sm,
  },

  /* Activity */
  activityIconText: {
    fontSize: 12,
  },
  activityInfo: {
    flex: 1,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
});
