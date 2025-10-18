export interface MenuItem {
  name: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carb?: number;
  category?: string; // "Ana yemek", "Çorba", "Salata", "Tatlı"
}

export interface MenuAnalysis {
  menuType: string;
  macroBalance: { protein: number; fat: number; carb: number };
  warnings: string[];
  totalItems: number;
  aiPowered?: boolean; // AI analizi kullanıldı mı?
  items?: MenuItem[]; // Detaylı item listesi
}
