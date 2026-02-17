import { create } from "zustand";

export type Holding = {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  amount: number;
  displayAmount: string;
  value: number;
  changePct: number;
};

export type RecentActivity = {
  id: string;
  icon: string;
  iconBg: string;
  label: string;
  labelColor?: string;
  sub: string;
  subColor?: string;
  value: string;
  valueColor?: string;
  isSuspicious?: boolean;
};

type PortfolioState = {
  holdings: Holding[];
  recentActivity: RecentActivity[];
  totalValue: number;
  dailyChange: number;
  dailyChangePct: number;
  hp: number;
  maxHp: number;
  streak: number;
  notificationCount: number;
};

export const usePortfolioStore = create<PortfolioState>(() => ({
  holdings: [
    {
      id: "eth",
      name: "Ethereum",
      symbol: "ETH",
      icon: "Ξ",
      iconColor: "#627eea",
      iconBg: "#627eea33",
      amount: 3.2,
      displayAmount: "3.2 ETH",
      value: 9200,
      changePct: 3.1,
    },
    {
      id: "usdc",
      name: "USDC",
      symbol: "USDC",
      icon: "$",
      iconColor: "#2775ca",
      iconBg: "#2775ca33",
      amount: 1647,
      displayAmount: "1,647 USDC",
      value: 1647,
      changePct: 0.0,
    },
    {
      id: "moonrise",
      name: "$MOONRISE",
      symbol: "MOON",
      icon: "🌙",
      iconColor: "#ffd700",
      iconBg: "rgba(255,215,0,0.15)",
      amount: 50000,
      displayAmount: "50,000 MOON",
      value: 985,
      changePct: 47,
    },
  ],
  recentActivity: [
    {
      id: "staking-reward",
      icon: "✓",
      iconBg: "#00ff8833",
      label: "Staking reward",
      sub: "2h ago",
      value: "+$23",
      valueColor: "#00ff88",
    },
    {
      id: "airdrop-scam",
      icon: "🎁",
      iconBg: "rgba(255,215,0,0.15)",
      label: "Airdrop: Claim 500 UNI →",
      labelColor: "#ffd700",
      sub: "Tap to claim",
      subColor: "#ffd700",
      value: "🔔",
      isSuspicious: true,
    },
  ],
  totalValue: 47832.15,
  dailyChange: 1204.3,
  dailyChangePct: 2.58,
  hp: 80,
  maxHp: 100,
  streak: 13,
  notificationCount: 3,
}));
