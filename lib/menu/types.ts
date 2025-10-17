export interface MenuItem {
  name: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carb?: number;
}

export interface MenuAnalysis {
  menuType: string;
  macroBalance: { protein: number; fat: number; carb: number };
  warnings: string[];
  totalItems: number;
}
