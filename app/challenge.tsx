import { useRef, useState } from "react";
import {
  Animated,
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
} from "../src/theme";

/* ── Data ─────────────────────────────────────────────────────────────────── */

type ScamType = {
  id: string;
  emoji: string;
  label: string;
};

type Difficulty = {
  id: string;
  stars: string;
  label: string;
};

type PastChallenge = {
  id: string;
  emoji: string;
  name: string;
  stars: string;
  sentTo: number;
  rekt: number;
  total: number;
  note: string;
};

const SCAM_TYPES: ScamType[] = [
  { id: "phishing", emoji: "🎣", label: "Phishing" },
  { id: "honeypot", emoji: "🍯", label: "Honeypot" },
  { id: "social", emoji: "🤝", label: "Social" },
  { id: "contract", emoji: "📜", label: "Contract" },
  { id: "rugpull", emoji: "🎭", label: "Rug Pull" },
];

const DIFFICULTIES: Difficulty[] = [
  { id: "easy", stars: "★", label: "Easy" },
  { id: "medium", stars: "★★★", label: "Medium" },
  { id: "expert", stars: "★★★★★", label: "Expert" },
];

const PAST_CHALLENGES: PastChallenge[] = [
  {
    id: "1",
    emoji: "🎣",
    name: "Phishing DM",
    stars: "★★★",
    sentTo: 7,
    rekt: 4,
    total: 7,
    note: "57% fell",
  },
  {
    id: "2",
    emoji: "🍯",
    name: "Honeypot Token",
    stars: "★★",
    sentTo: 5,
    rekt: 2,
    total: 5,
    note: "40% fell",
  },
  {
    id: "3",
    emoji: "📜",
    name: "Approval Exploit",
    stars: "★★★★",
    sentTo: 3,
    rekt: 0,
    total: 3,
    note: "Smart friends!",
  },
];

/* ── Toast hook ───────────────────────────────────────────────────────────── */

function useToast() {
  const opacity = useRef(new Animated.Value(0)).current;
  const msgRef = useRef("");

  const show = (msg: string) => {
    msgRef.current = msg;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const Toast = () => (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.toastText}>{msgRef.current}</Text>
    </Animated.View>
  );

  return { show, Toast };
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function ChallengeScreen() {
  const router = useRouter();
  const [selectedScam, setSelectedScam] = useState("phishing");
  const [selectedDiff, setSelectedDiff] = useState("medium");
  const [message, setMessage] = useState("");
  const { show: showToast, Toast } = useToast();

  function handleCreate() {
    const link = `https://rekt.app/challenge/${selectedScam}?d=${selectedDiff}`;
    // TODO: integrate expo-clipboard or share sheet
    showToast("Link copied! 🔗");
  }

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
          <Text style={styles.headerTitle}>🏆 Challenge a Friend</Text>
          <Text style={styles.headerSub}>
            Pick a scam. See if they survive.
          </Text>
        </View>

        {/* ── Scam type ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SCAM TYPE</Text>
          <View style={styles.pillRow}>
            {SCAM_TYPES.map((scam) => {
              const active = selectedScam === scam.id;
              return (
                <Pressable
                  key={scam.id}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setSelectedScam(scam.id)}
                >
                  <Text
                    style={[styles.pillText, active && styles.pillTextActive]}
                  >
                    {scam.emoji} {scam.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Difficulty ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DIFFICULTY</Text>
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((diff) => {
              const active = selectedDiff === diff.id;
              return (
                <Pressable
                  key={diff.id}
                  style={[styles.diffBtn, active && styles.diffBtnActive]}
                  onPress={() => setSelectedDiff(diff.id)}
                >
                  <Text
                    style={[
                      styles.diffBtnText,
                      active && styles.diffBtnTextActive,
                    ]}
                  >
                    {diff.stars} {diff.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Custom message ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOM MESSAGE (OPTIONAL)</Text>
          <TextInput
            style={styles.messageInput}
            placeholder={'Bet you can\'t spot this one 😈'}
            placeholderTextColor={colors.textMid}
            value={message}
            onChangeText={setMessage}
            multiline
          />
        </View>

        {/* ── Create button ─────────────────────────────────── */}
        <View style={styles.section}>
          <Pressable style={styles.createBtn} onPress={handleCreate}>
            <Text style={styles.createBtnText}>Create & Share 🔗</Text>
          </Pressable>
        </View>

        {/* ── My Challenges ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY CHALLENGES</Text>
          {PAST_CHALLENGES.map((ch) => {
            const allSurvived = ch.rekt === 0;
            return (
              <View key={ch.id} style={styles.challengeCard}>
                <Text style={styles.challengeEmoji}>{ch.emoji}</Text>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeName}>
                    {ch.name} {ch.stars}
                  </Text>
                  <Text style={styles.challengeSub}>
                    Sent to {ch.sentTo} friends
                  </Text>
                </View>
                <View style={styles.challengeStats}>
                  <Text
                    style={[
                      styles.challengeRekt,
                      allSurvived && styles.challengeSafe,
                    ]}
                  >
                    {ch.rekt}/{ch.total} rekt
                  </Text>
                  <Text style={styles.challengeNote}>{ch.note}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Toast overlay */}
      <Toast />
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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

  /* Scam type pills */
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    borderColor: colors.yellow,
    backgroundColor: "rgba(255, 215, 0, 0.08)",
  },
  pillText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.textMid,
  },
  pillTextActive: {
    color: colors.yellow,
  },

  /* Difficulty buttons */
  diffRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diffBtnActive: {
    borderColor: colors.yellow,
    backgroundColor: "rgba(255, 215, 0, 0.08)",
  },
  diffBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textMid,
  },
  diffBtnTextActive: {
    color: colors.yellow,
  },

  /* Message input */
  messageInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    minHeight: 48,
  },

  /* Create button */
  createBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  createBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.bg,
  },

  /* Challenge result cards */
  challengeCard: {
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
  challengeEmoji: {
    fontSize: 16,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeName: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
  challengeSub: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 1,
  },
  challengeStats: {
    alignItems: "flex-end",
  },
  challengeRekt: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.red,
  },
  challengeSafe: {
    color: colors.green,
  },
  challengeNote: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 1,
  },

  /* Toast */
  toast: {
    position: "absolute",
    bottom: 80,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  toastText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.green,
  },
});
