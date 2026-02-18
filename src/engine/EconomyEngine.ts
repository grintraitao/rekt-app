/**
 * EconomyEngine — handles all money simulation: daily yields, investment
 * returns, market price changes, portfolio growth, and rug pulls.
 */

import type { Token, Investment, Transaction } from "../store/portfolioStore";

// ── Helpers ──────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function computeTotalValue(holdings: Token[]): number {
  return round2(
    holdings.reduce((sum, t) => sum + t.amount * t.pricePerUnit, 0),
  );
}

// ── Constants ────────────────────────────────────────────────────────────────────

export const YIELD_RATES: Record<string, { min: number; max: number }> = {
  staking: { min: 0.3, max: 0.7 },
  "liquidity-pool": { min: 1.0, max: 3.0 },
  token: { min: -10, max: 20 },
  nft: { min: -5, max: 15 },
  "yield-farm": { min: 3.0, max: 8.0 },
};

export const PRICE_VOLATILITY: Record<string, { min: number; max: number }> = {
  ETH: { min: -5, max: 5 },
  BTC: { min: -4, max: 4 },
  USDC: { min: -0.1, max: 0.1 },
  USDT: { min: -0.1, max: 0.1 },
  "risky-token": { min: -20, max: 30 },
  "scam-token": { min: 5, max: 50 },
};

/** Scam token names for dust attacks */
const DUST_ATTACK_TOKENS = [
  { name: "FREE-CLAIM", symbol: "CLAIM", emoji: "\uD83C\uDF81", iconColor: "#ff3366" },
  { name: "BONUS-ETH", symbol: "BETH", emoji: "\uD83D\uDCB0", iconColor: "#ffd700" },
  { name: "AIRDROP-V2", symbol: "AIRV2", emoji: "\uD83C\uDF81", iconColor: "#00ff88" },
  { name: "PEPE-GOLD", symbol: "PGOLD", emoji: "\uD83D\uDC38", iconColor: "#00d4ff" },
  { name: "SAFE-YIELD", symbol: "SYLD", emoji: "\uD83D\uDE80", iconColor: "#8b5cf6" },
];

/** Class yield modifiers */
const CLASS_YIELD_MODIFIERS: Record<string, { yieldMult: number; xpMult: number; random?: boolean }> = {
  ape: { yieldMult: 1.10, xpMult: 1.0 },
  analyst: { yieldMult: 1.05, xpMult: 1.10 },
  shadow: { yieldMult: 1.0, xpMult: 1.0 },
  degen: { yieldMult: 1.0, xpMult: 1.0, random: true },
};

// ── Engine ───────────────────────────────────────────────────────────────────────

export class EconomyEngine {
  /**
   * Simulate a full day of market activity.
   *
   * - Randomize price changes for each holding
   * - Calculate daily returns for each investment
   * - Check for rug pulls
   * - Generate transaction records
   * - Scam tokens always trend upward
   */
  static simulateDay(
    holdings: Token[],
    investments: Investment[],
    gameDay: number,
    _chapter: number,
  ): {
    updatedHoldings: Token[];
    investmentReturns: number;
    newTransactions: Transaction[];
    rugPullTriggered: Investment | null;
  } {
    const newTransactions: Transaction[] = [];
    let investmentReturns = 0;
    let rugPullTriggered: Investment | null = null;

    // ── Update token prices ──────────────────────────────────────────────
    const updatedHoldings = holdings.map((token) => {
      const volatility = this._getVolatility(token);
      const changePct = round2(randomBetween(volatility.min, volatility.max));
      const newPrice = Math.max(
        0.0001,
        round2(token.pricePerUnit * (1 + changePct / 100)),
      );

      return { ...token, pricePerUnit: newPrice, dailyChangePct: changePct };
    });

    // ── Process investments ───────────────────────────────────────────────
    for (const inv of investments) {
      if (!inv.isActive) continue;

      // Check for rug pull first
      if (inv.rugPullDay != null && inv.daysActive >= inv.rugPullDay) {
        rugPullTriggered = inv;
        const rugResult = this.processRugPull(inv);
        newTransactions.push(rugResult.transactionRecord);
        continue;
      }

      // Normal return
      const result = this.calculateInvestmentReturn(inv);
      investmentReturns += result.returnAmount;

      if (Math.abs(result.returnAmount) > 0.01) {
        newTransactions.push({
          id: `tx-inv-${generateId()}`,
          type: "investment-return",
          label: `${inv.name} yield`,
          sublabel: `${result.isPositive ? "+" : ""}${result.returnPct.toFixed(1)}% ($${Math.abs(result.returnAmount).toFixed(2)})`,
          amount: round2(result.returnAmount),
          timestamp: new Date().toISOString(),
          isSuspicious: inv.scamExposure === "very-high",
        });
      }
    }

    // ── Staking rewards for staked holdings ───────────────────────────────
    const stakedHoldings = updatedHoldings.filter(
      (t) => !t.isScamToken && !t.isSuspicious && t.symbol !== "USDC" && t.symbol !== "USDT",
    );
    if (stakedHoldings.length > 0) {
      const stakingReward = this.calculateStakingReward(
        computeTotalValue(stakedHoldings) * 0.3, // assume 30% is staked
        "staking",
        1,
      );
      if (stakingReward > 0.01) {
        investmentReturns += stakingReward;
        newTransactions.push({
          id: `tx-stake-${generateId()}`,
          type: "staking-reward",
          label: "Staking reward",
          sublabel: `+$${stakingReward.toFixed(2)} daily yield`,
          amount: round2(stakingReward),
          timestamp: new Date().toISOString(),
          isSuspicious: false,
        });
      }
    }

    return {
      updatedHoldings,
      investmentReturns: round2(investmentReturns),
      newTransactions,
      rugPullTriggered,
    };
  }

