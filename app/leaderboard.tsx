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
import { usePlayerStore, getLevel, getLevelProgress } from "../src/store/playerStore";

/* ── Filter tabs ──────────────────────────────────────────────────────────── */

type TabKey = "global" | "friends" | "weekly";

const TABS: { key: TabKey; label: string }[] = [
  { key: "global", label: "Global" },
  { key: "friends", label: "Friends" },
  { key: "weekly", label: "Weekly" },
];

/* ── Mock data ────────────────────────────────────────────────────────────── */

type LeaderboardEntry = {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  survivalRate: number;
  xp: number;
  isPlayer?: boolean;
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "CryptoKing", avatar: "👑", level: 28, survivalRate: 97, xp: 12450 },
  { rank: 2, name: "ShadowTrader", avatar: "🥷", level: 25, survivalRate: 94, xp: 11200 },
  { rank: 3, name: "DiamondApe", avatar: "💎", level: 23, survivalRate: 91, xp: 10800 },
  { rank: 4, name: "DeFiWhale", avatar: "🐋", level: 21, survivalRate: 89, xp: 9400 },
  { rank: 5, name: "ChainGuard", avatar: "🛡️", level: 19, survivalRate: 88, xp: 8100 },
  { rank: 6, name: "TokenSensei", avatar: "🧠", level: 17, survivalRate: 87, xp: 7200 },
  { rank: 7, name: "NightOwl", avatar: "🦉", level: 15, survivalRate: 85, xp: 5800 },
  // Player slot inserted at rank 8
  { rank: 9, name: "MoonHunter", avatar: "🌙", level: 11, survivalRate: 82, xp: 3900 },
  { rank: 10, name: "RookieNode", avatar: "🔰", level: 8, survivalRate: 78, xp: 2600 },
];

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const TOP_TINT: Record<number, string> = {
  1: colors.yellow,
  2: "#c0c0c0",
  3: "#cd7f32",
};

/* ── Row component ────────────────────────────────────────────────────────── */

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const isTop3 = entry.rank <= 3;
  const isPlayer = entry.isPlayer === true;

  return (
    <View
      style={[
        styles.row,
        isPlayer && styles.rowPlayer,
      ]}
    >
      {/* Rank */}
      <Text
        style={[
          styles.rank,
          isTop3 && { color: TOP_TINT[entry.rank] },
          isPlayer && styles.rankPlayer,
        ]}
      >
        {MEDAL[entry.rank] ?? entry.rank}
      </Text>

      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>{entry.avatar}</Text>
      </View>

      {/* Name + subtitle */}
      <View style={styles.info}>
        <Text style={[styles.name, isPlayer && styles.namePlayer]}>
          {entry.name}
          {isPlayer ? "  YOU" : ""}
        </Text>
        <Text style={styles.sub}>
          Level {entry.level} · {entry.survivalRate}% survival
        </Text>
      </View>

      {/* XP score */}
      <Text style={[styles.score, isTop3 && { color: TOP_TINT[entry.rank] }]}>
        {entry.xp.toLocaleString()} XP
      </Text>
    </View>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function LeaderboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("global");

  const username = usePlayerStore((s) => s.username);
  const xp = usePlayerStore((s) => s.xp);
  const survived = usePlayerStore((s) => s.survived);
  const rektCount = usePlayerStore((s) => s.rektCount);
  const selectedClass = usePlayerStore((s) => s.playerClass);

  const playerLevel = getLevel(xp);
  const total = survived + rektCount;
  const survivalRate = total > 0 ? Math.round((survived / total) * 100) : 0;

  const CLASS_AVATAR: Record<string, string> = {
    ape: "🐵",
    analyst: "🧠",
    shadow: "🥷",
    degen: "🎲",
  };

  // Build full list with player inserted at rank 8
  const playerEntry: LeaderboardEntry = {
    rank: 8,
    name: username,
    avatar: CLASS_AVATAR[selectedClass ?? "ape"] ?? "🐵",
    level: playerLevel,
    survivalRate,
    xp: xp || 4340, // fallback for demo
    isPlayer: true,
  };

  const fullBoard = [
    ...MOCK_LEADERBOARD.filter((e) => e.rank <= 7),
    playerEntry,
    ...MOCK_LEADERBOARD.filter((e) => e.rank >= 9),
  ];

  return (
    <View style={styles.container}>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
      </View>

      {/* ── Header + tabs ───────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── List ────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {fullBoard.map((entry) => (
          <LeaderboardRow key={entry.rank} entry={entry} />
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
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },

  /* Tabs */
  tabRow: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  tab: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.green,
  },
  tabText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.textDim,
  },
  tabTextActive: {
    color: colors.green,
    fontWeight: "600",
  },

  /* Scroll */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["4xl"],
  },

  /* Row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  rowPlayer: {
    backgroundColor: colors.greenDim,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    borderBottomWidth: 0,
  },

  /* Rank */
  rank: {
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 26,
    textAlign: "center",
    color: colors.text,
  },
  rankPlayer: {
    color: colors.green,
  },

  /* Avatar */
  avatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 15,
  },

  /* Info */
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  namePlayer: {
    color: colors.green,
  },
  sub: {
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 1,
  },

  /* Score */
  score: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.green,
    textAlign: "right",
  },
});
