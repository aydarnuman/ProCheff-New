import React from 'react';

interface HealthBadgeProps {
  ptConsistent: boolean;
  explanationRequired: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  delta?: string;
  className?: string;
}

// Tek kaynaklı karar tablosu
type HealthStatus = 'GREEN' | 'YELLOW' | 'RED';

interface HealthDecision {
  status: HealthStatus;
  color: string;
  icon: string;
  text: string;
  ariaLabel: string;
  tooltip: string;
  action?: 'PDF_DOWNLOAD' | 'PT_RECALCULATE' | 'NONE';
}

const getHealthDecision = (
  ptConsistent: boolean, 
  explanationRequired: boolean, 
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  delta?: string
): HealthDecision => {
  // Karar tablosu - öncelik sırası önemli
  if (!ptConsistent) {
    return {
      status: 'RED',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '⚠️',
      text: `PT Mismatch ${delta ? `(Δ ${delta} TRY)` : ''}`,
      ariaLabel: 'Proje toplamı uyumsuz - acil düzeltme gerekli',
      tooltip: 'Proje Toplamı uyumsuz - itemsData\'dan yeniden hesaplama önerilir',
      action: 'PT_RECALCULATE'
    };
  }
  
  if (explanationRequired) {
    return {
      status: 'YELLOW',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '🔸',
      text: `ADT Gerekli (${riskLevel} Risk)`,
      ariaLabel: 'ADT açıklama gerekli - PDF oluşturulmalı',
      tooltip: 'KİK ADT eşiği altında - açıklama gerekli',
      action: 'PDF_DOWNLOAD'
    };
  }
  
  // Her şey yolunda
  return {
    status: 'GREEN',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅',
    text: `Uyumlu (${riskLevel} Risk)`,
    ariaLabel: 'Teklif uyumlu - herhangi bir eylem gerekmiyor',
    tooltip: `Teklif tam uyumlu - Risk seviyesi: ${riskLevel}`,
    action: 'NONE'
  };
};

export const HealthBadge: React.FC<HealthBadgeProps> = ({
  ptConsistent,
  explanationRequired,
  riskLevel,
  delta,
  className = ''
}) => {
  const decision = getHealthDecision(ptConsistent, explanationRequired, riskLevel, delta);

  return (
    <div 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${decision.color} ${className}`}
      title={decision.tooltip}
      aria-label={decision.ariaLabel}
      role="status"
    >
      <span className="mr-1" aria-hidden="true">{decision.icon}</span>
      <span>{decision.text}</span>
    </div>
  );
};

interface OfferHealthSummaryProps {
  health: {
    pt_consistent: boolean;
    inconsistent_offers?: Array<{
      offerId: string;
      delta: string;
      advice: string;
    }>;
  };
  offers: Array<{
    id: string;
    metadata?: {
      kik_analysis?: {
        explanation_required: boolean;
        risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
      };
    };
  }>;
}

export const OfferHealthSummary: React.FC<OfferHealthSummaryProps> = ({
  health,
  offers
}) => {
  const totalOffers = offers.length;
  const inconsistentCount = health.inconsistent_offers?.length || 0;
  const consistentCount = totalOffers - inconsistentCount;
  
  const adtRequiredCount = offers.filter(offer => 
    offer.metadata?.kik_analysis?.explanation_required
  ).length;

  const consistencyRate = totalOffers > 0 ? (consistentCount / totalOffers * 100).toFixed(1) : '100';
  const complianceRate = totalOffers > 0 ? ((totalOffers - adtRequiredCount) / totalOffers * 100).toFixed(1) : '100';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Sistem Sağlığı</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PT Consistency */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{consistencyRate}%</div>
          <div className="text-sm text-gray-600">PT Tutarlılığı</div>
          <div className="mt-1">
            {health.pt_consistent ? (
              <span className="text-green-600 text-xs">✅ Tüm hesaplamalar tutarlı</span>
            ) : (
              <span className="text-red-600 text-xs">⚠️ {inconsistentCount} teklif uyumsuz</span>
            )}
          </div>
        </div>

        {/* KİK Compliance */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{complianceRate}%</div>
          <div className="text-sm text-gray-600">KİK Uyumluluk</div>
          <div className="mt-1">
            {adtRequiredCount === 0 ? (
              <span className="text-green-600 text-xs">✅ ADT sorunu yok</span>
            ) : (
              <span className="text-yellow-600 text-xs">🔸 {adtRequiredCount} ADT açıklama gerekli</span>
            )}
          </div>
        </div>

        {/* Total Health Score */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {((parseFloat(consistencyRate) + parseFloat(complianceRate)) / 2).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Genel Skor</div>
          <div className="mt-1">
            <HealthBadge 
              ptConsistent={health.pt_consistent}
              explanationRequired={adtRequiredCount > 0}
              riskLevel="LOW"
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Action Items */}
      {(!health.pt_consistent || adtRequiredCount > 0) && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Önerilen Aksiyonlar:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {!health.pt_consistent && (
              <li>• PT uyumsuz teklifleri /api/offers/auto ile yeniden hesaplayın</li>
            )}
            {adtRequiredCount > 0 && (
              <li>• {adtRequiredCount} teklif için ADT açıklama PDF&apos;i hazırlayın</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HealthBadge;