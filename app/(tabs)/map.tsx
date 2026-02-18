import { useRef } from "react";
import {
  Animated,
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
} from "../../src/theme";
import { usePlayerStore, getLevel } from "../../src/store/playerStore";

/* ── Chapter data ─────────────────────────────────────────────────────────── */

type ChapterStatus = "completed" | "current" | "locked";

type Chapter = {
  num: number;
  title: string;
  icon: string;
  /** Scenarios in this chapter */
  totalScenarios: number;
  /** Level required to unlock (0 = always unlocked) */
  unlockLevel: number;
};

const CHAPTERS: Chapter[] = [
  { num: 1, title: "Genesis Block", icon: "🏠", totalScenarios: 5, unlockLevel: 0 },
  { num: 2, title: "DEX District", icon: "🏦", totalScenarios: 5, unlockLevel: 5 },
  { num: 3, title: "NFT Bazaar", icon: "🎨", totalScenarios: 5, unlockLevel: 15 },
  { num: 4, title: "Bridge City", icon: "🌉", totalScenarios: 5, unlockLevel: 20 },
  { num: 5, title: "The Dark Pool", icon: "💀", totalScenarios: 5, unlockLevel: 25 },
];

/** Map scenario IDs to chapter numbers (prefix-based) */
function countCompletedInChapter(
  chapter: number,
  completedScenarios: string[],
): number {
  const prefix = `ch${chapter}-`;
  return completedScenarios.filter((id) => id.startsWith(prefix)).length;
}

function getChapterStatus(
  chapter: Chapter,
  playerLevel: number,
  completedInChapter: number,
): ChapterStatus {
  if (completedInChapter >= chapter.totalScenarios) return "completed";
  if (playerLevel >= chapter.unlockLevel) return "current";
  return "locked";
}

/* ── Toast component ──────────────────────────────────────────────────────── */

function useToast() {
  const opacity = useRef(new Animated.Value(0)).current;
  const messageRef = useRef("");

  const show = (msg: string) => {
    messageRef.current = msg;
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const Toast = () => (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.toastText}>{messageRef.current}</Text>
    </Animated.View>
  );

  return { show, Toast };
}

/* ── Chapter card ─────────────────────────────────────────────────────────── */

function ChapterCard({
  chapter,
  status,
  completed,
  onPress,
}: {
  chapter: Chapter;
  status: ChapterStatus;
  completed: number;
  onPress: () => void;
}) {
  const isLocked = status === "locked";
  const isCurrent = status === "current";
  const isCompleted = status === "completed";

  let statusText: string;
  if (isCompleted) {
    statusText = `✅ Complete · ${chapter.totalScenarios}/${chapter.totalScenarios}`;
  } else if (isCurrent) {
    statusText = `In progress · ${completed}/${chapter.totalScenarios}`;
  } else {
    statusText = `🔒 Level ${chapter.unlockLevel}`;
  }

  return (
    <Pressable
      style={[
        styles.chapterCard,
        isCurrent && styles.chapterCurrent,
        isLocked && styles.chapterLocked,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.chapterIcon,
          (isCurrent || isCompleted) && styles.chapterIconActive,
        ]}
      >
        <Text style={styles.chapterEmoji}>{chapter.icon}</Text>
      </View>

      <View style={styles.chapterInfo}>
        <Text
          style={[
            styles.chapterTitle,
            isCurrent && styles.chapterTitleCurrent,
            isLocked && styles.chapterTitleLocked,
          ]}
        >
          Ch.{chapter.num}: {chapter.title}
        </Text>
        <Text style={styles.chapterStatus}>{statusText}</Text>
      </View>

      {(isCurrent || isCompleted) && (
        <Text style={styles.chapterArrow}>→</Text>
      )}
    </Pressable>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function MapScreen() {
  const router = useRouter();
  const xp = usePlayerStore((s) => s.xp);
  const completedScenarios = usePlayerStore((s) => s.completedScenarios);
  const playerLevel = getLevel(xp);
  const { show: showToast, Toast } = useToast();

  // Find highest unlocked (non-locked) chapter for subtitle
  let currentChapterNum = 1;
  for (const ch of CHAPTERS) {
    const completed = countCompletedInChapter(ch.num, completedScenarios);
    const status = getChapterStatus(ch, playerLevel, completed);
    if (status !== "locked") currentChapterNum = ch.num;
  }

  // Map chapter numbers to their first scenario type
  const CHAPTER_SCENARIO: Record<number, string> = {
    1: "phishing",
    2: "approval-scam",
    3: "honeypot",
    4: "fake-airdrop",
    5: "impersonation",
  };

  function handleChapterPress(chapter: Chapter, status: ChapterStatus) {
    if (status === "locked") {
      showToast(`Reach Level ${chapter.unlockLevel} to unlock`);
      return;
    }
    const scenarioType = CHAPTER_SCENARIO[chapter.num] ?? "phishing";
    router.push(`/scenario/${scenarioType}` as never);
  }

  return (
    <View style={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>The Chain</Text>
        <Text style={styles.headerSub}>
          Chapter {currentChapterNum} of {CHAPTERS.length}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CHAPTERS.map((ch, i) => {
          const completed = countCompletedInChapter(ch.num, completedScenarios);
          const status = getChapterStatus(ch, playerLevel, completed);
          const nextLocked =
            i < CHAPTERS.length - 1 &&
            getChapterStatus(
              CHAPTERS[i + 1],
              playerLevel,
              countCompletedInChapter(CHAPTERS[i + 1].num, completedScenarios),
            ) === "locked";

          return (
            <View key={ch.num}>
              <ChapterCard
                chapter={ch}
                status={status}
                completed={completed}
                onPress={() => handleChapterPress(ch, status)}
              />
              {/* Connector line */}
              {i < CHAPTERS.length - 1 && (
                <View style={styles.connectorWrap}>
                  <View
                    style={[
                      styles.connectorLine,
                      nextLocked && styles.connectorDim,
                    ]}
                  />
                </View>
              )}
            </View>
          );
        })}
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

  /* Scroll */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing["4xl"],
  },

  /* Chapter card */
  chapterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  chapterCurrent: {
    borderColor: colors.green,
  },
  chapterLocked: {
    opacity: 0.35,
  },

  /* Chapter icon */
  chapterIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterIconActive: {
    backgroundColor: colors.greenDim,
  },
  chapterEmoji: {
    fontSize: 16,
  },

  /* Chapter info */
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  chapterTitleCurrent: {
    color: colors.green,
  },
  chapterTitleLocked: {
    color: colors.textDim,
  },
  chapterStatus: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 2,
  },
  chapterArrow: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    color: colors.green,
  },

  /* Connector */
  connectorWrap: {
    alignItems: "center",
    height: 20,
    justifyContent: "center",
  },
  connectorLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  connectorDim: {
    opacity: 0.3,
  },

  /* Toast */
  toast: {
    position: "absolute",
    bottom: 80,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  toastText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