  /**
   * Calculate daily staking reward.
   *
   * Higher levels get slightly better rates:
   *   bonus = 1 + (playerLevel * 0.01), max 30% bonus at level 30.
   */
  static calculateStakingReward(
    stakedAmount: number,
    stakingType: string,
    playerLevel: number,
  ): number {
    const rates = YIELD_RATES[stakingType] ?? YIELD_RATES.staking;
    const basePct = randomBetween(rates.min, rates.max);
    const levelBonus = 1 + Math.min(0.3, playerLevel * 0.01);
    return round2((stakedAmount * basePct * levelBonus) / 100);
  }

  /**
   * Calculate investment return for a single investment.
   */
  static calculateInvestmentReturn(investment: Investment): {
    returnAmount: number;
    returnPct: number;
    isPositive: boolean;
  } {
    const rates = YIELD_RATES[investment.type] ?? { min: -5, max: 10 };
    const returnPct = round2(randomBetween(rates.min, rates.max));
    const returnAmount = round2(investment.amountInvested * (returnPct / 100));

    return {
      returnAmount,
      returnPct,
      isPositive: returnAmount >= 0,
    };
  }

  /**
   * Process a rug pull — drains 100% of the investment.
   */
  static processRugPull(investment: Investment): {
    totalLost: number;
    transactionRecord: Transaction;
    affectedTokenId?: string;
  } {
    const totalLost = investment.amountInvested;

    return {
      totalLost,
      transactionRecord: {
        id: `tx-rug-${generateId()}`,
        type: "rekt-loss",
        label: `LIQUIDITY REMOVED`,
        sublabel: `${investment.name} — $${totalLost.toLocaleString()} lost`,
        amount: -totalLost,
        timestamp: new Date().toISOString(),
        isSuspicious: true,
      },
    };
  }

