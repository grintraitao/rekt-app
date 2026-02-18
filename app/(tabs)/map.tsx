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
import { useGameStore, type ChapterInfo } from "../../src/store/gameStore";

/* ── Chapter helpers ──────────────────────────────────────────────────────── */

type ChapterStatus = "completed" | "current" | "locked";

function countCompletedInChapter(
  chapter: ChapterInfo,
  completedScenarios: string[],
): number {
  return chapter.scenarioIds.filter((id) => completedScenarios.includes(id)).length;
}

function getChapterStatus(
  chapter: ChapterInfo,
  playerLevel: number,
  completedInChapter: number,
): ChapterStatus {
  if (completedInChapter >= chapter.scenarioIds.length) return "completed";
  if (playerLevel >= chapter.requiredLevel) return "current";
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
  chapter: ChapterInfo;
  status: ChapterStatus;
  completed: number;
  onPress: () => void;
}) {
  const isLocked = status === "locked";
  const isCurrent = status === "current";
  const isCompleted = status === "completed";
  const total = chapter.scenarioIds.length;

  let statusText: string;
  if (isCompleted) {
    statusText = `✅ Complete · ${total}/${total}`;
  } else if (isCurrent) {
    statusText = `In progress · ${completed}/${total}`;
  } else {
    statusText = `🔒 Level ${chapter.requiredLevel}`;
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
        <Text style={styles.chapterEmoji}>{chapter.emoji}</Text>
      </View>

      <View style={styles.chapterInfo}>
        <Text
          style={[
            styles.chapterTitle,
            isCurrent && styles.chapterTitleCurrent,
            isLocked && styles.chapterTitleLocked,
          ]}
        >
          Ch.{chapter.id}: {chapter.name}
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
  const playerLevel = getLevel(xp);
  const chapters = useGameStore((s) => s.chapters);
  const completedScenarios = useGameStore((s) => s.completedScenarios);
  const { show: showToast, Toast } = useToast();

  // Find highest unlocked (non-locked) chapter for subtitle
  let currentChapterNum = 1;
  for (const ch of chapters) {
    const completed = countCompletedInChapter(ch, completedScenarios);
    const status = getChapterStatus(ch, playerLevel, completed);
    if (status !== "locked") currentChapterNum = ch.id;
  }

  function handleChapterPress(chapter: ChapterInfo, status: ChapterStatus) {
    if (status === "locked") {
      showToast(`Reach Level ${chapter.requiredLevel} to unlock`);
      return;
    }
    // Navigate to the first uncompleted scenario in this chapter
    const nextScenario = chapter.scenarioIds.find(
      (id) => !completedScenarios.includes(id),
    ) ?? chapter.scenarioIds[0];
    router.push(`/scenario/${nextScenario}` as never);
  }

  return (
    <View style={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>The Chain</Text>
        <Text style={styles.headerSub}>
          Chapter {currentChapterNum} of {chapters.length}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {chapters.map((ch, i) => {
          const completed = countCompletedInChapter(ch, completedScenarios);
          const status = getChapterStatus(ch, playerLevel, completed);
          const nextLocked =
            i < chapters.length - 1 &&
            getChapterStatus(
              chapters[i + 1],
              playerLevel,
              countCompletedInChapter(chapters[i + 1], completedScenarios),
            ) === "locked";

          return (
            <View key={ch.id}>
              <ChapterCard
                chapter={ch}
                status={status}
                completed={completed}
                onPress={() => handleChapterPress(ch, status)}
              />
              {/* Connector line */}
              {i < chapters.length - 1 && (
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
