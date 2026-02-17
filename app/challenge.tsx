import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, fontSize, spacing } from "../src/theme";

export default function ChallengeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.emoji}>🏆</Text>
      <Text style={styles.title}>Challenge Creator</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  back: { position: "absolute", top: spacing.xxl, left: spacing.lg },
  backText: { fontFamily: fonts.mono, fontSize: fontSize.md, color: colors.textDim },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { fontFamily: fonts.mono, fontSize: fontSize.xl, color: colors.text, marginBottom: spacing.xs },
  sub: { fontSize: fontSize.md, color: colors.textDim },
});
