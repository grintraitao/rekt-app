import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../src/theme";
import { useGearStore, GearItem } from "../src/store/gearStore";

/* ── Gear Card (inline-expandable) ─────────────────────────────────────────── */

function GearCard({
  item,
  equipped,
  onToggle,
}: {
  item: GearItem;
  equipped: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const locked = !item.unlocked;

  return (
    <Pressable
      style={[styles.slot, locked && styles.slotLocked]}
      onPress={() => {
        if (!locked) setExpanded((prev) => !prev);
      }}
    >
      <View style={styles.slotRow}>
        {/* Icon */}
        <View style={[styles.iconBox, equipped && styles.iconBoxEquipped]}>
          <Text style={styles.iconEmoji}>{item.icon}</Text>
        </View>

        {/* Info */}
        <View style={styles.slotInfo}>
          <Text style={[styles.gearName, locked && styles.textLocked]}>
            {item.name}
          </Text>
          <Text style={styles.gearSlotType}>{item.slot}</Text>
          <Text style={styles.gearEffect}>
            {locked ? item.unlockHint : item.effect}
          </Text>
        </View>

        {/* Equipped indicator */}
        {equipped && (
          <View style={styles.equippedDot}>
            <Text style={styles.equippedDotText}>ON</Text>
          </View>
        )}
      </View>

      {/* Expanded detail */}
      {expanded && !locked && (
        <View style={styles.expandedSection}>
          <Text style={styles.expandedDesc}>{item.description}</Text>
          <View style={styles.expandedMeta}>
            <Text style={styles.expandedSlotBadge}>{item.slot}</Text>
            <Text style={styles.expandedEffect}>{item.effect}</Text>
          </View>
          <Pressable
            style={[
              styles.actionBtn,
              equipped ? styles.actionBtnDanger : styles.actionBtnPrimary,
            ]}
            onPress={onToggle}
          >
            <Text
              style={[
                styles.actionBtnText,
                equipped
                  ? styles.actionBtnTextDanger
                  : styles.actionBtnTextPrimary,
              ]}
            >
              {equipped ? "Unequip" : "Equip"}
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function GearScreen() {
  const router = useRouter();
  const equippedGear = useGearStore((s) => s.equippedGear());
  const availableGear = useGearStore((s) => s.availableGear());
  const equippedIds = useGearStore((s) => s.equippedIds);
  const allGear = useGearStore((s) => s.allGear);
  const toggleGear = useGearStore((s) => s.toggleGear);

  const equippedCount = equippedIds.length;
  const totalCount = allGear.length;

  return (
    <View style={styles.container}>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🎒</Text>
          <Text style={styles.headerTitle}>Security Gear</Text>
          <Text style={styles.headerSubtitle}>
            {equippedCount}/{totalCount} equipped
          </Text>
        </View>

        {/* ── Equipped section ──────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EQUIPPED</Text>
          {equippedGear.length === 0 ? (
            <Text style={styles.emptyText}>No gear equipped</Text>
          ) : (
            equippedGear.map((item) => (
              <GearCard
                key={item.id}
                item={item}
                equipped
                onToggle={() => toggleGear(item.id)}
              />
            ))
          )}
        </View>

        {/* ── Available section ─────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AVAILABLE</Text>
          {availableGear.map((item) => (
            <GearCard
              key={item.id}
              item={item}
              equipped={false}
              onToggle={() => toggleGear(item.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────────── */

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

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    color: colors.text,
  },

  /* Header */
  header: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  headerIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.green,
    marginTop: spacing.xs,
  },

  /* Sections */
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textDim,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },

  /* Gear slot card */
  slot: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  slotLocked: {
    opacity: 0.4,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  /* Icon */
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxEquipped: {
    borderWidth: 1,
    borderColor: colors.green,
  },
  iconEmoji: {
    fontSize: 18,
  },

  /* Slot info */
  slotInfo: {
    flex: 1,
  },
  gearName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  gearSlotType: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 1,
  },
  gearEffect: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginTop: 2,
  },
  textLocked: {
    color: colors.textMid,
  },

  /* Equipped indicator */
  equippedDot: {
    backgroundColor: colors.greenDim,
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  equippedDotText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.green,
  },

  /* Expanded detail */
  expandedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expandedDesc: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  expandedMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  expandedSlotBadge: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.purple,
    backgroundColor: colors.purpleDim,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
    overflow: "hidden",
  },
  expandedEffect: {
    fontSize: fontSize.sm,
    color: colors.green,
  },

  /* Action button */
  actionBtn: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  actionBtnPrimary: {
    backgroundColor: colors.greenDim,
    borderWidth: 1,
    borderColor: colors.green,
  },
  actionBtnDanger: {
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: colors.red,
  },
  actionBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  actionBtnTextPrimary: {
    color: colors.green,
  },
  actionBtnTextDanger: {
    color: colors.red,
  },
});
