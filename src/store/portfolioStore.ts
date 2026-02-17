import { create } from "zustand";

export type Transaction = {
  id: string;
  type: "Received" | "Sent" | "Swap" | "Staking";
  date: string;
  amount: string;
  value: string;
};

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
  chartData: number[];
  transactions: Transaction[];
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
      chartData: [2650, 2720, 2680, 2790, 2830, 2810, 2875],
      transactions: [
        { id: "e1", type: "Received", date: "Feb 15", amount: "+0.5 ETH", value: "$1,437" },
        { id: "e2", type: "Swap", date: "Feb 12", amount: "1,000 USDC → 0.35 ETH", value: "$1,000" },
        { id: "e3", type: "Staking", date: "Feb 10", amount: "+0.012 ETH", value: "$34" },
        { id: "e4", type: "Sent", date: "Feb 8", amount: "-0.2 ETH", value: "$560" },
      ],
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
      chartData: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
      transactions: [
        { id: "u1", type: "Received", date: "Feb 14", amount: "+500 USDC", value: "$500" },
        { id: "u2", type: "Swap", date: "Feb 11", amount: "0.35 ETH → 1,000 USDC", value: "$1,000" },
        { id: "u3", type: "Sent", date: "Feb 9", amount: "-200 USDC", value: "$200" },
      ],
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
      chartData: [0.008, 0.009, 0.011, 0.013, 0.012, 0.016, 0.0197],
      transactions: [
        { id: "m1", type: "Received", date: "Feb 13", amount: "+50,000 MOON", value: "$420" },
        { id: "m2", type: "Staking", date: "Feb 11", amount: "+1,200 MOON", value: "$18" },
        { id: "m3", type: "Swap", date: "Feb 10", amount: "200 USDC → 25,000 MOON", value: "$200" },
      ],
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
