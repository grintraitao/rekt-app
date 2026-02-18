import { usePortfolioStore } from "../portfolioStore";

beforeEach(() => {
  usePortfolioStore.getState().resetPortfolio();
});

describe("portfolioStore — Ape class economy engine", () => {
  it("initializes portfolio for Ape with +20% boost", () => {
    const { initializePortfolio } = usePortfolioStore.getState();
    initializePortfolio("ape");

    const { holdings, totalValue, portfolioHistory, allTimeHigh } =
      usePortfolioStore.getState();

    // Ape gets 20% boost on all amounts
    const eth = holdings.find((h) => h.symbol === "ETH")!;
    expect(eth.amount).toBe(3); // 2.5 * 1.2
    expect(eth.pricePerUnit).toBe(2875);

    const usdc = holdings.find((h) => h.symbol === "USDC")!;
    expect(usdc.amount).toBe(1800); // 1500 * 1.2

    const rekt = holdings.find((h) => h.symbol === "REKT")!;
    expect(rekt.amount).toBe(1200); // 1000 * 1.2

    // Total = 3*2875 + 1800*1 + 1200*0.5 = 8625 + 1800 + 600 = 11025
    expect(totalValue).toBe(11025);
    expect(holdings).toHaveLength(3);
    expect(portfolioHistory).toEqual([11025]);
    expect(allTimeHigh).toBe(11025);
  });

  it("simulates 3 market days and updates prices/totals", () => {
    const { initializePortfolio } = usePortfolioStore.getState();
    initializePortfolio("ape");

    const initialValue = usePortfolioStore.getState().totalValue;

    // Run 3 market days
    for (let i = 0; i < 3; i++) {
      usePortfolioStore.getState().simulateMarketDay();
    }

    const { holdings, totalValue, dailyChange, dailyChangePct } =
      usePortfolioStore.getState();

    // Prices should have changed from their starting values
    const eth = holdings.find((h) => h.symbol === "ETH")!;
    const usdc = holdings.find((h) => h.symbol === "USDC")!;

    // ETH price should have moved (±5% per day, 3 days)
    // It's random, so just verify it's no longer exactly the starting price
    // (astronomically unlikely to land on exactly 2875 after 3 random swings)
    expect(eth.pricePerUnit).not.toBe(2875);

    // USDC should stay very close to 1.0 (±0.1% per day)
    expect(usdc.pricePerUnit).toBeGreaterThan(0.99);
    expect(usdc.pricePerUnit).toBeLessThan(1.01);

    // totalValue was recalculated
    expect(totalValue).toBeGreaterThan(0);
    // dailyChange and dailyChangePct are numbers (could be positive or negative)
    expect(typeof dailyChange).toBe("number");
    expect(typeof dailyChangePct).toBe("number");
  });

  it("adds a scam transaction and counts it as suspicious", () => {
    const { initializePortfolio } = usePortfolioStore.getState();
    initializePortfolio("ape");

    // Add a legitimate transaction first
    usePortfolioStore.getState().addTransaction({
      type: "staking-reward",
      label: "Staking reward",
      sublabel: "Lido Finance",
      amount: 23.4,
      isSuspicious: false,
    });

    // Inject scam transaction
    usePortfolioStore.getState().injectScamTransaction({
      type: "dust-attack",
      label: "Unknown token: CLAIM NOW",
      sublabel: "From unknown sender",
      amount: 0.001,
      isSuspicious: false, // store forces this to true
      linkedScenarioId: "scam-phishing-01",
    });

    const { transactions } = usePortfolioStore.getState();
    expect(transactions).toHaveLength(2);

    // Most recent first
    expect(transactions[0].type).toBe("dust-attack");
    expect(transactions[0].isSuspicious).toBe(true);
    expect(transactions[0].linkedScenarioId).toBe("scam-phishing-01");
    expect(transactions[0].id).toBeTruthy();
    expect(transactions[0].timestamp).toBeTruthy();

    // Suspicious filter
    const suspicious = usePortfolioStore.getState().getSuspiciousTransactions();
    expect(suspicious).toHaveLength(1);
    expect(suspicious[0].label).toBe("Unknown token: CLAIM NOW");

    // Recent filter
    const recent = usePortfolioStore.getState().getRecentTransactions(1);
    expect(recent).toHaveLength(1);
    expect(recent[0].type).toBe("dust-attack");
  });

  it("full flow: init → simulate → scam → verify totals", () => {
    const store = usePortfolioStore.getState();
    store.initializePortfolio("ape");

    // Simulate 3 market days
    for (let i = 0; i < 3; i++) {
      usePortfolioStore.getState().simulateMarketDay();
    }

    // Take a snapshot after simulation
    usePortfolioStore.getState().takeSnapshot();

    // Inject scam transaction
    usePortfolioStore.getState().injectScamTransaction({
      type: "airdrop",
      label: "Free 10,000 MOON tokens!",
      sublabel: "Tap to claim",
      amount: 0,
      isSuspicious: true,
    });

    const state = usePortfolioStore.getState();

    // Portfolio history: 1 from init + 1 from takeSnapshot
    expect(state.portfolioHistory).toHaveLength(2);

    // Chart data works
    const chart = state.getChartData(10);
    expect(chart).toHaveLength(2);

    // 1 scam transaction
    expect(state.transactions).toHaveLength(1);
    expect(state.getSuspiciousTransactions()).toHaveLength(1);

    // Totals are consistent
    const manualTotal = state.holdings.reduce(
      (sum, h) => sum + h.amount * h.pricePerUnit,
      0,
    );
    expect(state.totalValue).toBeCloseTo(manualTotal, 1);

    // All-time high was tracked
    expect(state.allTimeHigh).toBeGreaterThanOrEqual(state.totalValue);
    expect(state.allTimeHigh).toBeGreaterThan(0);
  });
});
