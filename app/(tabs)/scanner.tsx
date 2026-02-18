import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../../src/theme";

/* ── Types & data ─────────────────────────────────────────────────────────── */

type RiskLevel = "safe" | "high" | "medium";

type RecentScan = {
  id: string;
  risk: RiskLevel;
  label: string;
  address: string;
  detail: string;
};

type Finding = {
  icon: string;
  text: string;
  color: string;
};

const RECENT_SCANS: RecentScan[] = [
  {
    id: "1",
    risk: "safe",
    label: "SAFE",
    address: "app.uniswap.org",
    detail: "Verified DEX · Scanned today",
  },
  {
    id: "2",
    risk: "high",
    label: "HIGH",
    address: "0x9f3...a1c",
    detail: "Honeypot detected · 2h ago",
  },
  {
    id: "3",
    risk: "medium",
    label: "MED",
    address: "moontoken.io",
    detail: "Unverified team · Yesterday",
  },
];

const MOCK_FINDINGS: Finding[] = [
  { icon: "🚩", text: "Contract not verified on Etherscan", color: colors.red },
  { icon: "🚩", text: "Top wallet holds 73% of supply", color: colors.red },
  { icon: "🚩", text: "Sell function appears disabled (honeypot)", color: colors.red },
  { icon: "⚠️", text: "Liquidity only $12k (low)", color: colors.orange },
  { icon: "✅", text: "No proxy contract detected", color: colors.green },
];

const RISK_BADGE_STYLES: Record<RiskLevel, { bg: string; text: string }> = {
  safe: { bg: colors.greenDim, text: colors.green },
  high: { bg: colors.redDim, text: colors.red },
  medium: { bg: colors.orangeDim, text: colors.orange },
};

/* ── Scanning animation ───────────────────────────────────────────────────── */

function ScanningOverlay() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.scanningOverlay}>
      <Animated.Text style={[styles.scanningIcon, { transform: [{ rotate }] }]}>
        🔍
      </Animated.Text>
      <Text style={styles.scanningText}>Scanning...</Text>
      <Text style={styles.scanningSubtext}>Analyzing contract & network data</Text>
    </View>
  );
}

/* ── Risk badge ───────────────────────────────────────────────────────────── */

