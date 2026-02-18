import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../src/theme";
import {
  usePlayerStore,
  type PlayerClass,
} from "../src/store/playerStore";

/* ── Class data ─────────────────────────────────────────────────────────────── */

type Badge = { label: string; color: string; bg: string };

type ClassOption = {
  id: PlayerClass;
  emoji: string;
  name: string;
  description: string;
  badges: Badge[];
};

const classes: ClassOption[] = [
  {
    id: "ape",
    emoji: "🐵",
    name: "The Ape",
    description: "Fast gains, FOMO-driven",
    badges: [
      { label: "+GROWTH", color: colors.green, bg: colors.greenDim },
      { label: "-DETECTION", color: colors.red, bg: colors.redDim },
    ],
  },
  {
    id: "analyst",
    emoji: "🧠",
    name: "The Analyst",
    description: "Research-first, 2 free inspections/day",
    badges: [
      { label: "+DETECTION", color: colors.green, bg: colors.greenDim },
      { label: "-GROWTH", color: colors.red, bg: colors.redDim },
    ],
  },
  {
    id: "shadow",
    emoji: "🥷",
    name: "The Shadow",
    description: "Privacy-focused, balanced stats",
    badges: [
      { label: "+STEALTH", color: colors.green, bg: colors.greenDim },
      { label: "BALANCED", color: colors.cyan, bg: colors.cyanDim },
    ],
  },
  {
    id: "degen",
    emoji: "🎲",
    name: "The Degen",
    description: "High risk/reward, chaotic",
    badges: [
      { label: "+LUCK", color: colors.green, bg: colors.greenDim },
      { label: "-STABILITY", color: colors.red, bg: colors.redDim },
    ],
  },
];

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function CharacterSelectScreen() {
  const router = useRouter();
  const selectedClass = usePlayerStore((s) => s.playerClass);
  const setClass = usePlayerStore((s) => s.selectClass);
  const setOnboarded = usePlayerStore((s) => s.completeOnboarding);

  const selectedName = classes.find((c) => c.id === (selectedClass ?? "ape"))?.name ?? "";

  const handleConfirm = () => {
    setOnboarded();
    router.replace("/daily-reward");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CHOOSE YOUR CLASS</Text>
        <Text style={styles.headerSub}>This changes your gameplay</Text>
      </View>

      {/* Class list */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {classes.map((cls) => {
          const isSelected = cls.id === selectedClass;
          return (
            <Pressable
              key={cls.id}
              onPress={() => setClass(cls.id)}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  isSelected && styles.iconBoxSelected,
                ]}
              >
                <Text style={styles.iconEmoji}>{cls.emoji}</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.className}>{cls.name}</Text>
                <Text style={styles.classDesc}>{cls.description}</Text>
                <View style={styles.badgeRow}>
                  {cls.badges.map((badge) => (
                    <View
                      key={badge.label}
                      style={[
                        styles.badge,
                        { backgroundColor: badge.bg },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: badge.color }]}
                      >
                        {badge.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Confirm button */}
      <View style={styles.footer}>
        <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>
            Confirm: {selectedName} →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* Header */
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.green,
    marginBottom: 2,
  },
  headerSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
  },

  /* Scrollable card list */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg - 2,
    paddingBottom: spacing.lg,
  },

  /* Class card */
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.green,
    backgroundColor: colors.greenDim,
  },

  /* Emoji icon box */
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSelected: {
    backgroundColor: colors.greenDim,
  },
  iconEmoji: {
    fontSize: 24,
  },

  /* Card text */
  cardBody: {
    flex: 1,
  },
  className: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  classDesc: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textDim,
  },

  /* Stat badges */
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    fontWeight: "700",
  },

  /* Footer / confirm */
  footer: {
    padding: 14,
  },
  confirmBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.bg,
  },
});
