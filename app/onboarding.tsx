import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../src/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/* ── Slide data ─────────────────────────────────────────────────────────────── */

type Slide = {
  emoji: string;
  titleParts: { text: string; color?: string; newLine?: boolean }[];
  subtitle: string;
  cta: string;
  ctaType: "outline" | "primary";
};

const slides: Slide[] = [
  {
    emoji: "💀",
    titleParts: [
      { text: "Your crypto" },
      { text: "\n", newLine: true },
      { text: "WILL", color: colors.red },
      { text: " get hacked." },
    ],
    subtitle:
      "92% of crypto users encounter a scam. Most lose everything.",
    cta: "Swipe →",
    ctaType: "outline",
  },
  {
    emoji: "🛡️",
    titleParts: [
      { text: "Learn by" },
      { text: "\n", newLine: true },
      { text: "experiencing", color: colors.green },
      { text: " it." },
    ],
    subtitle:
      "A safe simulation. No real assets. Real scam patterns from the wild.",
    cta: "Swipe →",
    ctaType: "outline",
  },
  {
    emoji: "💰",
    titleParts: [
      { text: "Here's " },
      { text: "$10,000", color: colors.yellow },
      { text: "." },
      { text: "\n", newLine: true },
      { text: "Try to keep it." },
    ],
    subtitle:
      "Build your portfolio. Survive the scams. Don't get REKT.",
    cta: "Start Playing →",
    ctaType: "primary",
  },
];

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleCta = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      router.replace("/character-select");
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      {/* Decorative status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>9:41</Text>
        <Text style={styles.statusText}>⚡ 82%</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.emoji}>{item.emoji}</Text>

        <Text style={styles.title}>
          {item.titleParts.map((part, i) =>
            part.newLine ? (
              "\n"
            ) : (
              <Text
                key={i}
                style={part.color ? { color: part.color } : undefined}
              >
                {part.text}
              </Text>
            ),
          )}
        </Text>

        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>

      {/* Bottom area: dots + CTA */}
      <View style={styles.bottomArea}>
        {/* Dot pagination */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleCta}
          style={[
            styles.ctaButton,
            item.ctaType === "primary" && styles.ctaPrimary,
          ]}
        >
          <Text
            style={[
              styles.ctaText,
              item.ctaType === "primary" && styles.ctaPrimaryText,
            ]}
          >
            {item.cta}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        extraData={activeIndex}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* Each slide fills the screen */
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.bg,
  },

  /* Decorative status bar */
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    height: 34,
  },
  statusText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textDim,
  },

  /* Centered content area */
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["3xl"],
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing["2xl"],
  },
  title: {
    fontFamily: fonts.body,
    fontSize: 28,
    fontWeight: "800",
    color: colors.white,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    color: colors.textMid,
    textAlign: "center",
    lineHeight: 22,
  },

  /* Bottom section */
  bottomArea: {
    paddingHorizontal: spacing["3xl"],
    paddingBottom: spacing["4xl"],
    alignItems: "center",
    gap: spacing.xl,
  },

  /* Dot pagination */
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textDim,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },

  /* CTA button */
  ctaButton: {
    width: "100%",
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimary: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  ctaText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xl,
    fontWeight: "600",
    color: colors.text,
  },
  ctaPrimaryText: {
    color: colors.bg,
  },
});
