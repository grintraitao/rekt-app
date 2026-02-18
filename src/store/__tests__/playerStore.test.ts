import { usePlayerStore, getLevel, getLevelProgress, CLASS_CONFIGS } from "../playerStore";

beforeEach(() => {
  usePlayerStore.getState().resetAll();
});

describe("playerStore — class system & leveling", () => {
  it("selects Ape class and applies correct stat modifiers", () => {
    const { selectClass } = usePlayerStore.getState();
    selectClass("ape");

    const { playerClass, stats, abilityUsesRemaining } = usePlayerStore.getState();
    console.log("=== After selecting Ape ===");
    console.log("Class:", playerClass);
    console.log("Stats:", stats);
    console.log("Ability uses:", abilityUsesRemaining);

    expect(playerClass).toBe("ape");
    // Base 20 + ape modifier (-5)
    expect(stats.security).toBe(15);
    // Base 20 + ape modifier (-10)
    expect(stats.detection).toBe(10);
    // Base 20 + ape modifier (+15)
    expect(stats.wealth).toBe(35);
    // Base 10 + ape modifier (0)
    expect(stats.knowledge).toBe(10);
    // Base 100 + ape modifier (0)
    expect(stats.hp).toBe(100);
    // Ape gets 1 ability use (only analyst gets 2)
    expect(abilityUsesRemaining).toBe(1);
  });

  it("adds 500 XP and levels up correctly", () => {
    const { selectClass, addXP } = usePlayerStore.getState();
    selectClass("ape");
    addXP(500);

    const { level, xp, xpToNextLevel, title, stats } = usePlayerStore.getState();
    console.log("\n=== After adding 500 XP ===");
    console.log("Level:", level);
    console.log("XP remaining:", xp);
    console.log("XP to next level:", xpToNextLevel);
    console.log("Title:", title);
    console.log("Stats:", stats);

    // 500 XP: level 1 needs 300 → level up to 2, 200 XP left
    // level 2 needs 600 → stay at 2
    expect(level).toBe(2);
    expect(xp).toBe(200);
    expect(xpToNextLevel).toBe(600);
    expect(title).toBe("NOOB");
  });

  it("getLevel and getLevelProgress match store behavior", () => {
    const progress = getLevelProgress(500);
    console.log("\n=== getLevelProgress(500) ===");
    console.log(progress);

    expect(getLevel(500)).toBe(2);
    expect(progress.level).toBe(2);
    expect(progress.current).toBe(200);
    expect(progress.required).toBe(600);
    expect(progress.pct).toBeCloseTo(33.33, 1);
  });

  it("Ape class config is correct", () => {
    const ape = CLASS_CONFIGS.ape;
    console.log("\n=== Ape class config ===");
    console.log(ape);

    expect(ape.name).toBe("The Ape");
    expect(ape.uniqueAbility).toContain("Diamond Hands");
    expect(ape.statModifiers.wealth).toBe(15);
    expect(ape.statModifiers.security).toBe(-5);
  });
});