  /**
   * Calculate daily reward package (login + streak + staking).
   *
   * Class modifiers:
   *   Ape: +10% yield bonus
   *   Analyst: +5% yield, +10% XP
   *   Shadow: standard
   *   Degen: ±25% yield (randomized)
   */
  static calculateDailyReward(
    holdings: Token[],
    streak: number,
    playerLevel: number,
    playerClass: string,
  ): {
    stakingYield: number;
    loginXP: number;
    streakBonusXP: number;
    bonusCoins: number;
    totalPortfolioAfter: number;
  } {
    const classMod = CLASS_YIELD_MODIFIERS[playerClass] ?? CLASS_YIELD_MODIFIERS.shadow;

    // Staking yield from non-stablecoin holdings
    const stakableValue = computeTotalValue(
      holdings.filter(
        (t) => !t.isScamToken && t.symbol !== "USDC" && t.symbol !== "USDT",
      ),
    );
    let stakingYield = this.calculateStakingReward(
      stakableValue * 0.3,
      "staking",
      playerLevel,
    );

    // Apply class yield modifier
    if (classMod.random) {
      // Degen: ±25% randomized
      const swing = randomBetween(-0.25, 0.25);
      stakingYield = round2(stakingYield * (1 + swing));
    } else {
      stakingYield = round2(stakingYield * classMod.yieldMult);
    }

    // XP
    const baseLoginXP = 50;
    const streakMult = Math.min(2.0, 1 + streak * 0.05);
    let loginXP = Math.round(baseLoginXP * streakMult * classMod.xpMult);

    const streakBonusXP = Math.min(streak * 10, 200);

    // Bonus coins for streak milestones
    let bonusCoins = 0;
    if (streak >= 30) bonusCoins = 100;
    else if (streak >= 14) bonusCoins = 50;
    else if (streak >= 7) bonusCoins = 25;

    // Projected portfolio
    const currentValue = computeTotalValue(holdings);
    const totalPortfolioAfter = round2(currentValue + stakingYield);

    return {
      stakingYield,
      loginXP,
      streakBonusXP,
      bonusCoins,
      totalPortfolioAfter,
    };
  }

  /**
   * Calculate portfolio growth needed to reach chapter target.
   */
  static getGrowthToTarget(
    currentValue: number,
    chapterTarget: number,
  ): {
    needed: number;
    percentage: number;
    daysEstimate: number;
  } {
    const needed = round2(Math.max(0, chapterTarget - currentValue));
    const percentage =
      currentValue > 0 ? round2((needed / currentValue) * 100) : 100;

    // Estimate days assuming ~2% daily growth
    const daysEstimate =
      needed <= 0
        ? 0
        : Math.ceil(Math.log(chapterTarget / Math.max(1, currentValue)) / Math.log(1.02));

    return { needed, percentage, daysEstimate };
  }

  /**
   * Generate fake price chart data for the portfolio detail screen.
   */
  static generateChartData(
    startPrice: number,
    days: number,
    volatility: "low" | "medium" | "high",
    trend: "up" | "down" | "sideways",
  ): number[] {
    const volatilityRange: Record<string, number> = {
      low: 2,
      medium: 5,
      high: 12,
    };

    const trendBias: Record<string, number> = {
      up: 0.5,
      down: -0.5,
      sideways: 0,
    };

    const range = volatilityRange[volatility];
    const bias = trendBias[trend];
    const data: number[] = [startPrice];
    let price = startPrice;

    for (let i = 1; i < days; i++) {
      const changePct = randomBetween(-range, range) + bias;
      price = Math.max(0.01, round2(price * (1 + changePct / 100)));
      data.push(price);
    }

    return data;
  }

  /**
   * Create a suspicious dust attack token to inject into the portfolio.
   */
  static createDustAttackToken(): Token {
    const template =
      DUST_ATTACK_TOKENS[Math.floor(Math.random() * DUST_ATTACK_TOKENS.length)];

    return {
      id: `dust-${template.symbol.toLowerCase()}-${generateId()}`,
      name: template.name,
      symbol: template.symbol,
      emoji: template.emoji,
      iconColor: template.iconColor,
      amount: randomBetween(1000, 100000),
      pricePerUnit: Math.max(0.01, round2(randomBetween(0.001, 0.01))),
      dailyChangePct: round2(randomBetween(10, 50)),
      riskLevel: "high",
      scamExposure: "very-high",
      isScamToken: true,
      isSuspicious: true,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────────

  /**
   * Get volatility range for a token based on its characteristics.
   */
  private static _getVolatility(token: Token): { min: number; max: number } {
    if (token.symbol === "USDC" || token.symbol === "USDT") {
      return PRICE_VOLATILITY.USDC;
    }
    if (token.isScamToken) {
      return PRICE_VOLATILITY["scam-token"];
    }
    if (token.isSuspicious || token.riskLevel === "high") {
      return PRICE_VOLATILITY["risky-token"];
    }
    if (token.symbol === "ETH") {
      return PRICE_VOLATILITY.ETH;
    }
    if (token.symbol === "BTC") {
      return PRICE_VOLATILITY.BTC;
    }
    // Default: moderate volatility
    return { min: -8, max: 8 };
  }
}
