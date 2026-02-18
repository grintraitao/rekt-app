/**
 * EconomyEngine unit tests
 * Run: npx jest src/engine/__tests__/EconomyEngine.test.ts
 */

jest.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import type { Token, Investment } from "../../store/portfolioStore";
import { EconomyEngine, YIELD_RATES, PRICE_VOLATILITY } from "../EconomyEngine";

// ── Test fixtures ────────────────────────────────────────────────────────────────

const MOCK_HOLDINGS: Token[] = [
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    emoji: "\u039E",
    iconColor: "#627eea",
    amount: 2.5,
    pricePerUnit: 2800,
    dailyChangePct: 3,
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

const MOCK_INVESTMENT: Investment = {
  id: "inv-1",
  name: "ETH Staking Pool",
  type: "staking",
  amountInvested: 5000,
  dailyReturnPct: 0.5,
  riskLevel: "low",
  scamExposure: "low",
  isActive: true,
  daysActive: 3,
};

const MOCK_RISKY_INVESTMENT: Investment = {
  id: "inv-rug",
  name: "MoonDAO Yield Farm",
  type: "yield-farm",
  amountInvested: 2000,
  dailyReturnPct: 5.0,
  riskLevel: "high",
  scamExposure: "very-high",
  isActive: true,
  daysActive: 9,
  rugPullDay: 10,
};

// ── simulateDay ─────────────────────────────────────────────────────────────────

describe("EconomyEngine", () => {
  describe("simulateDay", () => {
    it("returns updated holdings with changed prices", () => {
      const result = EconomyEngine.simulateDay(MOCK_HOLDINGS, [], 1, 1);

      expect(result.updatedHoldings).toHaveLength(MOCK_HOLDINGS.length);
      for (const token of result.updatedHoldings) {
        expect(token.pricePerUnit).toBeGreaterThan(0);
        expect(typeof token.dailyChangePct).toBe("number");
      }
    });

    it("stablecoin prices stay near $1", () => {
      // Run multiple times to check stablecoin stability
      for (let i = 0; i < 20; i++) {
        const result = EconomyEngine.simulateDay(MOCK_HOLDINGS, [], 1, 1);
        const usdc = result.updatedHoldings.find((t) => t.symbol === "USDC")!;
        expect(usdc.pricePerUnit).toBeGreaterThan(0.99);
        expect(usdc.pricePerUnit).toBeLessThan(1.01);
      }
    });

    it("processes investment returns", () => {
      const result = EconomyEngine.simulateDay(
        MOCK_HOLDINGS,
        [MOCK_INVESTMENT],
        1,
        1,
      );
      // Should have at least staking transaction + investment return
      expect(result.newTransactions.length).toBeGreaterThanOrEqual(1);
    });

    it("triggers rug pull when investment reaches rugPullDay", () => {
      const atRugDay: Investment = {
        ...MOCK_RISKY_INVESTMENT,
        daysActive: 10, // equals rugPullDay
      };
      const result = EconomyEngine.simulateDay(
        MOCK_HOLDINGS,
        [atRugDay],
        5,
        2,
      );
      expect(result.rugPullTriggered).not.toBeNull();
      expect(result.rugPullTriggered!.id).toBe("inv-rug");

      const rugTx = result.newTransactions.find((tx) => tx.type === "rekt-loss");
      expect(rugTx).toBeTruthy();
      expect(rugTx!.amount).toBeLessThan(0);
    });

    it("does NOT trigger rug pull before rugPullDay", () => {
      const result = EconomyEngine.simulateDay(
        MOCK_HOLDINGS,
        [MOCK_RISKY_INVESTMENT], // daysActive 9, rugPullDay 10
        5,
        2,
      );
      expect(result.rugPullTriggered).toBeNull();
    });

    it("skips inactive investments", () => {
      const inactive: Investment = {
        ...MOCK_INVESTMENT,
        isActive: false,
      };
      const result = EconomyEngine.simulateDay(
        MOCK_HOLDINGS,
        [inactive],
        1,
        1,
      );
      // Only staking reward transaction, no investment return
      const invTx = result.newTransactions.filter(
        (tx) => tx.type === "investment-return",
      );
      expect(invTx).toHaveLength(0);
    });
  });

  // ── calculateStakingReward ────────────────────────────────────────────────────

  describe("calculateStakingReward", () => {
    it("returns a positive number for staking", () => {
      for (let i = 0; i < 20; i++) {
        const reward = EconomyEngine.calculateStakingReward(10000, "staking", 1);
        expect(reward).toBeGreaterThan(0);
        // 10000 * 0.3-0.7% * ~1.01 = 30-70ish
        expect(reward).toBeGreaterThanOrEqual(25);
        expect(reward).toBeLessThanOrEqual(80);
      }
    });

    it("yield-farm has higher returns", () => {
      const rewards: number[] = [];
      for (let i = 0; i < 50; i++) {
        rewards.push(
          EconomyEngine.calculateStakingReward(10000, "yield-farm", 1),
        );
      }
      const avg = rewards.reduce((a, b) => a + b, 0) / rewards.length;
      // yield-farm: 3-8%, avg ~5.5% → 10000 * 5.5% * 1.01 ≈ 555
      expect(avg).toBeGreaterThan(300);
    });

    it("higher level gives a bonus", () => {
      // Level 30 = 1 + 0.3 = 1.3x bonus
      // Use a fixed seed approach: just verify level 30 > level 1 on average
      const lowLevel: number[] = [];
      const highLevel: number[] = [];
      for (let i = 0; i < 100; i++) {
        lowLevel.push(
          EconomyEngine.calculateStakingReward(10000, "staking", 1),
        );
        highLevel.push(
          EconomyEngine.calculateStakingReward(10000, "staking", 30),
        );
      }
      const avgLow = lowLevel.reduce((a, b) => a + b, 0) / lowLevel.length;
      const avgHigh = highLevel.reduce((a, b) => a + b, 0) / highLevel.length;
      // Level 30 should average ~30% higher
      expect(avgHigh).toBeGreaterThan(avgLow * 1.1);
    });

    it("caps level bonus at 30%", () => {
      // Level 100 (hypothetical) should still be capped at 1.3x
      // 10000 * 0.7%(max) * 1.3 = 91
      for (let i = 0; i < 20; i++) {
        const reward = EconomyEngine.calculateStakingReward(10000, "staking", 100);
        expect(reward).toBeLessThanOrEqual(91);
      }
    });
  });

  // ── calculateInvestmentReturn ─────────────────────────────────────────────────

  describe("calculateInvestmentReturn", () => {
    it("returns a result with amount, pct, and isPositive", () => {
      const result = EconomyEngine.calculateInvestmentReturn(MOCK_INVESTMENT);
      expect(typeof result.returnAmount).toBe("number");
      expect(typeof result.returnPct).toBe("number");
      expect(typeof result.isPositive).toBe("boolean");
    });

    it("staking returns are within yield rate range", () => {
      for (let i = 0; i < 30; i++) {
        const result = EconomyEngine.calculateInvestmentReturn(MOCK_INVESTMENT);
        // staking: 0.3-0.7% of 5000 → 15-35
        expect(result.returnPct).toBeGreaterThanOrEqual(YIELD_RATES.staking.min);
        expect(result.returnPct).toBeLessThanOrEqual(YIELD_RATES.staking.max);
        expect(result.isPositive).toBe(true);
      }
    });

    it("token investments can be negative", () => {
      const tokenInv: Investment = {
        ...MOCK_INVESTMENT,
        type: "token",
      };
      let hasNegative = false;
      for (let i = 0; i < 50; i++) {
        const result = EconomyEngine.calculateInvestmentReturn(tokenInv);
        if (result.returnAmount < 0) hasNegative = true;
      }
      expect(hasNegative).toBe(true);
    });
  });

  // ── processRugPull ────────────────────────────────────────────────────────────

  describe("processRugPull", () => {
    it("drains 100% of investment", () => {
      const result = EconomyEngine.processRugPull(MOCK_RISKY_INVESTMENT);
      expect(result.totalLost).toBe(2000);
    });

    it("generates a rekt-loss transaction", () => {
      const result = EconomyEngine.processRugPull(MOCK_RISKY_INVESTMENT);
      expect(result.transactionRecord.type).toBe("rekt-loss");
      expect(result.transactionRecord.amount).toBe(-2000);
      expect(result.transactionRecord.isSuspicious).toBe(true);
      expect(result.transactionRecord.label).toContain("LIQUIDITY REMOVED");
      expect(result.transactionRecord.sublabel).toContain("MoonDAO Yield Farm");
    });
  });

  // ── calculateDailyReward ──────────────────────────────────────────────────────

  describe("calculateDailyReward", () => {
    it("returns all reward fields", () => {
      const result = EconomyEngine.calculateDailyReward(
        MOCK_HOLDINGS,
        5,
        10,
        "analyst",
      );
      expect(typeof result.stakingYield).toBe("number");
      expect(typeof result.loginXP).toBe("number");
      expect(typeof result.streakBonusXP).toBe("number");
      expect(typeof result.bonusCoins).toBe("number");
      expect(typeof result.totalPortfolioAfter).toBe("number");
    });

    it("streak bonus XP caps at 200", () => {
      const result = EconomyEngine.calculateDailyReward(
        MOCK_HOLDINGS,
        30,
        1,
        "shadow",
      );
      expect(result.streakBonusXP).toBe(200);
    });

    it("analyst gets +10% XP", () => {
      // streak 0 → base 50 XP, analyst × 1.1 = 55
      const result = EconomyEngine.calculateDailyReward(
        MOCK_HOLDINGS,
        0,
        1,
        "analyst",
      );
      expect(result.loginXP).toBe(55);
    });

    it("shadow gets standard XP", () => {
      // streak 0 → base 50 XP
      const result = EconomyEngine.calculateDailyReward(
        MOCK_HOLDINGS,
        0,
        1,
        "shadow",
      );
      expect(result.loginXP).toBe(50);
    });

    it("gives bonus coins at streak milestones", () => {
      expect(
        EconomyEngine.calculateDailyReward(MOCK_HOLDINGS, 7, 1, "shadow")
          .bonusCoins,
      ).toBe(25);
      expect(
        EconomyEngine.calculateDailyReward(MOCK_HOLDINGS, 14, 1, "shadow")
          .bonusCoins,
      ).toBe(50);
      expect(
        EconomyEngine.calculateDailyReward(MOCK_HOLDINGS, 30, 1, "shadow")
          .bonusCoins,
      ).toBe(100);
    });

    it("no bonus coins below streak 7", () => {
      const result = EconomyEngine.calculateDailyReward(
        MOCK_HOLDINGS,
        3,
        1,
        "ape",
      );
      expect(result.bonusCoins).toBe(0);
    });
  });

  // ── getGrowthToTarget ─────────────────────────────────────────────────────────

  describe("getGrowthToTarget", () => {
    it("returns 0 needed if already at target", () => {
      const result = EconomyEngine.getGrowthToTarget(10000, 5000);
      expect(result.needed).toBe(0);
      expect(result.daysEstimate).toBe(0);
    });

    it("calculates growth needed", () => {
      const result = EconomyEngine.getGrowthToTarget(5000, 10000);
      expect(result.needed).toBe(5000);
      expect(result.percentage).toBe(100);
    });

    it("estimates days based on 2% daily growth", () => {
      // 5000 → 10000 at 2% daily ≈ 35 days
      const result = EconomyEngine.getGrowthToTarget(5000, 10000);
      expect(result.daysEstimate).toBeGreaterThan(30);
      expect(result.daysEstimate).toBeLessThan(40);
    });

    it("handles zero current value", () => {
      const result = EconomyEngine.getGrowthToTarget(0, 10000);
      expect(result.needed).toBe(10000);
      expect(result.percentage).toBe(100);
    });
  });

  // ── generateChartData ─────────────────────────────────────────────────────────

  describe("generateChartData", () => {
    it("returns correct number of data points", () => {
      const data = EconomyEngine.generateChartData(100, 30, "medium", "up");
      expect(data).toHaveLength(30);
    });

    it("starts with the given start price", () => {
      const data = EconomyEngine.generateChartData(2800, 14, "low", "sideways");
      expect(data[0]).toBe(2800);
    });

    it("all prices are positive", () => {
      const data = EconomyEngine.generateChartData(10, 100, "high", "down");
      for (const price of data) {
        expect(price).toBeGreaterThan(0);
      }
    });

    it("up trend generally increases over time", () => {
      // Run multiple times — on average, end should be higher than start
      let higherCount = 0;
      for (let i = 0; i < 30; i++) {
        const data = EconomyEngine.generateChartData(100, 50, "low", "up");
        if (data[data.length - 1] > data[0]) higherCount++;
      }
      // Should trend up at least 60% of the time with up bias
      expect(higherCount).toBeGreaterThan(15);
    });
  });

  // ── createDustAttackToken ─────────────────────────────────────────────────────

  describe("createDustAttackToken", () => {
    it("returns a scam token", () => {
      const token = EconomyEngine.createDustAttackToken();
      expect(token.isScamToken).toBe(true);
      expect(token.isSuspicious).toBe(true);
    });

    it("has high risk and scam exposure", () => {
      const token = EconomyEngine.createDustAttackToken();
      expect(token.riskLevel).toBe("high");
      expect(token.scamExposure).toBe("very-high");
    });

    it("has all required Token fields", () => {
      const token = EconomyEngine.createDustAttackToken();
      expect(token.id).toBeTruthy();
      expect(token.name).toBeTruthy();
      expect(token.symbol).toBeTruthy();
      expect(token.emoji).toBeTruthy();
      expect(token.iconColor).toBeTruthy();
      expect(token.amount).toBeGreaterThan(0);
      expect(token.pricePerUnit).toBeGreaterThan(0);
      expect(typeof token.dailyChangePct).toBe("number");
    });

    it("generates unique IDs", () => {
      const t1 = EconomyEngine.createDustAttackToken();
      const t2 = EconomyEngine.createDustAttackToken();
      expect(t1.id).not.toBe(t2.id);
    });
  });

  // ── Integration: 5-day simulation ─────────────────────────────────────────────

  describe("integration: 5-day simulation with rug pull on day 5", () => {
    it("simulates 5 days, rug pull triggers on correct day", () => {
      const rugInvestment: Investment = {
        id: "inv-rug-test",
        name: "ScamYield",
        type: "yield-farm",
        amountInvested: 3000,
        dailyReturnPct: 6.0,
        riskLevel: "high",
        scamExposure: "very-high",
        isActive: true,
        daysActive: 0,
        rugPullDay: 5,
      };

      let holdings = [...MOCK_HOLDINGS];
      let totalReturns = 0;
      let rugTriggered = false;

      for (let day = 1; day <= 5; day++) {
        const inv = { ...rugInvestment, daysActive: day };
        const result = EconomyEngine.simulateDay(holdings, [inv], day, 1);

        holdings = result.updatedHoldings;
        totalReturns += result.investmentReturns;

        if (result.rugPullTriggered) {
          rugTriggered = true;
          expect(day).toBe(5);
          expect(result.rugPullTriggered.id).toBe("inv-rug-test");
        }
      }

      // Holdings prices should have changed from originals
      const ethOriginal = MOCK_HOLDINGS.find((t) => t.symbol === "ETH")!;
      const ethFinal = holdings.find((t) => t.symbol === "ETH")!;
      expect(ethFinal.pricePerUnit).not.toBe(ethOriginal.pricePerUnit);

      // Rug pull should have triggered on day 5
      expect(rugTriggered).toBe(true);
    });
  });
});
