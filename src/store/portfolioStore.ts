import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ── Type Definitions ────────────────────────────────────────────────────────────

export interface Token {
  id: string;
  name: string;
  symbol: string;
  emoji: string;
  iconColor: string;
  amount: number;
  pricePerUnit: number;
  dailyChangePct: number;
  riskLevel: "low" | "medium" | "high";
  scamExposure: "low" | "medium" | "high" | "very-high";
  isScamToken: boolean;
  isSuspicious: boolean;
}

export interface Investment {
  id: string;
  name: string;
  type: "staking" | "liquidity-pool" | "token" | "nft" | "yield-farm";
  amountInvested: number;
  dailyReturnPct: number;
  riskLevel: "low" | "medium" | "high";
  scamExposure: "low" | "medium" | "high" | "very-high";
  isActive: boolean;
  daysActive: number;
  rugPullDay?: number;
}

export interface Transaction {
  id: string;
  type:
    | "received"
    | "sent"
    | "swap"
    | "staking-reward"
    | "airdrop"
    | "investment-return"
    | "rekt-loss"
    | "dust-attack";
  label: string;
  sublabel: string;
  amount: number;
  timestamp: string;
  isSuspicious: boolean;
  linkedScenarioId?: string;
}

export interface PortfolioState {
  // Core
  holdings: Token[];
  totalValue: number;
  dailyChange: number;
  dailyChangePct: number;

  // Investments
  activeInvestments: Investment[];

  // History
  transactions: Transaction[];
  portfolioHistory: number[];

  // All-time stats
  allTimeHigh: number;
  totalEarned: number;
  totalLost: number;
}

interface PortfolioActions {
  // Portfolio management
  initializePortfolio: (playerClass: string) => void;
  recalculateTotals: () => void;
  addHolding: (token: Token) => void;
  removeHolding: (tokenId: string) => void;
  updateTokenPrice: (
    tokenId: string,
    newPrice: number,
    changePct: number,
  ) => void;

  // Transactions
  addTransaction: (tx: Omit<Transaction, "id" | "timestamp">) => void;
  getRecentTransactions: (count: number) => Transaction[];
  getSuspiciousTransactions: () => Transaction[];

  // Investments
  createInvestment: (
    investment: Omit<Investment, "id" | "daysActive">,
  ) => void;
  processInvestmentReturns: () => void;
  checkRugPulls: () => Investment[];
  removeInvestment: (investmentId: string) => void;

  // Economy
  addFunds: (amount: number, source: string) => void;
  drainFunds: (amount: number, reason: string) => void;
  getPortfolioGrowthRate: () => number;

  // Daily simulation
  simulateMarketDay: () => void;

  // Scam injection
  injectScamToken: (token: Token) => void;
  injectScamTransaction: (tx: Omit<Transaction, "id" | "timestamp">) => void;

  // Snapshots
  takeSnapshot: () => void;
  getChartData: (days: number) => number[];

