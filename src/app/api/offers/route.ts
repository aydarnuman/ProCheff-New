import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface OfferData {
  id: string;
  customerName: string;
  projectName: string;
  totalCost: number;
  estimatedRevenue: number;
  profitMargin: number;
  status: 'pending' | 'approved' | 'rejected' | 'in-review';
  createdAt: string;
  deadline: string;
  items: {
    name: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  performance: {
    costAccuracy: number;
    timeToComplete: number;
    clientSatisfaction: number;
  };
}

interface OffersResponse {
  offers: OfferData[];
  summary: {
    totalOffers: number;
    winRate: number;
    averageValue: number;
    totalRevenue: number;
    monthlyGrowth: number;
  };
  performance: {
    avgCostAccuracy: number;
    avgDeliveryTime: number;
    clientRetention: number;
  };
  timestamp: string;
}

export async function GET() {
  try {
    // Simüle edilmiş teklif verileri
    const offersData: OffersResponse = {
      offers: [
        {
          id: "TKF-2025-001",
          customerName: "Bistro Lokanta",
          projectName: "Haftalık Menü Planlaması",
          totalCost: 15000,
          estimatedRevenue: 22500,
          profitMargin: 50,
          status: "approved",
          createdAt: "2025-10-15T10:30:00Z",
          deadline: "2025-10-25T18:00:00Z",
          items: [
            { name: "Menü Analizi", quantity: 1, unitCost: 5000, totalCost: 5000 },
            { name: "Maliyet Optimizasyonu", quantity: 1, unitCost: 4000, totalCost: 4000 },
            { name: "Beslenme Danışmanlığı", quantity: 1, unitCost: 3000, totalCost: 3000 },
            { name: "Personel Eğitimi", quantity: 1, unitCost: 3000, totalCost: 3000 }
          ],
          performance: {
            costAccuracy: 94,
            timeToComplete: 8,
            clientSatisfaction: 4.8
          }
        },
        {
          id: "TKF-2025-002",
          customerName: "Gourmet Restaurant",
          projectName: "AI Destekli Menü Geliştirme",
          totalCost: 28000,
          estimatedRevenue: 35000,
          profitMargin: 25,
          status: "in-review",
          createdAt: "2025-10-16T14:20:00Z",
          deadline: "2025-11-01T17:00:00Z",
          items: [
            { name: "Tam Menü Yeniden Tasarımı", quantity: 1, unitCost: 12000, totalCost: 12000 },
            { name: "AI Analiz Sistemi", quantity: 1, unitCost: 8000, totalCost: 8000 },
            { name: "Fiyatlandırma Stratejisi", quantity: 1, unitCost: 5000, totalCost: 5000 },
            { name: "Sürekli Destek (3 ay)", quantity: 1, unitCost: 3000, totalCost: 3000 }
          ],
          performance: {
            costAccuracy: 0, // Henüz tamamlanmadı
            timeToComplete: 0,
            clientSatisfaction: 0
          }
        },
        {
          id: "TKF-2025-003",
          customerName: "Cafe Luna",
          projectName: "Kahvaltı Menüsü Optimizasyonu",
          totalCost: 8500,
          estimatedRevenue: 12000,
          profitMargin: 41,
          status: "pending",
          createdAt: "2025-10-17T09:15:00Z",
          deadline: "2025-10-30T16:00:00Z",
          items: [
            { name: "Kahvaltı Menü Analizi", quantity: 1, unitCost: 3500, totalCost: 3500 },
            { name: "Malzeme Tedarik Optimizasyonu", quantity: 1, unitCost: 3000, totalCost: 3000 },
            { name: "Fiyat Rekabetçilik Analizi", quantity: 1, unitCost: 2000, totalCost: 2000 }
          ],
          performance: {
            costAccuracy: 0,
            timeToComplete: 0,
            clientSatisfaction: 0
          }
        },
        {
          id: "TKF-2025-004",
          customerName: "Fast Food Chain",
          projectName: "Franchise Menü Standardizasyonu",
          totalCost: 45000,
          estimatedRevenue: 50000,
          profitMargin: 11,
          status: "rejected",
          createdAt: "2025-10-12T11:45:00Z",
          deadline: "2025-11-15T20:00:00Z",
          items: [
            { name: "Franchise Menü Sistemi", quantity: 1, unitCost: 25000, totalCost: 25000 },
            { name: "Standardizasyon Protokolleri", quantity: 1, unitCost: 15000, totalCost: 15000 },
            { name: "Eğitim ve İmplementasyon", quantity: 1, unitCost: 5000, totalCost: 5000 }
          ],
          performance: {
            costAccuracy: 0,
            timeToComplete: 0,
            clientSatisfaction: 0
          }
        }
      ],
      summary: {
        totalOffers: 4,
        winRate: 25, // %25 (1 approved / 4 total)
        averageValue: 24125,
        totalRevenue: 22500, // Sadece onaylanan tekliflerden
        monthlyGrowth: 12.5
      },
      performance: {
        avgCostAccuracy: 94, // Sadece tamamlanan projelerden
        avgDeliveryTime: 8, // gün
        clientRetention: 85 // %85
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: offersData,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Offers API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Teklif verilerini alırken hata oluştu',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
