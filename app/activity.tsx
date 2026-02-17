import { useState } from "react";
import {
  Pressable,
  ScrollView,
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
  activity as activityTheme,
} from "../src/theme";
import {
  usePortfolioStore,
  type ActivityFilter,
  type RecentActivity,
} from "../src/store/portfolioStore";

/* ── Filter pills ─────────────────────────────────────────────────────────── */

const FILTERS: ActivityFilter[] = ["All", "Received", "Sent", "Swaps", "Alerts"];

function FilterPills({
  active,
  onSelect,
}: {
  active: ActivityFilter;
  onSelect: (f: ActivityFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillsRow}
    >
      {FILTERS.map((f) => {
        const isActive = f === active;
        return (
          <Pressable
            key={f}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelect(f)}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {f}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ── Activity row ─────────────────────────────────────────────────────────── */

function ActivityRow({
  item,
  expanded,
  onPress,
}: {
  item: RecentActivity;
  expanded: boolean;
  onPress: () => void;
}) {
  const isSuspicious = item.isSuspicious;

  return (
    <Pressable
      style={[
        styles.activityRow,
        isSuspicious && styles.activityRowSuspicious,
      ]}
      onPress={onPress}
    >
      {/* Icon */}
      <View
        style={[
          activityTheme.icon,
          { backgroundColor: item.iconBg },
          isSuspicious && styles.suspiciousIcon,
        ]}
      >
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>

      {/* Label + sub */}
      <View style={styles.infoCol}>
        <Text
          style={[
            activityTheme.label,
            item.labelColor ? { color: item.labelColor } : undefined,
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
        <Text
          style={[
            activityTheme.sub,
            item.subColor ? { color: item.subColor } : undefined,
          ]}
          numberOfLines={1}
        >
          {item.sub}
        </Text>
      </View>

      {/* Value */}
      <Text
        style={[
          activityTheme.value,
          item.valueColor ? { color: item.valueColor } : undefined,
        ]}
      >
        {item.value}
      </Text>

      {/* Inline expanded details (normal items only) */}
      {expanded && !isSuspicious && item.detail && (
        <View style={styles.detailRow}>
          <Text style={styles.detailText}>{item.detail}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function ActivityFeedScreen() {
  const router = useRouter();
  const recentActivity = usePortfolioStore((s) => s.recentActivity);
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered =
    activeFilter === "All"
      ? recentActivity
      : recentActivity.filter((a) => a.filter === activeFilter);

  function handlePress(item: RecentActivity) {
    if (item.isSuspicious && item.scamType) {
      router.push(`/scenario/${item.scamType}` as never);
    } else {
      setExpandedId((prev) => (prev === item.id ? null : item.id));
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Activity</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Filter pills */}
      <FilterPills active={activeFilter} onSelect={setActiveFilter} />

      {/* Transaction list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No activity yet</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <ActivityRow
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onPress={() => handlePress(item)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: fontSize.xxl,
    color: colors.text,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
  },

  /* Pills */
  pillsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pill: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: {
    borderColor: colors.green,
    backgroundColor: "rgba(0, 255, 136, 0.08)",
  },
  pillText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.textMid,
  },
  pillTextActive: {
    color: colors.green,
  },

  /* Activity rows */
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  activityRowSuspicious: {
    backgroundColor: "rgba(255, 140, 0, 0.06)",
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
  },
  suspiciousIcon: {
    borderWidth: 1,
    borderColor: "rgba(255, 140, 0, 0.3)",
  },
  iconText: {
    fontSize: 12,
  },
  infoCol: {
    flex: 1,
  },

  /* Expanded detail */
  detailRow: {
    width: "100%" as unknown as number,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textMid,
    lineHeight: 16,
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["4xl"],
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textDim,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["3xl"],
  },
});
