import { create } from "zustand";

type HeartModallState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useHeartModall = create<HeartModallState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
