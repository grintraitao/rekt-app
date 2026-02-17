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

export type ActivityFilter = "All" | "Received" | "Sent" | "Swaps" | "Alerts";

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
  scamType?: "phishing" | "fake-airdrop" | "impersonation";
  filter: ActivityFilter;
  detail?: string;
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
  takeDamage: (amount: number) => void;
  subtractValue: (amount: number) => void;
  incrementStreak: () => void;
};

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
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
      id: "recv-eth",
      icon: "📥",
      iconBg: "#00ff8833",
      label: "Received 3.2 ETH",
      sub: "From 0x7f2...8a4",
      value: "$9,200",
      valueColor: "#00ff88",
      filter: "Received",
      detail: "Transaction hash: 0x8b3f...c91a · Block #18,294,021 · Gas: 0.002 ETH",
    },
    {
      id: "swap-usdc-eth",
      icon: "🔄",
      iconBg: "rgba(139,92,246,0.15)",
      label: "Swapped 500 USDC → 0.15 ETH",
      sub: "Uniswap",
      value: "$500",
      filter: "Swaps",
      detail: "Rate: 1 ETH = 3,333 USDC · Slippage: 0.3% · Pool fee: 0.05%",
    },
    {
      id: "scam-claim",
      icon: "⚠️",
      iconBg: "rgba(255,140,0,0.15)",
      label: "Unknown token received: CLAIM NOW",
      labelColor: "#ff8c00",
      sub: "From unknown",
      subColor: "#ff8c00",
      value: "🔔",
      isSuspicious: true,
      scamType: "phishing",
      filter: "Alerts",
    },
    {
      id: "staking-reward",
      icon: "✓",
      iconBg: "#00ff8833",
      label: "Staking reward",
      sub: "Lido · 3h ago",
      value: "+$23.40",
      valueColor: "#00ff88",
      filter: "Received",
      detail: "Validator: Lido DAO · APR: 4.2% · Accumulated over 7 days",
    },
    {
      id: "sent-eth",
      icon: "📤",
      iconBg: "#ff336633",
      label: "Sent 0.1 ETH",
      sub: "To 0x3a1...f2c",
      value: "-$287",
      valueColor: "#ff3366",
      filter: "Sent",
      detail: "Transaction hash: 0x2d7e...f30b · Block #18,293,844 · Gas: 0.001 ETH",
    },
    {
      id: "scam-airdrop",
      icon: "🎁",
      iconBg: "rgba(255,215,0,0.15)",
      label: "Airdrop: 10,000 FREE tokens",
      labelColor: "#ffd700",
      sub: "Tap to claim",
      subColor: "#ffd700",
      value: "⚠️",
      isSuspicious: true,
      scamType: "fake-airdrop",
      filter: "Alerts",
    },
    {
      id: "swap-eth-usdc",
      icon: "🔄",
      iconBg: "rgba(139,92,246,0.15)",
      label: "Swapped 0.5 ETH → 1,437 USDC",
      sub: "SushiSwap",
      value: "$1,437",
      filter: "Swaps",
      detail: "Rate: 1 ETH = 2,874 USDC · Slippage: 0.5% · Pool fee: 0.3%",
    },
    {
      id: "recv-usdc",
      icon: "📥",
      iconBg: "#00ff8833",
      label: "Received 500 USDC",
      sub: "From 0x9c4...b7e",
      value: "$500",
      valueColor: "#00ff88",
      filter: "Received",
      detail: "Transaction hash: 0x5a1c...e82d · Block #18,293,501 · Confirmed",
    },
    {
      id: "scam-dust",
      icon: "💀",
      iconBg: "rgba(255,140,0,0.15)",
      label: "Dust attack: 0.00001 ETH",
      labelColor: "#ff8c00",
      sub: "Unknown sender",
      subColor: "#ff8c00",
      value: "🔔",
      isSuspicious: true,
      scamType: "impersonation",
      filter: "Alerts",
    },
    {
      id: "sent-usdc",
      icon: "📤",
      iconBg: "#ff336633",
      label: "Sent 200 USDC",
      sub: "To 0x5b8...c1d",
      value: "-$200",
      valueColor: "#ff3366",
      filter: "Sent",
      detail: "Transaction hash: 0x7f3b...a92c · Block #18,292,999 · Gas: 0.0008 ETH",
    },
    {
      id: "swap-moon",
      icon: "🔄",
      iconBg: "rgba(139,92,246,0.15)",
      label: "Swapped 200 USDC → 25,000 MOON",
      sub: "PancakeSwap",
      value: "$200",
      filter: "Swaps",
      detail: "Rate: 1 MOON = 0.008 USDC · High volatility token · DEX trade",
    },
    {
      id: "recv-moon",
      icon: "📥",
      iconBg: "#00ff8833",
      label: "Received 50,000 MOON",
      sub: "From 0x1d2...e5f",
      value: "$420",
      valueColor: "#00ff88",
      filter: "Received",
      detail: "Transaction hash: 0xab2f...d71e · Block #18,292,501 · Unverified token",
    },
    {
      id: "staking-lido",
      icon: "🏦",
      iconBg: "rgba(0,212,255,0.15)",
      label: "Staked 1.0 ETH",
      sub: "Lido Finance",
      value: "$2,875",
      filter: "Sent",
      detail: "Staking provider: Lido · Expected APR: 4.2% · Lock period: None",
    },
    {
      id: "recv-nft",
      icon: "📥",
      iconBg: "#00ff8833",
      label: "Received NFT: CryptoPunk #4281",
      sub: "From 0x8e3...a2b",
      value: "$12,400",
      valueColor: "#00ff88",
      filter: "Received",
      detail: "Collection: CryptoPunks · Token ID: 4281 · ERC-721",
    },
  ],
  totalValue: 47832.15,
  dailyChange: 1204.3,
  dailyChangePct: 2.58,
  hp: 80,
  maxHp: 100,
  streak: 13,

  takeDamage: (amount) => {
    const { hp } = get();
    set({ hp: Math.max(0, hp - amount) });
  },

  subtractValue: (amount) => {
    const { totalValue } = get();
    set({ totalValue: Math.max(0, totalValue - amount) });
  },

  incrementStreak: () => {
    const { streak } = get();
    set({ streak: streak + 1 });
  },
}));
