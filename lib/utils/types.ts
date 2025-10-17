// Standardized API Response Types for Frontend Panel

export interface PanelData {
  menu: {
    type: string;
    items: number;
    nutrition: {
      protein: number;
      fat: number;
      carb: number;
    };
    warnings: string[];
  };
  costs: {
    material: number;
    labor: number;
    overhead: number;
    total: number;
  };
  profit: {
    rate: number;
    amount: number;
  };
  threshold: {
    kFactor: number;
    limit: number;
    belowThreshold: boolean;
  };
  risks: {
    nutritional: string[];
    financial: string[];
    compliance: string[];
  };
  offer: {
    finalPrice: number;
    currency: "TL";
    perUnit: "portion" | "kg" | "meal";
  };
  meta: {
    processedAt: string;
    duration: string;
    confidence: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  panelData?: PanelData;
}
