import { create } from "zustand";

export type PlayerClass = "ape" | "analyst" | "shadow" | "degen";

type PlayerState = {
  selectedClass: PlayerClass;
  setClass: (cls: PlayerClass) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  selectedClass: "ape",
  setClass: (cls) => set({ selectedClass: cls }),
}));
