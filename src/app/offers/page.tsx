"use client";

import React, { useEffect, useState } from 'react';
import { HealthBadge, OfferHealthSummary } from '@/components/ui/HealthBadge';
import { useADTExplanation, ADTExplanationData, createExampleADTData } from '@/lib/adt-explanation';

interface Offer {
  id: string;
  tenderId: string;
  simulationId: string;
  itemsTotal: number;
  createdAt: string;
  metadata?: {
    kik_analysis?: {
      explanation_required: boolean;
      risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
      adt_threshold: number;
    };
  };
}

interface OfferHealthInfo {
  pt_consistent: boolean;
  inconsistent_offers?: Array<{
    offerId: string;
    delta: string;
    advice: string;
  }>;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [health, setHealth] = useState<OfferHealthInfo>({ pt_consistent: true });
  const [loading, setLoading] = useState(true);
  const { downloadPDF } = useADTExplanation();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers');
      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
        setHealth(data.health || { pt_consistent: true });
      } else {
        console.error('Failed to fetch offers');
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadADT = async (offer: Offer) => {
    const adtData: ADTExplanationData = {
      ...createExampleADTData(),
      tenderCode: offer.tenderId,
      offerAmount: offer.itemsTotal,
      adtThreshold: offer.metadata?.kik_analysis?.adt_threshold || 500000,
      riskLevel: offer.metadata?.kik_analysis?.risk_level || 'MEDIUM'
    };

    await downloadPDF(adtData, `ADT-${offer.tenderId}-${offer.id}.pdf`);
  };

  const handleRecalcPT = async () => {
    try {
      const response = await fetch('/api/offers/recalc', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: false }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ PT Recalc tamamlandı!\n${result.data.message}\n\nDetaylar:\nİşlenen: ${result.data.summary.processed}\nGüncellenen: ${result.data.summary.recalculated}\nAtlanan: ${result.data.summary.skipped}`);
        
        // Refresh offers list
        await fetchOffers();
      } else {
        const error = await response.json();
        alert(`❌ PT Recalc hatası: ${error.message}`);
      }
    } catch (error) {
      console.error('Recalc error:', error);
      alert('❌ PT Recalc sırasında hata oluştu');
    }
  };

  const getOfferPTStatus = (offerId: string) => {
    const inconsistent = health.inconsistent_offers?.find(io => io.offerId === offerId);
    return {
      consistent: !inconsistent,
      delta: inconsistent?.delta
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Teklifler</h1>
        <p className="text-gray-600">Sistem sağlığı ve teklif durumları</p>
      </div>

      {/* Health Summary */}
      <OfferHealthSummary health={health} offers={offers} />

      {/* Offers List */}
      <div className="space-y-4">
        {offers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">Henüz teklif bulunmuyor</div>
            <p className="text-gray-400">İlk teklifinizi oluşturmak için API&apos;yi kullanın</p>
          </div>
        ) : (
          offers.map((offer) => {
            const ptStatus = getOfferPTStatus(offer.id);
            const kikAnalysis = offer.metadata?.kik_analysis;
            
            return (
              <div key={offer.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      İhale: {offer.tenderId}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Simülasyon: {offer.simulationId} • {new Date(offer.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <HealthBadge
                      ptConsistent={ptStatus.consistent}
                      explanationRequired={kikAnalysis?.explanation_required || false}
                      riskLevel={kikAnalysis?.risk_level || 'LOW'}
                      delta={ptStatus.delta}
                    />
                    
                    {kikAnalysis?.explanation_required && (
                      <button
                        onClick={() => handleDownloadADT(offer)}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium hover:bg-yellow-200 transition-colors"
                      >
                        📄 ADT İndir
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Teklif Tutarı:</span>
                    <div className="font-semibold text-lg">
                      {offer.itemsTotal.toLocaleString('tr-TR')} TRY
                    </div>
                  </div>
                  
                  {kikAnalysis && (
                    <div>
                      <span className="text-gray-600">ADT Eşiği:</span>
                      <div className="font-semibold">
                        {kikAnalysis.adt_threshold.toLocaleString('tr-TR')} TRY
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-600">Durum:</span>
                    <div className="font-semibold">
                      {ptStatus.consistent && !kikAnalysis?.explanation_required ? (
                        <span className="text-green-600">✅ Uyumlu</span>
                      ) : (
                        <span className="text-yellow-600">🔸 İnceleme Gerekli</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* PT Mismatch Warning */}
                {!ptStatus.consistent && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <span className="text-red-600 mr-2">⚠️</span>
                      <div>
                        <div className="text-red-800 font-medium">PT Hesaplama Uyumsuzluğu</div>
                        <div className="text-red-600 text-sm">
                          Fark: {ptStatus.delta} TRY - /api/offers/auto ile yeniden hesaplama önerilir
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADT Warning */}
                {kikAnalysis?.explanation_required && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-yellow-600 mr-2">🔸</span>
                        <div>
                          <div className="text-yellow-800 font-medium">ADT Açıklama Gerekli</div>
                          <div className="text-yellow-600 text-sm">
                            Risk seviyesi: {kikAnalysis.risk_level} - KİK mevzuatı gereği açıklama dosyası hazırlanmalı
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDownloadADT(offer)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
                      >
                        PDF Oluştur
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex space-x-4">
        <button
          onClick={fetchOffers}
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          🔄 Listeyi Yenile
        </button>
        
        <button
          onClick={handleRecalcPT}
          className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
        >
          🔧 PT Hesaplamaları Onar
        </button>
      </div>
    </div>
  );
}