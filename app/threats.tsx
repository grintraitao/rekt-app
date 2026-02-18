import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../src/theme";
import threatsData from "../src/data/threats.json";

/* ── Types ────────────────────────────────────────────────────────────────── */

type Severity = "critical" | "warning" | "info";

type Threat = {
  id: string;
  severity: Severity;
  severityLabel: string;
  time: string;
  title: string;
  description: string;
  gameConnection: string | null;
  scenarioType: string | null;
  scanAddress: string | null;
  buttons: string[];
};

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: colors.red,
  warning: colors.orange,
  info: colors.cyan,
};

/* ── Threat card ──────────────────────────────────────────────────────────── */

function ThreatCard({
  threat,
  onReplay,
  onScan,
}: {
  threat: Threat;
  onReplay: () => void;
  onScan: () => void;
}) {
  const borderColor = SEVERITY_COLOR[threat.severity];
  const severityColor = SEVERITY_COLOR[threat.severity];

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      {/* Severity + time */}
      <Text style={[styles.severity, { color: severityColor }]}>
        {threat.severityLabel} · {threat.time}
      </Text>

      {/* Title */}
      <Text style={styles.cardTitle}>{threat.title}</Text>

      {/* Description */}
      <Text style={styles.cardDesc}>{threat.description}</Text>

      {/* Game connection */}
      {threat.gameConnection && (
        <View style={styles.gameBox}>
          <Text style={styles.gameBoxText}>
            🎮 {threat.gameConnection}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.btnRow}>
        {threat.buttons.includes("readMore") && (
          <Pressable style={styles.pillBtn}>
            <Text style={styles.pillBtnText}>Read More →</Text>
          </Pressable>
        )}
        {threat.buttons.includes("replay") && (
          <Pressable style={styles.pillBtnGreen} onPress={onReplay}>
            <Text style={styles.pillBtnGreenText}>Re-play Scenario 🔄</Text>
          </Pressable>
        )}
        {threat.buttons.includes("scan") && (
          <Pressable style={styles.pillBtnGreen} onPress={onScan}>
            <Text style={styles.pillBtnGreenText}>Scan with Scanner 🔍</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function ThreatsScreen() {
  const router = useRouter();
  const threats = threatsData as Threat[];

  return (
    <View style={styles.container}>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
      </View>

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Live Threats</Text>
        <Text style={styles.headerSub}>
          Updated 2 hours ago · {threats.length} new alerts
        </Text>
      </View>

      {/* ── List ────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {threats.map((threat) => (
          <ThreatCard
            key={threat.id}
            threat={threat}
            onReplay={() => {
              if (threat.scenarioType) {
                router.push(`/scenario/${threat.scenarioType}` as never);
              }
            }}
            onScan={() => {
              // Navigate to scanner tab — the scanner will pick up from there
              router.push("/(tabs)/scanner" as never);
            }}
          />
        ))}
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
    padding: spacing.lg,
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
  },
  headerSub: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginTop: spacing.xs,
  },

  /* Threat card */
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  /* Severity */
  severity: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },

  /* Card content */
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },

  /* Game connection box */
  gameBox: {
    backgroundColor: "rgba(139, 92, 246, 0.08)",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  gameBoxText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.purple,
  },

  /* Action buttons */
  btnRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  pillBtn: {
    backgroundColor: colors.surface2,
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  pillBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textMid,
  },
  pillBtnGreen: {
    backgroundColor: colors.greenDim,
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  pillBtnGreenText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.green,
  },
});
