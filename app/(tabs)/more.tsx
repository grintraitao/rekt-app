import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { colors, spacing, fontSize, fonts, borderRadius, card } from "../../src/theme";

type SettingRowProps = {
  icon: string;
  label: string;
  value?: string;
  danger?: boolean;
};

function SettingRow({ icon, label, value, danger }: SettingRowProps) {
  return (
    <Pressable style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Text style={[styles.settingValue, danger && styles.settingDanger]}>
        {value ?? "→"}
      </Text>
    </Pressable>
  );
}

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Account */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <SettingRow icon="👤" label="Profile" value="Player_001 →" />
          <SettingRow icon="🔗" label="Linked Accounts" value="None →" />
          <SettingRow icon="☁️" label="Cloud Save" value="Off →" />
        </View>

        {/* Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferences</Text>
          <SettingRow icon="🔊" label="Sound Effects" value="On →" />
          <SettingRow icon="📳" label="Haptic Feedback" value="On →" />
          <SettingRow icon="🌐" label="Language" value="English →" />
        </View>

        {/* Game */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Game</Text>
          <SettingRow icon="🔄" label="Reset Progress" value="Reset →" danger />
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <SettingRow icon="📖" label="How To Play" />
          <SettingRow icon="📝" label="Terms of Service" />
          <SettingRow icon="🔒" label="Privacy Policy" />
          <SettingRow icon="💬" label="Feedback" />
        </View>

        <Text style={styles.version}>REKT v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    ...card,
  },
  cardTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  settingIcon: {
    fontSize: 16,
  },
  settingLabel: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  settingValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  settingDanger: {
    color: colors.red,
  },
  version: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
