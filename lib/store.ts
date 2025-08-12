import { create } from "zustand";

type State = {
  sidebarOpen: boolean;
  carriers: string[];
  techs: string[];
  set: (p: Partial<State>) => void;
};

export const ALL_TECHS = ["LTE","5GNR","5GDSS","HSPA","GSM"];
export const DEFAULT_CARRIERS = ["Bell","Rogers","Telus"];

export const useMapStore = create<State>((set) => ({
  sidebarOpen: true,
  carriers: [...DEFAULT_CARRIERS],
  techs: [...ALL_TECHS],
  set: (p) => set(p)
}));
