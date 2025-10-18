"use client";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Panel Data Types
interface MenuData {
  type: string;
  items: number;
  nutrition: {
    protein: number;
    fat: number;
    carb: number;
  };
  warnings: string[];
}

interface OfferData {
  finalPrice: number;
  currency: string;
  perUnit: string;
  detail: {
    material: number;
    labor: number;
    overhead: number;
    profit: number;
  };
}

interface PanelData {
  menu?: MenuData;
  offer?: OfferData;
  costs?: any;
  risks?: {
    nutritional: string[];
    financial: string[];
    compliance: string[];
  };
  meta?: {
    processedAt: string;
    duration: string;
    confidence: number;
  };
}

// Store Interface
interface PanelDataState {
  panelData: PanelData;
  updateMenu: (menu: MenuData) => void;
  updateOffer: (offer: OfferData) => void;
  updatePanelData: (data: Partial<PanelData>) => void;
  resetData: () => void;
}

// Create Store
export const usePanelData = create<PanelDataState>()(
  devtools(
    (set, get) => ({
      panelData: {},
      
      updateMenu: (menu) =>
        set(
          (state) => ({
            panelData: { ...state.panelData, menu },
          }),
          false,
          "updateMenu"
        ),

      updateOffer: (offer) =>
        set(
          (state) => ({
            panelData: { ...state.panelData, offer },
          }),
          false,
          "updateOffer"
        ),

      updatePanelData: (data) =>
        set(
          (state) => ({
            panelData: { ...state.panelData, ...data },
          }),
          false,
          "updatePanelData"
        ),

      resetData: () =>
        set(
          { panelData: {} },
          false,
          "resetData"
        ),
    }),
    {
      name: "procheff-panel-storage",
    }
  )
);