  // Reset
  resetPortfolio: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

function nowISO(): string {
  return new Date().toISOString();
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeTotalValue(holdings: Token[]): number {
  return round2(
    holdings.reduce((sum, t) => sum + t.amount * t.pricePerUnit, 0),
  );
}

// ── Starting Holdings ───────────────────────────────────────────────────────────

function makeBaseHoldings(): Token[] {
  return [
    {
      id: "eth",
      name: "Ethereum",
      symbol: "ETH",
      emoji: "Ξ",
      iconColor: "#627eea",
      amount: 2.5,
      pricePerUnit: 2875,
      dailyChangePct: 3.1,
      riskLevel: "low",
      scamExposure: "low",
      isScamToken: false,
      isSuspicious: false,
    },
    {
      id: "usdc",
      name: "USDC",
      symbol: "USDC",
      emoji: "$",
      iconColor: "#2775ca",
      amount: 1500,
      pricePerUnit: 1.0,
      dailyChangePct: 0,
      riskLevel: "low",
      scamExposure: "low",
      isScamToken: false,
      isSuspicious: false,
    },
    {
      id: "rekt",
      name: "REKT Token",
      symbol: "REKT",
      emoji: "\uD83D\uDC80",
      iconColor: "#ff3366",
      amount: 1000,
      pricePerUnit: 0.5,
      dailyChangePct: 12.5,
      riskLevel: "medium",
      scamExposure: "medium",
      isScamToken: false,
      isSuspicious: false,
    },
  ];
}

// ── Class Modifiers ─────────────────────────────────────────────────────────────

function applyClassModifiers(holdings: Token[], playerClass: string): Token[] {
  switch (playerClass) {
    case "ape":
      // +20% starting value — boost all amounts by 20%
      return holdings.map((t) => ({ ...t, amount: round2(t.amount * 1.2) }));

    case "analyst":
      // Same value, +1 extra diversified holding
      return [
        ...holdings,
        {
          id: "link",
          name: "Chainlink",
          symbol: "LINK",
          emoji: "\u26D3",
          iconColor: "#375bd2",
          amount: 50,
          pricePerUnit: 15,
          dailyChangePct: 1.8,
          riskLevel: "low",
          scamExposure: "low",
          isScamToken: false,
          isSuspicious: false,
        },
      ];

    case "shadow": {
      // All in stablecoins — convert everything to USDC
      const total = computeTotalValue(holdings);
      return [
        {
          id: "usdc",
          name: "USDC",
          symbol: "USDC",
          emoji: "$",
          iconColor: "#2775ca",
          amount: round2(total),
          pricePerUnit: 1.0,
          dailyChangePct: 0,
          riskLevel: "low",
          scamExposure: "low",
          isScamToken: false,
          isSuspicious: false,
        },
      ];
    }

    case "degen": {
      // Random allocation + 1 already-suspicious token
      const shuffled = holdings.map((t) => ({
        ...t,
        amount: round2(t.amount * randomBetween(0.5, 1.5)),
      }));
      return [
        ...shuffled,
        {
          id: "safemoon-v3",
          name: "SafeMoon V3",
          symbol: "SFM",
          emoji: "\uD83D\uDE80",
          iconColor: "#00d4aa",
          amount: 25000,
          pricePerUnit: 0.002,
          dailyChangePct: 45.0,
          riskLevel: "high",
          scamExposure: "very-high",
          isScamToken: false,
          isSuspicious: true,
        },
      ];
    }

    default:
      return holdings;
  }
}

// ── Initial State ───────────────────────────────────────────────────────────────

const INITIAL_STATE: PortfolioState = {
  holdings: [],
  totalValue: 0,
  dailyChange: 0,
  dailyChangePct: 0,
  activeInvestments: [],
  transactions: [],
  portfolioHistory: [],
  allTimeHigh: 0,
  totalEarned: 0,
  totalLost: 0,
};

// ── Store ───────────────────────────────────────────────────────────────────────

export const usePortfolioStore = create<PortfolioState & PortfolioActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Portfolio Management ─────────────────────────────────────────────

      initializePortfolio: (playerClass) => {
        const base = makeBaseHoldings();
        const holdings = applyClassModifiers(base, playerClass);
        const totalValue = computeTotalValue(holdings);

        set({
          holdings,
          totalValue,
          dailyChange: 0,
          dailyChangePct: 0,
          activeInvestments: [],
          transactions: [],
          portfolioHistory: [totalValue],
          allTimeHigh: totalValue,
          totalEarned: 0,
          totalLost: 0,
        });
      },

      recalculateTotals: () => {
        set((s) => {
          const newTotal = computeTotalValue(s.holdings);
          const lastSnapshot =
            s.portfolioHistory[s.portfolioHistory.length - 1] ?? newTotal;
          const change = round2(newTotal - lastSnapshot);
          const changePct =
            lastSnapshot > 0 ? round2((change / lastSnapshot) * 100) : 0;

          return {
            totalValue: newTotal,
            dailyChange: change,
            dailyChangePct: changePct,
            allTimeHigh: Math.max(s.allTimeHigh, newTotal),
          };
        });
      },

      addHolding: (token) => {
        set((s) => {
          const existing = s.holdings.find((h) => h.id === token.id);
          if (existing) {
            return {
              holdings: s.holdings.map((h) =>
                h.id === token.id
                  ? { ...h, amount: round2(h.amount + token.amount) }
                  : h,
              ),
            };
          }
          return { holdings: [...s.holdings, token] };
        });
        get().recalculateTotals();
      },

      removeHolding: (tokenId) => {
        set((s) => ({
          holdings: s.holdings.filter((h) => h.id !== tokenId),
        }));
        get().recalculateTotals();
      },

      updateTokenPrice: (tokenId, newPrice, changePct) => {
        set((s) => ({
          holdings: s.holdings.map((h) =>
            h.id === tokenId
              ? { ...h, pricePerUnit: newPrice, dailyChangePct: changePct }
              : h,
          ),
        }));
        get().recalculateTotals();
      },

      // ── Transactions ────────────────────────────────────────────────────

      addTransaction: (tx) => {
        const newTx: Transaction = {
          ...tx,
          id: generateId(),
          timestamp: nowISO(),
        };
        set((s) => ({ transactions: [newTx, ...s.transactions] }));
      },

      getRecentTransactions: (count) => {
        return get().transactions.slice(0, count);
      },

      getSuspiciousTransactions: () => {
        return get().transactions.filter((tx) => tx.isSuspicious);
      },

      // ── Investments ─────────────────────────────────────────────────────

      createInvestment: (investment) => {
        const newInv: Investment = {
          ...investment,
          id: generateId(),
          daysActive: 0,
        };
        set((s) => ({
          activeInvestments: [...s.activeInvestments, newInv],
        }));
      },

      processInvestmentReturns: () => {
        const { activeInvestments } = get();
        let totalReturn = 0;

        const updated = activeInvestments.map((inv) => {
          if (!inv.isActive) return inv;

          const dailyReturn = round2(
            inv.amountInvested * (inv.dailyReturnPct / 100),
          );
          totalReturn += dailyReturn;

          return { ...inv, daysActive: inv.daysActive + 1 };
        });

        set({ activeInvestments: updated });

        if (totalReturn > 0) {
          get().addFunds(totalReturn, "investment-returns");
          get().addTransaction({
            type: "investment-return",
            label: "Investment Returns",
            sublabel: `Daily yield from ${updated.filter((i) => i.isActive).length} active investments`,
            amount: totalReturn,
            isSuspicious: false,
          });
        }
      },

      checkRugPulls: () => {
        const { activeInvestments } = get();
        const rugPulled: Investment[] = [];

        const updated = activeInvestments.map((inv) => {
          if (
            inv.rugPullDay != null &&
            inv.daysActive >= inv.rugPullDay &&
            inv.isActive
          ) {
            rugPulled.push(inv);
            get().drainFunds(inv.amountInvested, `Rug pull: ${inv.name}`);
            get().addTransaction({
              type: "rekt-loss",
              label: `RUG PULL: ${inv.name}`,
              sublabel: "Investment drained \u2014 liquidity removed",
              amount: -inv.amountInvested,
              isSuspicious: true,
            });
            return { ...inv, isActive: false };
          }
          return inv;
        });

        set({ activeInvestments: updated });
        return rugPulled;
      },

      removeInvestment: (investmentId) => {
        set((s) => ({
          activeInvestments: s.activeInvestments.filter(
            (i) => i.id !== investmentId,
          ),
        }));
      },

      // ── Economy ─────────────────────────────────────────────────────────

      addFunds: (amount, _source) => {
        set((s) => {
          if (s.holdings.length === 0) return s;

          // Add to USDC if it exists, otherwise first holding
          const usdcIdx = s.holdings.findIndex((h) => h.symbol === "USDC");
          const targetIdx = usdcIdx >= 0 ? usdcIdx : 0;

          const holdings = s.holdings.map((h, i) => {
            if (i !== targetIdx) return h;
            // For USDC (price=1) add amount directly; otherwise convert to token units
            const units =
              h.pricePerUnit > 0 ? amount / h.pricePerUnit : amount;
            return { ...h, amount: round2(h.amount + units) };
          });

          const newTotal = computeTotalValue(holdings);
          return {
            holdings,
            totalValue: newTotal,
            totalEarned: round2(s.totalEarned + amount),
            allTimeHigh: Math.max(s.allTimeHigh, newTotal),
          };
        });
      },

      drainFunds: (amount, _reason) => {
        set((s) => {
          let remaining = amount;

          // Sort indices by holding value descending — drain from largest first
          const indices = s.holdings
            .map((h, i) => ({ value: h.amount * h.pricePerUnit, idx: i }))
            .sort((a, b) => b.value - a.value);

          const holdings = [...s.holdings];

          for (const { idx } of indices) {
            if (remaining <= 0) break;

            const h = holdings[idx];
            const holdingValue = h.amount * h.pricePerUnit;
            const drain = Math.min(remaining, holdingValue);
            const unitsToRemove =
              h.pricePerUnit > 0 ? drain / h.pricePerUnit : h.amount;

            holdings[idx] = {
              ...h,
              amount: round2(Math.max(0, h.amount - unitsToRemove)),
            };
            remaining = round2(remaining - drain);
          }

          // Remove empty holdings
          const filtered = holdings.filter((h) => h.amount > 0);
          const newTotal = computeTotalValue(filtered);

          return {
            holdings: filtered,
            totalValue: newTotal,
            totalLost: round2(s.totalLost + (amount - remaining)),
          };
        });
      },

      getPortfolioGrowthRate: () => {
        const { portfolioHistory } = get();
        if (portfolioHistory.length < 2) return 0;
        const recent = portfolioHistory[portfolioHistory.length - 1];
        const previous = portfolioHistory[portfolioHistory.length - 2];
        if (previous === 0) return 0;
        return round2(((recent - previous) / previous) * 100);
      },

      // ── Daily Simulation ────────────────────────────────────────────────

      simulateMarketDay: () => {
        set((s) => {
          const holdings = s.holdings.map((token) => {
            let minSwing: number;
            let maxSwing: number;

            if (token.symbol === "USDC" || token.symbol === "USDT") {
              // Stablecoin: ±0.1%
              minSwing = -0.1;
              maxSwing = 0.1;
            } else if (token.isScamToken) {
              // Scam tokens always trend up to bait players
              minSwing = 5;
              maxSwing = 25;
            } else if (token.riskLevel === "high" || token.isSuspicious) {
              // Risky tokens: ±20%
              minSwing = -20;
              maxSwing = 20;
            } else if (token.symbol === "ETH") {
              // ETH: ±5%
              minSwing = -5;
              maxSwing = 5;
            } else if (token.riskLevel === "medium") {
              // Medium risk: ±10%
              minSwing = -10;
              maxSwing = 10;
            } else {
              // Low risk default: ±3%
              minSwing = -3;
              maxSwing = 3;
            }

            const changePct = round2(randomBetween(minSwing, maxSwing));
            const newPrice = Math.max(
              0.0001,
              round2(token.pricePerUnit * (1 + changePct / 100)),
            );

            return { ...token, pricePerUnit: newPrice, dailyChangePct: changePct };
          });

          const newTotal = computeTotalValue(holdings);
          const prevTotal = s.totalValue;
          const change = round2(newTotal - prevTotal);
          const changePct =
            prevTotal > 0 ? round2((change / prevTotal) * 100) : 0;

          return {
            holdings,
            totalValue: newTotal,
            dailyChange: change,
            dailyChangePct: changePct,
            allTimeHigh: Math.max(s.allTimeHigh, newTotal),
          };
        });
      },

      // ── Scam Injection ──────────────────────────────────────────────────

      injectScamToken: (token) => {
        set((s) => ({ holdings: [...s.holdings, token] }));
        get().addTransaction({
          type: "dust-attack",
          label: `Received ${token.symbol}`,
          sublabel: "Unknown sender \u2014 do not interact",
          amount: round2(token.amount * token.pricePerUnit),
          isSuspicious: true,
        });
        get().recalculateTotals();
      },

      injectScamTransaction: (tx) => {
        get().addTransaction({ ...tx, isSuspicious: true });
      },

      // ── Snapshots ───────────────────────────────────────────────────────

      takeSnapshot: () => {
        set((s) => ({
          portfolioHistory: [...s.portfolioHistory, s.totalValue],
        }));
      },

      getChartData: (days) => {
        const { portfolioHistory } = get();
        return portfolioHistory.slice(-days);
      },

      // ── Reset ───────────────────────────────────────────────────────────

      resetPortfolio: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: "rekt-portfolio-storage",
      storage: createJSONStorage(() =>
        Platform.OS === "web" ? localStorage : AsyncStorage,
      ),
    },
  ),
);
