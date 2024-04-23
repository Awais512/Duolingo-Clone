import { create } from "zustand";

type PracticeModallState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const usePracticeModall = create<PracticeModallState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
