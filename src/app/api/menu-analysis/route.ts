import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface MenuAnalysisData {
  dishes: {
    name: string;
    weight: number; // gram
    cost: number; // TL
    score: number; // 0-100
    category: string;
    ingredients: string[];
    nutritionScore: number;
    profitability: number;
  }[];
  summary: {
    totalDishes: number;
    averageCost: number;
    averageScore: number;
    totalWeight: number;
    recommendedChanges: string[];
  };
  analysis: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  timestamp: string;
}

export async function GET() {
  try {
    // Simüle edilmiş menü analizi verileri
    const menuData: MenuAnalysisData = {
      dishes: [
        {
          name: "Izgara Tavuk Salata",
          weight: 320,
          cost: 28.50,
          score: 92,
          category: "Ana Yemek",
          ingredients: ["Tavuk göğsü", "Karışık yeşillik", "Domates", "Salatalık", "Sos"],
          nutritionScore: 95,
          profitability: 78
        },
        {
          name: "Klasik Caesar Salata",
          weight: 280,
          cost: 24.00,
          score: 88,
          category: "Salata",
          ingredients: ["Marul", "Parmesan", "Kruton", "Caesar sos", "Sarımsak"],
          nutritionScore: 82,
          profitability: 85
        },
        {
          name: "Somon Teriyaki",
          weight: 350,
          cost: 45.00,
          score: 94,
          category: "Ana Yemek",
          ingredients: ["Somon", "Teriyaki sos", "Basmati pirinç", "Sebze garnitür"],
          nutritionScore: 98,
          profitability: 65
        },
        {
          name: "Mantarlı Risotto",
          weight: 300,
          cost: 32.00,
          score: 86,
          category: "Ana Yemek",
          ingredients: ["Arborio pirinç", "Karışık mantar", "Parmesan", "Krema", "Beyaz şarap"],
          nutritionScore: 75,
          profitability: 72
        },
        {
          name: "Çikolatalı Lava Kek",
          weight: 150,
          cost: 18.00,
          score: 91,
          category: "Tatlı",
          ingredients: ["Bitter çikolata", "Tereyağı", "Yumurta", "Un", "Vanilin"],
          nutritionScore: 45,
          profitability: 88
        }
      ],
      summary: {
        totalDishes: 5,
        averageCost: 29.50,
        averageScore: 90.2,
        totalWeight: 1400,
        recommendedChanges: [
          "Vegan seçenekleri ekleyin",
          "Gluten-free alternatifler sunun",
          "Porsiyon boyutlarını optimize edin",
          "Maliyet etkin malzemeler kullanın"
        ]
      },
      analysis: {
        strengths: [
          "Yüksek kaliteli protein kaynakları",
          "Dengeli beslenme değerleri",
          "Çeşitli kategori seçenekleri",
          "Premium malzeme kalitesi"
        ],
        weaknesses: [
          "Vegan seçeneklerin eksikliği",
          "Yüksek maliyet oranları",
          "Sınırlı diyet alternatifleri",
          "Mevsimsel ürün bağımlılığı"
        ],
        suggestions: [
          "Bitki bazlı protein seçenekleri ekleyin",
          "Maliyetleri optimize etmek için yerel tedarikçiler bulun",
          "Porsiyon kontrolü yaparak food cost'u düşürün",
          "Mevsimsel menü rotasyonu uygulayın"
        ]
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: menuData,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Menu analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Menü analizi verilerini alırken hata oluştu',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
