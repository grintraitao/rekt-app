import { create } from "zustand";

export type ScamType =
  | "phishing"
  | "fake-airdrop"
  | "impersonation";

export type AppNotification = {
  id: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  scamType?: ScamType;
};

type NotificationState = {
  notifications: AppNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    // ── Scam notifications ──────────────────────────────────────────
    {
      id: "scam-1",
      icon: "⚠️",
      iconColor: "#ff8c00",
      iconBg: "rgba(255,140,0,0.15)",
      title: "Action required: Verify wallet",
      subtitle: "Suspicious activity detected",
      time: "1h ago",
      read: false,
      scamType: "phishing" as ScamType,
    },
    {
      id: "scam-2",
      icon: "🎁",
      iconColor: "#ffd700",
      iconBg: "rgba(255,215,0,0.15)",
      title: "Claim 500 UNI airdrop",
      subtitle: "Limited time offer!",
      time: "3h ago",
      read: false,
      scamType: "fake-airdrop" as ScamType,
    },
    {
      id: "scam-3",
      icon: "💬",
      iconColor: "#8b5cf6",
      iconBg: "rgba(139,92,246,0.15)",
      title: 'New DM from MetaMask Support',
      subtitle: "Urgent: wallet security",
      time: "5h ago",
      read: false,
      scamType: "impersonation" as ScamType,
    },
    // ── Legit notifications ─────────────────────────────────────────
    {
      id: "legit-1",
      icon: "✅",
      iconColor: "#00ff88",
      iconBg: "#00ff8833",
      title: "Staking reward claimed",
      subtitle: "+$23.40 ETH",
      time: "2h ago",
      read: false,
    },
    {
      id: "legit-2",
      icon: "📊",
      iconColor: "#00d4ff",
      iconBg: "rgba(0,212,255,0.15)",
      title: "Weekly portfolio report",
      subtitle: "Up 12% this week",
      time: "1d ago",
      read: true,
    },
    {
      id: "legit-3",
      icon: "🔄",
      iconColor: "#8b5cf6",
      iconBg: "rgba(139,92,246,0.15)",
      title: "Swap confirmed",
      subtitle: "100 USDC → 0.03 ETH",
      time: "2d ago",
      read: true,
    },
  ],

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
