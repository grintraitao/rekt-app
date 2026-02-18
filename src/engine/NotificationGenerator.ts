/**
 * NotificationGenerator — template banks for generating legit and scam
 * notifications that look nearly identical to each other.
 */

import type { Token } from "../store/portfolioStore";
import type { ScamCategory } from "../store/scenarioStore";

// ── Helpers ──────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Types ────────────────────────────────────────────────────────────────────────

export interface NotificationTemplate {
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

// ── Legit Templates ──────────────────────────────────────────────────────────────

interface LegitTemplateFactory {
  (holdings: Token[]): NotificationTemplate;
}

const LEGIT_FACTORIES: LegitTemplateFactory[] = [
  // Staking reward
  (holdings) => {
    const eth = holdings.find((t) => t.symbol === "ETH");
    const amount = eth ? round2(eth.pricePerUnit * 0.008) : randInt(10, 50);
    return {
      title: "Staking reward claimed",
      subtitle: `+$${amount.toFixed(2)} ETH`,
      icon: "\u2705",
      iconColor: "#00ff88",
      iconBg: "rgba(0,255,136,0.15)",
    };
  },

  // Swap confirmed
  (holdings) => {
    const usdcAmt = randInt(50, 500);
    const eth = holdings.find((t) => t.symbol === "ETH");
    const ethPrice = eth?.pricePerUnit ?? 2800;
    const ethAmt = round2(usdcAmt / ethPrice);
    return {
      title: "Swap confirmed",
      subtitle: `${usdcAmt} USDC \u2192 ${ethAmt} ETH`,
      icon: "\uD83D\uDD04",
      iconColor: "#8b5cf6",
      iconBg: "rgba(139,92,246,0.15)",
    };
  },

  // Price alert (up)
  (holdings) => {
    const tokens = holdings.filter(
      (t) => t.symbol !== "USDC" && t.symbol !== "USDT",
    );
    const token = tokens.length > 0 ? pick(tokens) : null;
    const name = token?.symbol ?? "ETH";
    const pct = randInt(2, 12);
    return {
      title: `Price alert: ${name}`,
      subtitle: `Up ${pct}% today`,
      icon: "\uD83D\uDCCA",
      iconColor: "#00d4ff",
      iconBg: "rgba(0,212,255,0.15)",
    };
  },

  // Price alert (down)
  (holdings) => {
    const tokens = holdings.filter(
      (t) => t.symbol !== "USDC" && t.symbol !== "USDT",
    );
    const token = tokens.length > 0 ? pick(tokens) : null;
    const name = token?.symbol ?? "ETH";
    const pct = randInt(1, 8);
    return {
      title: `Price alert: ${name}`,
      subtitle: `Down ${pct}% today`,
      icon: "\uD83D\uDCCA",
      iconColor: "#ff6b6b",
      iconBg: "rgba(255,107,107,0.15)",
    };
  },

  // Weekly report (up)
  () => {
    const pct = randInt(2, 18);
    return {
      title: "Weekly portfolio report",
      subtitle: `Up ${pct}% this week`,
      icon: "\uD83D\uDCC8",
      iconColor: "#00ff88",
      iconBg: "rgba(0,255,136,0.15)",
    };
  },

  // Weekly report (down)
  () => {
    const pct = randInt(1, 10);
    return {
      title: "Weekly portfolio report",
      subtitle: `Down ${pct}% this week`,
      icon: "\uD83D\uDCC9",
      iconColor: "#ff6b6b",
      iconBg: "rgba(255,107,107,0.15)",
    };
  },

  // Security tip
  () => ({
    title: "Security tip",
    subtitle: pick([
      "Remember to check approvals regularly",
      "Never share your seed phrase with anyone",
      "Bookmark your DEX to avoid phishing sites",
      "Enable 2FA on all exchange accounts",
      "Review your token allowances this week",
    ]),
    icon: "\uD83D\uDEE1\uFE0F",
    iconColor: "#00d4ff",
    iconBg: "rgba(0,212,255,0.15)",
  }),

  // New feature
  () => ({
    title: "New feature available",
    subtitle: pick([
      "Scanner tool now live!",
      "Portfolio analytics updated",
      "New swap routes available",
      "Gas tracker improvements",
    ]),
    icon: "\u2728",
    iconColor: "#ffd700",
    iconBg: "rgba(255,215,0,0.15)",
  }),

  // Transfer received
  () => {
    const amount = round2(randInt(10, 200) + Math.random());
    return {
      title: "Transfer received",
      subtitle: `+$${amount.toFixed(2)} USDC from 0x...${randInt(1000, 9999)}`,
      icon: "\u2B07\uFE0F",
      iconColor: "#00ff88",
      iconBg: "rgba(0,255,136,0.15)",
    };
  },

  // Gas fee refund
  () => ({
    title: "Gas fee refund",
    subtitle: `+$${round2(randInt(1, 8) + Math.random()).toFixed(2)} rebate applied`,
    icon: "\u26FD",
    iconColor: "#8b5cf6",
    iconBg: "rgba(139,92,246,0.15)",
  }),

  // Governance vote
  () => ({
    title: "Governance vote open",
    subtitle: pick([
      "UNI Proposal #47 — vote by Friday",
      "AAVE fee change — cast your vote",
      "New pool proposal — community vote",
    ]),
    icon: "\uD83D\uDDF3\uFE0F",
    iconColor: "#ff8c00",
    iconBg: "rgba(255,140,0,0.15)",
  }),

  // Network update
  () => ({
    title: "Network update",
    subtitle: pick([
      "Ethereum gas fees at 12 gwei",
      "Base chain throughput improved",
      "Arbitrum sequencer status: normal",
    ]),
    icon: "\uD83C\uDF10",
    iconColor: "#00d4ff",
    iconBg: "rgba(0,212,255,0.15)",
  }),
];

// ── Scam Templates ───────────────────────────────────────────────────────────────

interface ScamTemplateFactory {
  (): NotificationTemplate;
}

const SCAM_FACTORIES: Record<ScamCategory, ScamTemplateFactory[]> = {
  phishing: [
    () => ({
      title: "Action required: Verify wallet",
      subtitle: "Suspicious activity detected",
      icon: "\u26A0\uFE0F",
      iconColor: "#ff8c00",
      iconBg: "rgba(255,140,0,0.15)",
    }),
    () => ({
      title: "Urgent: Wallet security update",
      subtitle: "Complete verification now",
      icon: "\uD83D\uDD10",
      iconColor: "#ff6b6b",
      iconBg: "rgba(255,107,107,0.15)",
    }),
    () => ({
      title: "Login attempt detected",
      subtitle: "Verify your identity to secure your account",
      icon: "\uD83D\uDD12",
      iconColor: "#ff8c00",
      iconBg: "rgba(255,140,0,0.15)",
    }),
    () => ({
      title: "Wallet migration required",
      subtitle: "Update to v2 before deadline",
      icon: "\u26A0\uFE0F",
      iconColor: "#ff6b6b",
      iconBg: "rgba(255,107,107,0.15)",
    }),
  ],

  honeypot: [
    () => {
      const token = pick(["UNI", "ARB", "OP", "BLUR", "EIGEN"]);
      const amount = randInt(100, 5000);
      return {
        title: `Claim ${amount} ${token} airdrop`,
        subtitle: "Limited time offer!",
        icon: "\uD83C\uDF81",
        iconColor: "#ffd700",
        iconBg: "rgba(255,215,0,0.15)",
      };
    },
    () => ({
      title: "Unknown token received",
      subtitle: "Tap to claim",
      icon: "\uD83D\uDD14",
      iconColor: "#ffd700",
      iconBg: "rgba(255,215,0,0.15)",
    }),
    () => {
      const amount = randInt(500, 10000);
      return {
        title: `${amount} PEPE2.0 airdrop available`,
        subtitle: "Claim before expiry",
        icon: "\uD83C\uDF81",
        iconColor: "#00ff88",
        iconBg: "rgba(0,255,136,0.15)",
      };
    },
    () => ({
      title: "New yield farm: 500% APY",
      subtitle: "Deposit now to earn rewards",
      icon: "\uD83C\uDF3E",
      iconColor: "#00ff88",
      iconBg: "rgba(0,255,136,0.15)",
    }),
  ],

  "social-engineering": [
    () => {
      const name = pick([
        "MetaMask Support",
        "Uniswap Team",
        "OpenSea Help",
        "Coinbase Pro",
        "Trust Wallet",
      ]);
      const preview = pick([
        "wallet security",
        "account verification needed",
        "exclusive opportunity",
        "urgent matter",
      ]);
      return {
        title: `New DM from ${name}`,
        subtitle: `Urgent: ${preview}`,
        icon: "\uD83D\uDCAC",
        iconColor: "#8b5cf6",
        iconBg: "rgba(139,92,246,0.15)",
      };
    },
    () => ({
      title: "Collaboration request",
      subtitle: "Verified project wants to partner with you",
      icon: "\uD83E\uDD1D",
      iconColor: "#00d4ff",
      iconBg: "rgba(0,212,255,0.15)",
    }),
    () => ({
      title: "KYC verification required",
      subtitle: "Complete within 24h to keep your account",
      icon: "\uD83C\uDD94",
      iconColor: "#ff6b6b",
      iconBg: "rgba(255,107,107,0.15)",
    }),
  ],

  "smart-contract": [
    () => ({
      title: "Approve token access",
      subtitle: "Contract requests unlimited allowance",
      icon: "\uD83D\uDCDD",
      iconColor: "#ff8c00",
      iconBg: "rgba(255,140,0,0.15)",
    }),
    () => ({
      title: "Smart contract upgrade",
      subtitle: "Re-approve to continue using protocol",
      icon: "\u2699\uFE0F",
      iconColor: "#8b5cf6",
      iconBg: "rgba(139,92,246,0.15)",
    }),
    () => ({
      title: "New dApp connection",
      subtitle: "Unknown dApp requests wallet access",
      icon: "\uD83D\uDD17",
      iconColor: "#ff8c00",
      iconBg: "rgba(255,140,0,0.15)",
    }),
  ],

  "rug-pull": [
    () => {
      const token = pick(["MoonDAO", "SafeYield", "ElonChain", "RocketFi"]);
      return {
        title: `${token} presale live!`,
        subtitle: "Early investors get 10x bonus",
        icon: "\uD83D\uDE80",
        iconColor: "#00ff88",
        iconBg: "rgba(0,255,136,0.15)",
      };
    },
    () => ({
      title: "Exclusive token launch",
      subtitle: "Guaranteed 100x — join whitelist now",
      icon: "\uD83D\uDC8E",
      iconColor: "#ffd700",
      iconBg: "rgba(255,215,0,0.15)",
    }),
    () => ({
      title: "LP rewards boosted!",
      subtitle: "Add liquidity now for 1000% APY",
      icon: "\uD83C\uDF3E",
      iconColor: "#00ff88",
      iconBg: "rgba(0,255,136,0.15)",
    }),
  ],
};

// ── Public API ────────────────────────────────────────────────────────────────────

export function generateLegitNotification(
  holdings: Token[],
): NotificationTemplate {
  const factory = pick(LEGIT_FACTORIES);
  return factory(holdings);
}

export function generateScamNotification(
  category: ScamCategory,
): NotificationTemplate {
  const factories = SCAM_FACTORIES[category];
  const factory = pick(factories);
  return factory();
}

export function getScamCategories(): ScamCategory[] {
  return Object.keys(SCAM_FACTORIES) as ScamCategory[];
}
