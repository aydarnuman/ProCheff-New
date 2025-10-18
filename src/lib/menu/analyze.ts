import { MenuAnalysis, MenuItem } from "./types";
import { calculateMacroBalance, detectMenuType, generateWarnings } from "./utils";

// AI-powered menü analizi
export async function analyzeMenuWithAI(text: string): Promise<MenuAnalysis> {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Lütfen aşağıdaki menü metnini analiz et ve JSON formatında döndür:

MENÜ METNİ:
${text}

İSTENEN FORMAT:
{
  "items": [
    {
      "name": "Yemek adı",
      "protein": sayı (gram),
      "fat": sayı (gram), 
      "carb": sayı (gram),
      "calories": sayı (kcal),
      "category": "Ana yemek/Çorba/Salata/Tatlı"
    }
  ],
  "menuType": "Günlük/Haftalık/15 Günlük",
  "analysis": {
    "totalItems": sayı,
    "categories": ["Ana yemek", "Çorba", ...],
    "nutritionNotes": ["protein yüksek", "sebze az", ...]
  }
}

Sadece JSON döndür, başka açıklama yazma.`
      })
    });

    if (!response.ok) {
      throw new Error('AI analiz başarısız');
    }

    const aiResult = await response.json();
    let aiData;
    
    try {
      // AI'dan gelen response'u parse et
      aiData = typeof aiResult.response === 'string' 
        ? JSON.parse(aiResult.response) 
        : aiResult.response;
    } catch (parseError) {
      console.warn('AI JSON parse hatası, fallback kullanılıyor');
      return analyzeMenuFallback(text);
    }

    // AI sonucunu MenuAnalysis formatına çevir
    const items: MenuItem[] = aiData.items?.map((item: any) => ({
      name: item.name || '',
      protein: item.protein || 0,
      fat: item.fat || 0,
      carb: item.carb || 0,
      calories: item.calories,
      category: item.category
    })) || [];

    const macroBalance = calculateMacroBalance(items);
    const warnings = generateWarnings(macroBalance);

    return {
      menuType: aiData.menuType || detectMenuType(text),
      macroBalance,
      warnings: [
        ...warnings,
        ...(aiData.analysis?.nutritionNotes || [])
      ],
      totalItems: items.length,
      aiPowered: true,
      items: items
    };

  } catch (error) {
    console.error('AI menü analizi hatası:', error);
    return analyzeMenuFallback(text);
  }
}

// Fallback: Eski regex-based sistem
export function analyzeMenuFallback(text: string): MenuAnalysis {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const items: MenuItem[] = [];

  for (const line of lines) {
    // örnek: "Kuru Fasulye (protein 15, yağ 10, karbonhidrat 30)"
    const match = line.match(/protein\s*(\d+).*yağ\s*(\d+).*karbonhidrat\s*(\d+)/i);
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
    aiPowered: false,
    items: items
  };
}

// Backward compatibility için eski fonksiyon
export function analyzeMenu(text: string): MenuAnalysis {
  return analyzeMenuFallback(text);
}
