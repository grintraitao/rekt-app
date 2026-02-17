import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from "../src/theme";
import { useNotificationStore } from "../src/store/notificationStore";

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markRead, markAllRead, unreadCount } =
    useNotificationStore();

  const hasUnread = unreadCount() > 0;

  return (
    <View style={styles.container}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {hasUnread && (
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {/* ── List ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.map((notif) => {
          const isScam = !!notif.scamType;

          const handlePress = () => {
            if (isScam) {
              markRead(notif.id);
              router.push(`/scenario/${notif.scamType}` as never);
            } else {
              markRead(notif.id);
            }
          };

          return (
            <Pressable
              key={notif.id}
              style={[styles.row, notif.read && styles.rowRead]}
              onPress={handlePress}
            >
              {/* Unread dot */}
              <View style={styles.dotCol}>
                {!notif.read && <View style={styles.dot} />}
              </View>

              {/* Icon */}
              <View
                style={[styles.iconCircle, { backgroundColor: notif.iconBg }]}
              >
                <Text style={styles.iconEmoji}>{notif.icon}</Text>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text
                  style={[
                    styles.title,
                    isScam && styles.titleScam,
                    notif.read && styles.titleRead,
                  ]}
                  numberOfLines={1}
                >
                  {notif.title}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    isScam && styles.subtitleScam,
                  ]}
                  numberOfLines={1}
                >
                  {notif.subtitle}
                </Text>
              </View>

              {/* Timestamp */}
              <Text style={styles.time}>{notif.time}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    gap: 2,
  },
  backText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.green,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.xs,
  },
  markAllText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.green,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },

  /* Notification row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  rowRead: {
    opacity: 0.5,
  },

  /* Unread dot */
  dotCol: {
    width: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },

  /* Icon */
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  iconEmoji: {
    fontSize: 16,
  },

  /* Content */
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  titleScam: {
    color: colors.yellow,
  },
  titleRead: {
    fontWeight: "400",
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginTop: 1,
  },
  subtitleScam: {
    color: colors.yellowDim,
  },

  /* Time */
  time: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
  },
});
