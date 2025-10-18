/**
 * ProCheff Menu Analysis Core
 * İzole, test edilebilir menü analiz fonksiyonları
 */

import { log } from "@/lib/utils/logger";
import { MenuAnalysis, MenuItem } from "./types";
import { calculateMacroBalance, detectMenuType, generateWarnings } from "./utils";

// Structured menu analysis result
export interface MenuAnalysisResult {
  success: boolean;
  data?: MenuAnalysis;
  confidence: number;
  source: 'ai' | 'regex' | 'fallback';
  error?: string;
  metadata: {
    processedAt: string;
    inputLength: number;
    processingTime: number;
  };
}

// AI Analysis Request/Response types
interface AIAnalysisRequest {
  text: string;
  options?: {
    includeNutrition?: boolean;
    includeCategories?: boolean;
  };
}

interface AIAnalysisResponse {
  items: MenuItem[];
  menuType: string;
  analysis: {
    totalItems: number;
    categories: string[];
    nutritionNotes: string[];
  };
}

/**
 * Ana menü analiz fonksiyonu - izole ve test edilebilir
 */
export async function analyzeMenu(
  text: string, 
  options: { useAI?: boolean; fallbackOnError?: boolean } = {}
): Promise<MenuAnalysisResult> {
  const startTime = Date.now();
  const { useAI = true, fallbackOnError = true } = options;

  try {
    log.info('Menu analysis started', { 
      inputLength: text.length, 
      useAI,
      fallbackOnError 
    });

    // AI analizi tercih ediliyorsa ve mevcut ise
    if (useAI) {
      const aiResult = await performAIAnalysis({ text });
      if (aiResult.success && aiResult.data) {
        return {
          ...aiResult,
          metadata: {
            processedAt: new Date().toISOString(),
            inputLength: text.length,
            processingTime: Date.now() - startTime
          }
        };
      }

      // AI başarısız oldu, fallback kullan
      if (!fallbackOnError) {
        return createErrorResult('AI analysis failed', startTime, text.length);
      }
    }

    // Regex-based fallback analysis
    const regexResult = performRegexAnalysis(text);
    return {
      ...regexResult,
      metadata: {
        processedAt: new Date().toISOString(),
        inputLength: text.length,
        processingTime: Date.now() - startTime
      }
    };

  } catch (error) {
    log.error('Menu analysis failed', { error: error instanceof Error ? error.message : 'Unknown' });
    return createErrorResult(
      error instanceof Error ? error.message : 'Unknown error',
      startTime,
      text.length
    );
  }
}

/**
 * AI-powered analiz (izole)
 */
async function performAIAnalysis(request: AIAnalysisRequest): Promise<MenuAnalysisResult> {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: buildAIPrompt(request.text, request.options)
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    
    // AI response'u parse et
    const parsedData = parseAIResponse(aiResult);
    if (!parsedData) {
      throw new Error('AI response parsing failed');
    }

    // MenuAnalysis formatına çevir
    const menuAnalysis = convertToMenuAnalysis(parsedData);
    
    return {
      success: true,
      data: menuAnalysis,
      confidence: calculateAIConfidence(parsedData),
      source: 'ai',
      metadata: {
        processedAt: new Date().toISOString(),
        inputLength: request.text.length,
        processingTime: 0 // Will be set by caller
      }
    };

  } catch (error) {
    log.warn('AI analysis failed', { error: error instanceof Error ? error.message : 'Unknown' });
    return {
      success: false,
      confidence: 0,
      source: 'ai',
      error: error instanceof Error ? error.message : 'Unknown AI error',
      metadata: {
        processedAt: new Date().toISOString(),
        inputLength: request.text.length,
        processingTime: 0
      }
    };
  }
}

/**
 * Regex-based fallback analiz (izole)
 */
function performRegexAnalysis(text: string): MenuAnalysisResult {
  try {
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
    
    const menuAnalysis: MenuAnalysis = {
      menuType: detectMenuType(text),
      macroBalance,
      warnings,
      totalItems: items.length,
      aiPowered: false,
      items: items
    };

    return {
      success: true,
      data: menuAnalysis,
      confidence: calculateRegexConfidence(items),
      source: 'regex',
      metadata: {
        processedAt: new Date().toISOString(),
        inputLength: text.length,
        processingTime: 0 // Will be set by caller
      }
    };

  } catch (error) {
    return {
      success: false,
      confidence: 0,
      source: 'regex',
      error: error instanceof Error ? error.message : 'Regex analysis failed',
      metadata: {
        processedAt: new Date().toISOString(),
        inputLength: text.length,
        processingTime: 0
      }
    };
  }
}

/**
 * AI prompt builder
 */
function buildAIPrompt(text: string, options?: AIAnalysisRequest['options']): string {
  return `Lütfen aşağıdaki menü metnini analiz et ve JSON formatında döndür:

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

Sadece JSON döndür, başka açıklama yazma.`;
}

/**
 * AI response parser
 */
function parseAIResponse(aiResult: any): AIAnalysisResponse | null {
  try {
    const responseText = aiResult.response || aiResult.message || aiResult;
    const parsed = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
    
    // Validate structure
    if (!parsed.items || !Array.isArray(parsed.items)) {
      return null;
    }
    
    return parsed;
  } catch (error) {
    log.warn('AI response parse failed', { error: error instanceof Error ? error.message : 'Unknown' });
    return null;
  }
}

/**
 * AI data'yı MenuAnalysis'e çevir
 */
function convertToMenuAnalysis(aiData: AIAnalysisResponse): MenuAnalysis {
  const items: MenuItem[] = aiData.items.map((item: any) => ({
    name: item.name || '',
    protein: item.protein || 0,
    fat: item.fat || 0,
    carb: item.carb || 0,
    calories: item.calories,
    category: item.category
  }));

  const macroBalance = calculateMacroBalance(items);
  const warnings = generateWarnings(macroBalance);

  return {
    menuType: aiData.menuType || 'Belirsiz',
    macroBalance,
    warnings: [
      ...warnings,
      ...(aiData.analysis?.nutritionNotes || [])
    ],
    totalItems: items.length,
    aiPowered: true,
    items: items
  };
}

/**
 * Confidence calculators
 */
function calculateAIConfidence(aiData: AIAnalysisResponse): number {
  let confidence = 0.95; // Base AI confidence
  
  // Item kalitesine göre ayarla
  const validItems = aiData.items.filter(item => 
    item.name && ((item.protein || 0) > 0 || (item.fat || 0) > 0 || (item.carb || 0) > 0)
  );
  
  const itemQuality = validItems.length / aiData.items.length;
  confidence *= itemQuality;
  
  // Minimum 0.7, maksimum 0.98
  return Math.max(0.7, Math.min(0.98, confidence));
}

function calculateRegexConfidence(items: MenuItem[]): number {
  const itemsWithNutrition = items.filter(item => 
    item.protein !== undefined && item.protein > 0
  );
  
  if (items.length === 0) return 0.1;
  
  const nutritionRatio = itemsWithNutrition.length / items.length;
  return Math.max(0.1, Math.min(0.6, 0.3 + nutritionRatio * 0.3));
}

/**
 * Error result helper
 */
function createErrorResult(
  error: string, 
  startTime: number, 
  inputLength: number
): MenuAnalysisResult {
  return {
    success: false,
    confidence: 0,
    source: 'fallback',
    error,
    metadata: {
      processedAt: new Date().toISOString(),
      inputLength,
      processingTime: Date.now() - startTime
    }
  };
}
