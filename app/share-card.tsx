import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../src/theme";

/* ── Screen ───────────────────────────────────────────────────────────────────── */

export default function ShareCardScreen() {
  const router = useRouter();
  const cardRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const {
    type = "rekt",
    amount = "34201",
    detail = "Unknown Scam",
    stat = "73% fell for this",
  } = useLocalSearchParams<{
    type: string;
    amount: string;
    detail: string;
    stat: string;
  }>();

  const isRekt = type === "rekt";
  const amountNum = parseInt(amount, 10) || 0;
  const formattedAmount = amountNum.toLocaleString("en-US");
  const accentColor = isRekt ? colors.red : colors.green;
  const borderTint = isRekt
    ? "rgba(255, 51, 102, 0.3)"
    : "rgba(0, 255, 136, 0.3)";

  /* ── Capture card as image ─────────────────────────────────────────────────── */

  async function captureCard(): Promise<string | null> {
    if (!cardRef.current) return null;
    try {
      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
      });
      return uri;
    } catch {
      Alert.alert("Error", "Failed to capture card image.");
      return null;
    }
  }

  /* ── Save to gallery ───────────────────────────────────────────────────────── */

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Allow access to save screenshots to your gallery."
        );
        return;
      }

      const uri = await captureCard();
      if (!uri) return;

      await MediaLibrary.saveToLibraryAsync(uri);

      Alert.alert("Saved!", "Card saved to your gallery.");
    } catch {
      Alert.alert("Error", "Could not save to gallery.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Share ─────────────────────────────────────────────────────────────────── */

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Sharing not available", "Sharing is not supported on this device.");
        return;
      }

      const uri = await captureCard();
      if (!uri) return;

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: isRekt ? "I got REKT!" : "I SURVIVED!",
      });
    } catch {
      // User cancelled share — not an error
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      {/* ── Share card (capturable) ──────────────────────────────── */}
      <View style={styles.cardContainer}>
        <View
          ref={cardRef}
          collapsable={false}
          style={[styles.card, { borderColor: borderTint }]}
        >
          <Text style={styles.cardEmoji}>{isRekt ? "💀" : "🛡️"}</Text>

          <Text style={[styles.cardTitle, { color: accentColor }]}>
            {isRekt ? "GOT REKT" : "SURVIVED"}
          </Text>

          <Text style={[styles.cardAmount, { color: accentColor }]}>
            {isRekt ? `-$${formattedAmount}` : `$${formattedAmount} safe`}
          </Text>

          <Text style={styles.cardDetail}>{detail}</Text>
          <Text style={styles.cardStat}>{stat}</Text>

          <Text style={styles.watermark}>
            REKT — CRYPTO SURVIVAL RPG
          </Text>
        </View>
      </View>

      {/* ── Action buttons ───────────────────────────────────────── */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.saveBtn]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.actionBtnText}>
            {saving ? "Saving..." : "📸 Save Screenshot"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.shareBtn]}
          onPress={handleShare}
          disabled={sharing}
        >
          <Text style={styles.shareBtnText}>
            {sharing ? "Sharing..." : "📤 Share"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.doneBtn]}
          onPress={() => router.replace("/(tabs)" as never)}
        >
          <Text style={styles.doneBtnText}>Done →</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* Top bar */
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.green,
  },

  /* Card container — centres card vertically */
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },

  /* The shareable card */
  card: {
    width: "100%" as unknown as number,
    backgroundColor: "#0f0f1e",
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing["2xl"],
    alignItems: "center",
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  cardAmount: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xl,
    marginTop: 2,
    marginBottom: 10,
  },
  cardDetail: {
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 19,
    textAlign: "center",
  },
  cardStat: {
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 19,
    textAlign: "center",
  },
  watermark: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    letterSpacing: 2,
    marginTop: 14,
  },

  /* Action buttons */
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["3xl"],
    gap: spacing.sm,
  },
  actionBtn: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
  },
  shareBtn: {
    backgroundColor: colors.green,
  },
  shareBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.bg,
  },
  doneBtn: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneBtnText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textMid,
  },
});
