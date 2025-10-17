import { MenuAnalysis, MenuItem } from "./types";
import {
  detectMenuType,
  calculateMacroBalance,
  generateWarnings,
} from "./utils";

export function analyzeMenu(text: string): MenuAnalysis {
  // Menü satırlarını basit regex ile bul
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const items: MenuItem[] = [];

  for (const line of lines) {
    // örnek: "Kuru Fasulye (protein 15, yağ 10, karbonhidrat 30)"
    const match = line.match(
      /protein\s*(\d+).*yağ\s*(\d+).*karbonhidrat\s*(\d+)/i
    );
    if (match) {
      items.push({
        name: line.split("(")[0].trim(),
        protein: Number(match[1]),
        fat: Number(match[2]),
        carb: Number(match[3]),
      });
    } else {
      items.push({ name: line.trim() });
    }
  }

  const macroBalance = calculateMacroBalance(items);
  const warnings = generateWarnings(macroBalance);

  return {
    menuType: detectMenuType(text),
    macroBalance,
    warnings,
    totalItems: items.length,
  };
}
