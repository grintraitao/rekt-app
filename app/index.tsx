import { Redirect } from "expo-router";
import { usePlayerStore } from "../src/store/playerStore";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Index() {
  const hasOnboarded = usePlayerStore((s) => s.hasOnboarded);
  const lastClaimDate = usePlayerStore((s) => s.lastClaimDate);

  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  if (lastClaimDate !== todayISO()) {
    return <Redirect href="/daily-reward" />;
  }

  return <Redirect href="/(tabs)" />;
}
