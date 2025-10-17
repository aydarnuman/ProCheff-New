export function detectMenuType(text: string): string {
  if (/30\s*gün/i.test(text)) return "30 Günlük Döngü";
  if (/15\s*gün/i.test(text)) return "15 Günlük Döngü";
  if (/7\s*gün/i.test(text)) return "7 Günlük Döngü";
  return "Belirsiz";
}

export function calculateMacroBalance(
  items: { protein?: number; fat?: number; carb?: number }[]
) {
  const sum = { protein: 0, fat: 0, carb: 0 };
  for (const i of items) {
    sum.protein += i.protein || 0;
    sum.fat += i.fat || 0;
    sum.carb += i.carb || 0;
  }
  const total = sum.protein + sum.fat + sum.carb || 1;
  return {
    protein: Math.round((sum.protein / total) * 100),
    fat: Math.round((sum.fat / total) * 100),
    carb: Math.round((sum.carb / total) * 100),
  };
}

export function generateWarnings(balance: {
  protein: number;
  fat: number;
  carb: number;
}): string[] {
  const w: string[] = [];
  if (balance.protein < 15) w.push("Protein oranı düşük (ideal ≥ 18%)");
  if (balance.carb > 65) w.push("Karbonhidrat oranı yüksek");
  if (balance.fat > 30) w.push("Yağ oranı yüksek");
  return w;
}
