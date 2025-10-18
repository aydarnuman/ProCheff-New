import { create } from "zustand";

export interface PanelData {
  menu?: {
    type: string;
    items: number;
    nutrition: {
      protein: number;
      carb: number;
      fat: number;
    };
    warnings: string[];
  };
  costs?: {
    material: number;
    labor: number;
    overhead: number;
    total: number;
  };
  profit?: {
    amount: number;
    rate: number;
  };
  threshold?: {
    acceptable: number;
    optimal: number;
  };
  risks?: {
    score: number;
    level: string;
    items: string[];
  };
  offer?: {
    price: number;
    currency: string;
    breakdown: any;
  };
  reasoning?: {
    score: number;
    risks: string[];
    suggestions: string[];
    compliance: string[];
  };
  simulation?: {
    newMenu: any;
    newOffer: any;
    reasoning: any;
  };
}

interface PanelState {
  panelData: PanelData | null;
  setPanelData: (data: PanelData) => void;
  clearData: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  panelData: null,
  setPanelData: (data) => set({ panelData: data }),
  clearData: () => set({ panelData: null }),
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
