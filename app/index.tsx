import { Redirect } from "expo-router";
import { usePlayerStore } from "../src/store/playerStore";

export default function Index() {
  const hasOnboarded = usePlayerStore((s) => s.hasOnboarded);
  const canClaimToday = usePlayerStore((s) => s.canClaimToday);

  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  if (canClaimToday()) {
    return <Redirect href="/daily-reward" />;
  }

  return <Redirect href="/(tabs)" />;
}
