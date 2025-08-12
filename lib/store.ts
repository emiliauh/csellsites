import { create } from "zustand";

type State = {
  ds: string;
  showBell: boolean;
  showRogers: boolean;
  showTelus: boolean;
  pidOther: string | null;
  set: (p: Partial<State>) => void;
};

export const useMapStore = create<State>((set) => ({
  ds: "0",
  showBell: true,
  showRogers: true,
  showTelus: true,
  pidOther: "0",
  set: (p) => set(p)
}));
