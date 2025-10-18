import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface InsightsData {
  priceStatus: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
    competitorComparison: number; // %
    recommendation: string;
  };
  riskLevel: {
    overall: 'low' | 'medium' | 'high';
    score: number; // 0-100
    factors: {
      name: string;
      level: 'low' | 'medium' | 'high';
      impact: number; // 0-100
      description: string;
    }[];
  };
  generalStatus: {
    performance: number; // 0-100
    satisfaction: number; // 0-100
    efficiency: number; // 0-100
    profitability: number; // 0-100
    summary: string;
  };
  trends: {
    revenue: { current: number; previous: number; change: number };
    customers: { current: number; previous: number; change: number };
    avgOrderValue: { current: number; previous: number; change: number };
    costs: { current: number; previous: number; change: number };
  };
  alerts: {
    type: 'warning' | 'info' | 'success' | 'error';
    message: string;
    priority: 'low' | 'medium' | 'high';
    timestamp: string;
  }[];
  timestamp: string;
}

export async function GET() {
  try {
    // Simüle edilmiş insights verileri
    const insightsData: InsightsData = {
      priceStatus: {
        current: 28.50,
        trend: 'up',
        changePercentage: 5.2,
        competitorComparison: 102, // %2 daha yüksek
        recommendation: "Fiyatları rakiplere göre uyarlayın veya değer önermesini güçlendirin"
      },
      riskLevel: {
        overall: 'medium',
        score: 65,
        factors: [
          {
            name: "Malzeme Fiyat Volatilitesi",
            level: 'high',
            impact: 85,
            description: "Temel malzemelerde %15-20 fiyat dalgalanması"
          },
          {
            name: "Rekabet Yoğunluğu",
            level: 'medium',
            impact: 70,
            description: "Yakın bölgede 3 yeni rakip açılması"
          },
          {
            name: "Mevsimsel Talep",
            level: 'low',
            impact: 40,
            description: "Kış aylarında %10-15 talep azalması beklentisi"
          },
          {
            name: "Personel Devir Hızı",
            level: 'medium',
            impact: 60,
            description: "Aylık %8 personel değişim oranı"
          }
        ]
      },
      generalStatus: {
        performance: 87,
        satisfaction: 92,
        efficiency: 78,
        profitability: 83,
        summary: "Genel performans iyi seviyede. Müşteri memnuniyeti yüksek ancak operasyonel verimlilikte iyileştirme alanları mevcut."
      },
      trends: {
        revenue: { current: 125000, previous: 118000, change: 5.9 },
        customers: { current: 1250, previous: 1180, change: 5.9 },
        avgOrderValue: { current: 100, previous: 100, change: 0 },
        costs: { current: 75000, previous: 72000, change: 4.2 }
      },
      alerts: [
        {
          type: 'warning',
          message: 'Tavuk fiyatlarında %12 artış bekleniyor',
          priority: 'high',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 saat önce
        },
        {
          type: 'info',
          message: 'Yeni menü analizi tamamlandı',
          priority: 'medium',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 saat önce
        },
        {
          type: 'success',
          message: 'Müşteri memnuniyeti %92 seviyesinde',
          priority: 'low',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 saat önce
        },
        {
          type: 'error',
          message: 'API yanıt süresi normalin üzerinde',
          priority: 'medium',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 dakika önce
        }
      ],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: insightsData,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'İçgörü verilerini alırken hata oluştu',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
