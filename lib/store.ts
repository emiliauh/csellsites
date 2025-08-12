import { create } from "zustand";

export type Provider = { pid: string; name: string };

type State = {
  ds: string;
  showBell: boolean;
  showRogers: boolean;
  showTelus: boolean;
  otherPids: string[];
  providers: Provider[];     // catalog from pid-map.php
  sidebarOpen: boolean;
  set: (p: Partial<State>) => void;
};

export const useMapStore = create<State>((set) => ({
  ds: "0",
  showBell: true,
  showRogers: true,
  showTelus: true,
  otherPids: [],
  providers: [],
  sidebarOpen: true,
  set: (p) => set(p)
}));
