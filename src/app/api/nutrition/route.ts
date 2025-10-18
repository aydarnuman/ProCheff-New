import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface NutritionData {
  menuBalance: {
    protein: number; // gram
    carbs: number; // gram
    fat: number; // gram
    fiber: number; // gram
    totalCalories: number;
  };
  dailyRecommendations: {
    protein: { current: number; recommended: number; percentage: number };
    carbs: { current: number; recommended: number; percentage: number };
    fat: { current: number; recommended: number; percentage: number };
    calories: { current: number; recommended: number; percentage: number };
  };
  nutritionScore: {
    overall: number; // 0-100
    protein: number;
    carbs: number;
    fat: number;
    vitamins: number;
    minerals: number;
  };
  ingredients: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    nutritionDensity: number; // 0-100
  }[];
  recommendations: string[];
  timestamp: string;
}

export async function GET() {
  try {
    // Simüle edilmiş beslenme verileri
    const nutritionData: NutritionData = {
      menuBalance: {
        protein: 85,
        carbs: 120,
        fat: 45,
        fiber: 28,
        totalCalories: 1250
      },
      dailyRecommendations: {
        protein: { current: 85, recommended: 80, percentage: 106 },
        carbs: { current: 120, recommended: 130, percentage: 92 },
        fat: { current: 45, recommended: 50, percentage: 90 },
        calories: { current: 1250, recommended: 1200, percentage: 104 }
      },
      nutritionScore: {
        overall: 88,
        protein: 95,
        carbs: 85,
        fat: 78,
        vitamins: 92,
        minerals: 86
      },
      ingredients: [
        {
          name: "Tavuk Göğsü",
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          nutritionDensity: 92
        },
        {
          name: "Somon",
          calories: 208,
          protein: 28,
          carbs: 0,
          fat: 12,
          nutritionDensity: 95
        },
        {
          name: "Avokado",
          calories: 160,
          protein: 2,
          carbs: 9,
          fat: 15,
          nutritionDensity: 89
        },
        {
          name: "Kinoa",
          calories: 120,
          protein: 4.5,
          carbs: 22,
          fat: 1.9,
          nutritionDensity: 94
        },
        {
          name: "Ispanak",
          calories: 23,
          protein: 2.9,
          carbs: 3.6,
          fat: 0.4,
          nutritionDensity: 98
        }
      ],
      recommendations: [
        "Omega-3 açısından zengin balık ürünlerini artırın",
        "Lif içeriğini yükseltmek için tam tahıl kullanın",
        "Antioksidan değerini artırmak için renkli sebzeler ekleyin",
        "Porsiyon kontrolü ile kalori dengesini sağlayın",
        "Vitamin D eksikliğini gidermek için güneşlenme önerisi"
      ],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: nutritionData,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Nutrition API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Beslenme verilerini alırken hata oluştu',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
