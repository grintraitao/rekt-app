import { StyleSheet, Text, View, ScrollView } from "react-native";
import { colors, spacing, fontSize, fonts, borderRadius, card } from "../../src/theme";

type StatBarProps = {
  label: string;
  icon: string;
  value: number;
  color: string;
};

function StatBar({ label, icon, value, color }: StatBarProps) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>
        {icon} {label}
      </Text>
      <View style={styles.statTrack}>
        <View
          style={[styles.statFill, { width: `${value}%`, backgroundColor: color }]}
        />
      </View>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
    </View>
  );
}

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Stats</Text>
        <Text style={styles.headerSub}>Your survival record</Text>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>🦍</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Player_001</Text>
            <Text style={styles.profileClass}>The Ape · Level 3</Text>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>340 XP</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stats</Text>
          <StatBar label="Awareness" icon="👁️" value={42} color={colors.green} />
          <StatBar label="Resistance" icon="🛡️" value={28} color={colors.cyan} />
          <StatBar label="Knowledge" icon="🧠" value={55} color={colors.purple} />
          <StatBar label="Luck" icon="🍀" value={15} color={colors.yellow} />
        </View>

        {/* Record */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Record</Text>
          <View style={styles.recordRow}>
            <View style={styles.recordItem}>
              <Text style={styles.recordValue}>3</Text>
              <Text style={styles.recordLabel}>Survived</Text>
            </View>
            <View style={styles.recordDivider} />
            <View style={styles.recordItem}>
              <Text style={[styles.recordValue, { color: colors.red }]}>2</Text>
              <Text style={styles.recordLabel}>REKT</Text>
            </View>
            <View style={styles.recordDivider} />
            <View style={styles.recordItem}>
              <Text style={[styles.recordValue, { color: colors.yellow }]}>5</Text>
              <Text style={styles.recordLabel}>Streak</Text>
            </View>
          </View>
        </View>

        {/* Achievements placeholder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Achievements</Text>
          <Text style={styles.placeholder}>
            Complete scenarios to earn achievements...
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  profileCard: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  profileClass: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: colors.greenDim,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  xpText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    fontWeight: "bold",
    color: colors.green,
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
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    width: 110,
  },
  statTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  statFill: {
    height: "100%",
    borderRadius: 3,
  },
  statVal: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    fontWeight: "bold",
    width: 28,
    textAlign: "right",
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  recordValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    fontWeight: "bold",
    color: colors.green,
  },
  recordLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  recordDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  placeholder: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: "italic",
  },
});