function RiskBadge({ risk, label }: { risk: RiskLevel; label: string }) {
  const s = RISK_BADGE_STYLES[risk];
  return (
    <View style={[styles.riskBadge, { backgroundColor: s.bg }]}>
      <Text style={[styles.riskBadgeText, { color: s.text }]}>{label}</Text>
    </View>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

type ScreenView = "input" | "scanning" | "report";

export default function ScannerScreen() {
  const router = useRouter();
  const [view, setView] = useState<ScreenView>("input");
  const [inputValue, setInputValue] = useState("");

  function handleScan() {
    if (!inputValue.trim()) return;
    setView("scanning");
    setTimeout(() => setView("report"), 2000);
  }

  function handleScanAnother() {
    setInputValue("");
    setView("input");
  }

  /* ── Risk Report view ─────────────────────────────────── */
  if (view === "report") {
    const displayAddr =
      inputValue.length > 16
        ? inputValue.slice(0, 6) + "..." + inputValue.slice(-4)
        : inputValue;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleScanAnother} hitSlop={12}>
            <Text style={styles.backBtn}>← Back</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Risk indicator */}
          <View style={styles.reportHeader}>
            <Text style={styles.reportIcon}>🔴</Text>
            <Text style={styles.reportTitle}>HIGH RISK</Text>
            <Text style={styles.reportScore}>Risk Score: 82 / 100</Text>
            <View style={styles.addressPill}>
              <Text style={styles.addressText}>{displayAddr}</Text>
            </View>
          </View>

          {/* Findings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FINDINGS</Text>
            {MOCK_FINDINGS.map((f, i) => (
              <View key={i} style={styles.findingRow}>
                <Text style={styles.findingIcon}>{f.icon}</Text>
                <Text style={[styles.findingText, { color: f.color }]}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Game connection */}
          <View style={styles.section}>
            <View style={styles.gameCard}>
              <Text style={styles.gameCardLabel}>GAME CONNECTION</Text>
              <Text style={styles.gameCardText}>
                This matches the{" "}
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  Honeypot Token
                </Text>{" "}
                pattern from{" "}
                <Text style={{ color: colors.green, fontWeight: "600" }}>
                  Chapter 2, Scenario 3
                </Text>
                . You survived that one! 🛡️
              </Text>
              <Pressable
                style={styles.replayBtn}
                onPress={() => router.push("/scenario/honeypot" as never)}
              >
                <Text style={styles.replayBtnText}>Re-play Scenario →</Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom buttons */}
          <View style={styles.reportActions}>
            <Pressable
              style={styles.outlineBtn}
              onPress={() => router.push("/share-card" as never)}
            >
              <Text style={styles.outlineBtnText}>📸 Share Report</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={handleScanAnother}>
              <Text style={styles.primaryBtnText}>Scan Another</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  /* ── Scanning view ────────────────────────────────────── */
  if (view === "scanning") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔍 Scam Scanner</Text>
          <Text style={styles.headerSub}>
            Paste any link, contract, or token address
          </Text>
        </View>
        <ScanningOverlay />
      </View>
    );
  }

  /* ── Input view (default) ─────────────────────────────── */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 Scam Scanner</Text>
        <Text style={styles.headerSub}>
          Paste any link, contract, or token address
        </Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            placeholder="0x... or URL"
            placeholderTextColor={colors.textDim}
            value={inputValue}
            onChangeText={setInputValue}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            style={[styles.scanBtn, !inputValue.trim() && styles.scanBtnDisabled]}
            onPress={handleScan}
          >
            <Text style={styles.scanBtnText}>Scan Now 🔍</Text>
          </Pressable>
        </View>

        {/* Recent scans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT SCANS</Text>
          {RECENT_SCANS.map((scan) => (
            <Pressable
              key={scan.id}
              style={styles.recentRow}
              onPress={() => setInputValue(scan.address)}
            >
              <RiskBadge risk={scan.risk} label={scan.label} />
              <View style={styles.recentInfo}>
                <Text style={styles.recentAddress}>{scan.address}</Text>
                <Text style={styles.recentDetail}>{scan.detail}</Text>
              </View>
            </Pressable>
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

  /* Header */
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
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
  backBtn: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    color: colors.text,
  },

  /* Input section */
  inputSection: {
    padding: spacing.lg,
  },
  textInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
  },
  scanBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  scanBtnDisabled: {
    opacity: 0.4,
  },
  scanBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.bg,
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

  /* Recent scans */
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recentInfo: {
    flex: 1,
  },
  recentAddress: {
    fontSize: 11,
    color: colors.text,
  },
  recentDetail: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 1,
  },

  /* Risk badge */
  riskBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: 5,
  },
  riskBadgeText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },

  /* Scanning overlay */
  scanningOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanningIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  scanningText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
  },
  scanningSubtext: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginTop: spacing.xs,
  },

  /* Report header */
  reportHeader: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  reportIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  reportTitle: {
    fontFamily: fonts.mono,
    fontSize: 18,
    fontWeight: "700",
    color: colors.red,
  },
  reportScore: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.textDim,
    marginTop: 2,
  },
  addressPill: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  addressText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textDim,
  },

  /* Findings */
  findingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  findingIcon: {
    fontSize: 14,
    width: 22,
  },
  findingText: {
    fontSize: fontSize.md,
    flex: 1,
    lineHeight: 18,
  },

  /* Game connection card */
  gameCard: {
    backgroundColor: colors.purpleDim,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
  },
  gameCardLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.purple,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  gameCardText: {
    fontSize: 11,
    color: colors.textMid,
    lineHeight: 17,
  },
  replayBtn: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  replayBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.purple,
  },

  /* Report actions */
  reportActions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  outlineBtnText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: "600",
    color: colors.bg,
  },
});
