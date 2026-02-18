import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
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
  card,
} from "../../src/theme";
import { usePlayerStore } from "../../src/store/playerStore";
import { usePortfolioStore } from "../../src/store/portfolioStore";
import { useGameStore } from "../../src/store/gameStore";
import { useScenarioStore } from "../../src/store/scenarioStore";
import { useGearStore } from "../../src/store/gearStore";

/* ── Toggle component ─────────────────────────────────────────────────────── */

function Toggle({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={[styles.toggleTrack, value && styles.toggleTrackOn]}
      onPress={onToggle}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </Pressable>
  );
}

/* ── Setting row ──────────────────────────────────────────────────────────── */

type SettingRowProps = {
  icon: string;
  label: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: () => void;
};

function SettingRow({
  icon,
  label,
  value,
  danger,
  onPress,
  toggle,
  toggleValue,
  onToggle,
}: SettingRowProps) {
  return (
    <Pressable style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIconBox}>
          <Text style={styles.settingIcon}>{icon}</Text>
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {toggle && onToggle ? (
        <Toggle value={toggleValue ?? false} onToggle={onToggle} />
      ) : (
        <Text style={[styles.settingValue, danger && styles.settingDanger]}>
          {value ?? "→"}
        </Text>
      )}
    </Pressable>
  );
}

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

export default function MoreScreen() {
  const router = useRouter();
  const username = usePlayerStore((s) => s.username);
  const { show: showToast, Toast } = useToast();

  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);

  function handleResetProgress() {
    if (Platform.OS === "web") {
      // Web doesn't support Alert.alert, use confirm
      const confirmed = window.confirm(
        "Reset all progress? This cannot be undone.",
      );
      if (confirmed) resetAllStores();
    } else {
      Alert.alert(
        "Reset Progress",
        "Reset all progress? This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reset",
            style: "destructive",
            onPress: resetAllStores,
          },
        ],
      );
    }
  }

  function resetAllStores() {
    usePlayerStore.getState().resetAll();
    usePortfolioStore.getState().resetPortfolio();
    useGameStore.getState().resetGame();
    useScenarioStore.getState().resetScenario();
    useGearStore.setState({
      equippedIds: ["paper-wallet", "bookmark-bar", "2fa-shield"],
    });

    router.replace("/onboarding" as never);
  }

  return (
    <View style={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Account ───────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACCOUNT</Text>
          <SettingRow
            icon="👤"
            label="Profile"
            value={`${username} →`}
            onPress={() => router.push("/(tabs)/stats" as never)}
          />
          <SettingRow
            icon="🔑"
            label="Link Account"
            value="Google →"
            onPress={() => showToast("Account linking coming soon")}
          />
        </View>

        {/* ── Preferences ───────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PREFERENCES</Text>
          <SettingRow
            icon="🔔"
            label="Notifications"
            toggle
            toggleValue={notifications}
            onToggle={() => setNotifications((v) => !v)}
          />
          <SettingRow
            icon="🔊"
            label="Sound"
            toggle
            toggleValue={sound}
            onToggle={() => setSound((v) => !v)}
          />
          <SettingRow
            icon="🌍"
            label="Language"
            value="EN →"
            onPress={() => showToast("More languages coming soon")}
          />
        </View>

        {/* ── Game ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>GAME</Text>
          <SettingRow
            icon="🔔"
            label="Live Threats"
            value="3 new →"
            onPress={() => router.push("/threats" as never)}
          />
          <SettingRow
            icon="🔄"
            label="Reset Progress"
            value="Reset →"
            danger
            onPress={handleResetProgress}
          />
        </View>

        <Text style={styles.version}>REKT v1.0.0</Text>
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

  /* Scroll */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing["4xl"],
  },

  /* Card */
  card: {
    ...card,
  },
  cardTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },

  /* Setting row */
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingIconBox: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  settingIcon: {
    fontSize: 15,
  },
  settingLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  settingValue: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDim,
  },
  settingDanger: {
    color: colors.red,
  },

  /* Toggle */
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackOn: {
    backgroundColor: colors.green,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  toggleThumbOn: {
    alignSelf: "flex-end",
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

  /* Version */
  version: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
