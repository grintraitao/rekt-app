import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../../src/theme";
import {
  usePlayerStore,
  getLevelProgress,
  CLASS_META,
  getAchievements,
} from "../../src/store/playerStore";
import { usePortfolioStore } from "../../src/store/portfolioStore";

/* ── Stat bar ─────────────────────────────────────────────────────────────────── */

function StatBar({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>
        {icon} {label}
      </Text>
      <View style={styles.statTrack}>
        <View
          style={[
            styles.statFill,
            { width: `${Math.min(value, 100)}%` as unknown as number, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
    </View>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────────── */

export default function StatsScreen() {
  const router = useRouter();

  const selectedClass = usePlayerStore((s) => s.selectedClass);
  const username = usePlayerStore((s) => s.username);
  const xp = usePlayerStore((s) => s.xp);
  const streak = usePlayerStore((s) => s.streak);
  const survived = usePlayerStore((s) => s.survived);
  const rektCount = usePlayerStore((s) => s.rektCount);
  const securityTokens = usePlayerStore((s) => s.securityTokens);
  const hp = usePortfolioStore((s) => s.hp);

  const classMeta = CLASS_META[selectedClass];
  const lvl = getLevelProgress(xp);
  const total = survived + rektCount;
  const rate = total > 0 ? Math.round((survived / total) * 100) : 0;

  const achievements = getAchievements({ survived, rektCount, streak, securityTokens });

  // Derive stat values from game state
  const security = Math.min(Math.round(survived * 3.5 + securityTokens * 2), 100) || 65;
  const detection = Math.min(Math.round(survived * 2.5 + streak * 0.5), 100) || 48;
  const wealth = Math.min(Math.round(72 + survived * 0.5 - rektCount * 3), 100) || 72;
  const knowledge = Math.min(Math.round(survived * 2.8 + lvl.level * 2), 100) || 55;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Identity ──────────────────────────────────────── */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{classMeta.emoji}</Text>
          </View>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.levelInfo}>
            Level {lvl.level} · {classMeta.name} · 🔥{streak}
          </Text>
        </View>

        {/* ── XP Progress ────────────────────────────────────────────── */}
        <View style={styles.xpSection}>
          <View style={styles.xpLabels}>
            <Text style={styles.xpLabel}>Lvl {lvl.level}</Text>
            <Text style={styles.xpLabel}>
              {lvl.current.toLocaleString()}/{lvl.required.toLocaleString()} XP
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                { width: `${Math.min(lvl.pct, 100)}%` as unknown as number },
              ]}
            />
          </View>
        </View>

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STATS</Text>
          <StatBar icon="🛡️" label="Security" value={security} color={colors.green} />
          <StatBar icon="👁️" label="Detection" value={detection} color={colors.cyan} />
          <StatBar icon="💎" label="Wealth" value={wealth} color={colors.yellow} />
          <StatBar icon="🧠" label="Knowledge" value={knowledge} color={colors.purple} />
          <StatBar icon="❤️" label="HP" value={hp} color={colors.green} />
        </View>

        {/* ── Record ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECORD</Text>
          <View style={styles.recordCard}>
            <View style={styles.recordRow}>
              <View style={styles.recordItem}>
                <Text style={[styles.recordNum, { color: colors.green }]}>
                  {survived}
                </Text>
                <Text style={styles.recordLabel}>Survived</Text>
              </View>
              <View style={styles.recordDivider} />
              <View style={styles.recordItem}>
                <Text style={[styles.recordNum, { color: colors.red }]}>
                  {rektCount}
                </Text>
                <Text style={styles.recordLabel}>Rekt</Text>
              </View>
              <View style={styles.recordDivider} />
              <View style={styles.recordItem}>
                <Text style={[styles.recordNum, { color: colors.yellow }]}>
                  {rate}%
                </Text>
                <Text style={styles.recordLabel}>Rate</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Achievements ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
          <View style={styles.achievementGrid}>
            {achievements.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.achievementBadge,
                  !a.unlocked && styles.achievementLocked,
                ]}
              >
                <Text style={styles.achievementEmoji}>{a.emoji}</Text>
                <Text
                  style={[
                    styles.achievementName,
                    !a.unlocked && styles.achievementNameLocked,
                  ]}
                >
                  {a.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── View Gear button ───────────────────────────────────────── */}
        <Pressable
          style={styles.gearBtn}
          onPress={() => router.push("/gear" as never)}
        >
          <Text style={styles.gearBtnText}>🎒 View Gear</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["4xl"],
  },

  /* Profile */
  profileSection: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  username: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
  },
  levelInfo: {
    fontSize: fontSize.sm,
    color: colors.green,
    marginTop: 2,
  },

  /* XP bar */
  xpSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  xpLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  xpLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
  xpTrack: {
    height: 5,
    backgroundColor: colors.surface2,
    borderRadius: 3,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%" as unknown as number,
    backgroundColor: colors.green,
    borderRadius: 3,
  },

  /* Sections */
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },

  /* Stat bars */
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    width: 75,
  },
  statTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: 3,
    overflow: "hidden",
  },
  statFill: {
    height: "100%" as unknown as number,
    borderRadius: 3,
  },
  statVal: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "right",
  },

  /* Record */
  recordCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordItem: {
    flex: 1,
    alignItems: "center",
  },
  recordNum: {
    fontFamily: fonts.mono,
    fontSize: 18,
    fontWeight: "700",
  },
  recordLabel: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: spacing.xs,
  },
  recordDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  /* Achievements */
  achievementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  achievementBadge: {
    width: "48%" as unknown as number,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  achievementLocked: {
    opacity: 0.35,
  },
  achievementEmoji: {
    fontSize: 18,
  },
  achievementName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "500",
    flexShrink: 1,
  },
  achievementNameLocked: {
    color: colors.textDim,
  },

  /* Gear button */
  gearBtn: {
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  gearBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
  },
});
