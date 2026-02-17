import { StyleSheet, Text, View, ScrollView } from "react-native";
import { colors, spacing, fontSize, fonts, borderRadius, card } from "../../src/theme";

const chapters = [
  { num: 1, title: "The Honeypot", level: "Lvl 1", unlocked: true, icon: "🍯" },
  { num: 2, title: "The Rug Pull", level: "Lvl 5", unlocked: false, icon: "🧶" },
  { num: 3, title: "The Phishing Net", level: "Lvl 10", unlocked: false, icon: "🎣" },
  { num: 4, title: "The Insider", level: "Lvl 18", unlocked: false, icon: "🕵️" },
  { num: 5, title: "The Dark Pool", level: "Lvl 25", unlocked: false, icon: "💀" },
];

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ World Map</Text>
        <Text style={styles.headerSub}>5 Chapters · 30+ Scenarios</Text>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {chapters.map((ch, i) => (
          <View key={ch.num}>
            <View
              style={[
                styles.chapterCard,
                !ch.unlocked && styles.chapterLocked,
              ]}
            >
              <View style={styles.chapterIcon}>
                <Text style={styles.chapterEmoji}>{ch.icon}</Text>
              </View>
              <View style={styles.chapterInfo}>
                <Text
                  style={[
                    styles.chapterTitle,
                    !ch.unlocked && styles.textLocked,
                  ]}
                >
                  Ch.{ch.num}: {ch.title}
                </Text>
                <Text style={styles.chapterLevel}>
                  {ch.unlocked ? "🔓 " : "🔒 "}
                  {ch.level}
                </Text>
              </View>
              {ch.unlocked && (
                <Text style={styles.chapterArrow}>→</Text>
              )}
            </View>

            {/* Connector line between chapters */}
            {i < chapters.length - 1 && (
              <View style={styles.connector}>
                <View
                  style={[
                    styles.connectorLine,
                    !chapters[i + 1].unlocked && styles.connectorDim,
                  ]}
                />
              </View>
            )}
          </View>
        ))}
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
  },
  chapterCard: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  chapterLocked: {
    opacity: 0.4,
  },
  chapterIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterEmoji: {
    fontSize: 22,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  textLocked: {
    color: colors.textMuted,
  },
  chapterLevel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  chapterArrow: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    color: colors.green,
  },
  connector: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
  },
  connectorLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.green,
    borderRadius: 1,
  },
  connectorDim: {
    backgroundColor: colors.border,
    opacity: 0.3,
  },
});
