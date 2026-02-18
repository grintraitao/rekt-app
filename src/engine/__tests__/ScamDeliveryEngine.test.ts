/**
 * ScamDeliveryEngine unit tests
 * Run: npx jest src/engine/__tests__/ScamDeliveryEngine.test.ts
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

import type { Token } from "../../store/portfolioStore";
import { ScamDeliveryEngine } from "../ScamDeliveryEngine";

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
];

const CH1_SCENARIOS = [
  "ch1-fake-support-dm",
  "ch1-seed-phrase-request",
  "ch1-fake-airdrop",
  "ch1-phishing-email",
  "ch1-seed-phrase-trap",
];

// ── generateNotifications ────────────────────────────────────────────────────────

describe("ScamDeliveryEngine", () => {
  describe("generateNotifications", () => {
    it("returns 4-8 notifications", () => {
      const results: number[] = [];
      // Run multiple times due to randomness
      for (let i = 0; i < 20; i++) {
        const notifs = ScamDeliveryEngine.generateNotifications(1, [], 1);
        results.push(notifs.length);
      }
      expect(Math.min(...results)).toBeGreaterThanOrEqual(4);
      expect(Math.max(...results)).toBeLessThanOrEqual(8);
    });

    it("includes both legit and scam notifications", () => {
      // Generate enough times to statistically ensure both types
      let hasLegit = false;
      let hasScam = false;
      for (let i = 0; i < 10; i++) {
        const notifs = ScamDeliveryEngine.generateNotifications(1, [], 3);
        if (notifs.some((n) => n.type === "legit")) hasLegit = true;
        if (notifs.some((n) => n.type === "scam")) hasScam = true;
      }
      expect(hasLegit).toBe(true);
      expect(hasScam).toBe(true);
    });

    it("scam notifications link to uncompleted scenarios only", () => {
      const completed = [
        "ch1-fake-support-dm",
        "ch1-seed-phrase-request",
      ];
      const notifs = ScamDeliveryEngine.generateNotifications(1, completed, 3);
      const scams = notifs.filter((n) => n.type === "scam");

      for (const scam of scams) {
        if (scam.linkedScenarioId) {
          expect(completed).not.toContain(scam.linkedScenarioId);
        }
      }
    });

    it("all notifications have required fields", () => {
      const notifs = ScamDeliveryEngine.generateNotifications(1, [], 1);
      for (const n of notifs) {
        expect(n.id).toBeTruthy();
        expect(n.type).toMatch(/^(legit|scam)$/);
        expect(n.title).toBeTruthy();
        expect(n.subtitle).toBeTruthy();
        expect(n.icon).toBeTruthy();
        expect(n.iconBg).toBeTruthy();
        expect(n.timestamp).toBeTruthy();
        expect(typeof n.isRead).toBe("boolean");
      }
    });
  });

  // ── generateActivityFeed ──────────────────────────────────────────────────────

  describe("generateActivityFeed", () => {
    it("returns 10-15 activity items", () => {
      const results: number[] = [];
      for (let i = 0; i < 20; i++) {
        const feed = ScamDeliveryEngine.generateActivityFeed(
          1,
          MOCK_HOLDINGS,
          [],
          3,
        );
        results.push(feed.length);
      }
      expect(Math.min(...results)).toBeGreaterThanOrEqual(10);
      expect(Math.max(...results)).toBeLessThanOrEqual(15);
    });

    it("includes both legit and suspicious transactions", () => {
      let hasLegit = false;
      let hasSuspicious = false;
      for (let i = 0; i < 10; i++) {
        const feed = ScamDeliveryEngine.generateActivityFeed(
          1,
          MOCK_HOLDINGS,
          [],
          3,
        );
        if (feed.some((tx) => !tx.isSuspicious)) hasLegit = true;
        if (feed.some((tx) => tx.isSuspicious)) hasSuspicious = true;
      }
      expect(hasLegit).toBe(true);
      expect(hasSuspicious).toBe(true);
    });

    it("suspicious items link to uncompleted scenarios", () => {
      const completed = ["ch1-fake-support-dm"];
      const feed = ScamDeliveryEngine.generateActivityFeed(
        1,
        MOCK_HOLDINGS,
        completed,
        3,
      );
      const suspicious = feed.filter((tx) => tx.isSuspicious);

      for (const tx of suspicious) {
        if (tx.linkedScenarioId) {
          expect(completed).not.toContain(tx.linkedScenarioId);
        }
      }
    });

    it("transactions are sorted newest first", () => {
      const feed = ScamDeliveryEngine.generateActivityFeed(
        1,
        MOCK_HOLDINGS,
        [],
        5,
      );
      for (let i = 1; i < feed.length; i++) {
        const prev = new Date(feed[i - 1].timestamp).getTime();
        const curr = new Date(feed[i].timestamp).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it("all transactions have required fields", () => {
      const feed = ScamDeliveryEngine.generateActivityFeed(
        1,
        MOCK_HOLDINGS,
        [],
        1,
      );
      for (const tx of feed) {
        expect(tx.id).toBeTruthy();
        expect(tx.type).toBeTruthy();
        expect(tx.label).toBeTruthy();
        expect(tx.sublabel).toBeTruthy();
        expect(typeof tx.amount).toBe("number");
        expect(tx.timestamp).toBeTruthy();
        expect(typeof tx.isSuspicious).toBe("boolean");
      }
    });
  });

  // ── shouldTriggerScam ─────────────────────────────────────────────────────────

  describe("shouldTriggerScam", () => {
    it("does not trigger if last scam was too recent", () => {
      const justNow = new Date().toISOString();
      const result = ScamDeliveryEngine.shouldTriggerScam(
        justNow,
        1,
        1,
        [],
        5,
      );
      expect(result).toBe(false);
    });

    it("forces trigger after 3+ days without scam", () => {
      const threeDaysAgo = new Date(
        Date.now() - 4 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const result = ScamDeliveryEngine.shouldTriggerScam(
        threeDaysAgo,
        5,
        1,
        [],
        5,
      );
      expect(result).toBe(true);
    });

    it("triggers when only boss is left and all others done", () => {
      const twoDaysAgo = new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000,
      ).toISOString();
      // All ch1 non-boss scenarios completed
      const completed = [
        "ch1-fake-support-dm",
        "ch1-seed-phrase-request",
        "ch1-fake-airdrop",
        "ch1-phishing-email",
      ];
      const result = ScamDeliveryEngine.shouldTriggerScam(
        twoDaysAgo,
        5,
        1,
        completed,
        5,
      );
      expect(result).toBe(true);
    });
  });

  // ── selectNextScenario ────────────────────────────────────────────────────────

  describe("selectNextScenario", () => {
    it("returns an uncompleted scenario", () => {
      const result = ScamDeliveryEngine.selectNextScenario(1, [], "ape");
      expect(result).not.toBeNull();
      expect(CH1_SCENARIOS).toContain(result!.scenarioId);
    });

    it("does not select completed scenarios", () => {
      const completed = [
        "ch1-fake-support-dm",
        "ch1-seed-phrase-request",
        "ch1-fake-airdrop",
      ];
      const result = ScamDeliveryEngine.selectNextScenario(
        1,
        completed,
        "analyst",
      );
      expect(result).not.toBeNull();
      expect(completed).not.toContain(result!.scenarioId);
    });

    it("does not select boss until all others are done", () => {
      // Only 1 non-boss scenario remains
      const completed = [
        "ch1-fake-support-dm",
        "ch1-seed-phrase-request",
        "ch1-fake-airdrop",
      ];
      // Run multiple times — boss (ch1-seed-phrase-trap) should never be picked
      for (let i = 0; i < 20; i++) {
        const result = ScamDeliveryEngine.selectNextScenario(
          1,
          completed,
          "ape",
        );
        expect(result).not.toBeNull();
        expect(result!.scenarioId).toBe("ch1-phishing-email");
      }
    });

    it("selects boss when all non-boss are done", () => {
      const completed = [
        "ch1-fake-support-dm",
        "ch1-seed-phrase-request",
        "ch1-fake-airdrop",
        "ch1-phishing-email",
      ];
      const result = ScamDeliveryEngine.selectNextScenario(
        1,
        completed,
        "ape",
      );
      expect(result).not.toBeNull();
      expect(result!.scenarioId).toBe("ch1-seed-phrase-trap");
    });

    it("returns null when all scenarios are completed", () => {
      const result = ScamDeliveryEngine.selectNextScenario(
        1,
        CH1_SCENARIOS,
        "ape",
      );
      expect(result).toBeNull();
    });

    it("returns a valid delivery channel", () => {
      const result = ScamDeliveryEngine.selectNextScenario(1, [], "analyst");
      expect(result).not.toBeNull();
      expect([
        "notification",
        "dm",
        "activity-feed",
        "approval-popup",
        "npc-conversation",
      ]).toContain(result!.deliveryChannel);
    });

    it("returns null for invalid chapter", () => {
      const result = ScamDeliveryEngine.selectNextScenario(99, [], "ape");
      expect(result).toBeNull();
    });
  });

  // ── generateLegitNotifications ────────────────────────────────────────────────

  describe("generateLegitNotifications", () => {
    it("generates the requested count", () => {
      const notifs = ScamDeliveryEngine.generateLegitNotifications(
        MOCK_HOLDINGS,
        5,
      );
      expect(notifs).toHaveLength(5);
    });

    it("all notifications are legit type", () => {
      const notifs = ScamDeliveryEngine.generateLegitNotifications(
        MOCK_HOLDINGS,
        3,
      );
      for (const n of notifs) {
        expect(n.type).toBe("legit");
        expect(n.linkedScenarioId).toBeUndefined();
      }
    });

    it("notifications have all required fields", () => {
      const notifs = ScamDeliveryEngine.generateLegitNotifications(
        MOCK_HOLDINGS,
        4,
      );
      for (const n of notifs) {
        expect(n.id).toBeTruthy();
        expect(n.title).toBeTruthy();
        expect(n.subtitle).toBeTruthy();
        expect(n.icon).toBeTruthy();
        expect(n.iconBg).toBeTruthy();
        expect(n.timestamp).toBeTruthy();
        expect(typeof n.isRead).toBe("boolean");
      }
    });
  });
});
