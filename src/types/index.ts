export type SpecificationProfile = {
  institution: string;
  city?: string;
  durationDays?: number;
  mealsPerDay?: number;
  population?: number;
  notes?: string[];
};

export type CostAnalysis = {
  materials: number;
  labor: number;
  overhead: number;
  profit: number;
  thresholdK: 0.93;
  thresholdValue: number;
  asdFlag: boolean;
};

export type MenuItem = {
  name: string;
  grams: number;
  kcal?: number;
  cost?: number;
};

export type MenuAdaptation = {
  items: MenuItem[];
  deltas?: Array<{ name: string; diffGrams: number; diffCost?: number }>;
};

export type TenderReport = {
  spec: SpecificationProfile;
  menu: MenuAdaptation;
  cost: CostAnalysis;
  warnings: string[];
};
