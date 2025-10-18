import React, { useState } from 'react';

interface MenuAnalysisModalProps {
  acik: boolean;
  onKapat: () => void;
}

export default function MenuAnalysisModal({ acik, onKapat }: MenuAnalysisModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const analyzeMenu = async () => {
    if (!selectedFile) return;
    
    setAnalyzing(true);
    
    // Simülasyon - Gerçek AI analizi burada yapılacak
    setTimeout(() => {
      setAnalysisResult({
        menuItems: 24,
        avgPrice: 85.5,
        priceRange: { min: 12, max: 180 },
        categories: [
          { name: 'Ana Yemekler', count: 12, avgPrice: 95 },
          { name: 'Başlangıçlar', count: 8, avgPrice: 45 },
          { name: 'Tatlılar', count: 4, avgPrice: 35 }
        ],
        profitability: {
          score: 78,
          recommendations: [
            'Pizza fiyatları %15 artırılabilir',
            'Kâr marjı düşük ürünler gözden geçirilmeli',
            'Porsiyon maliyetleri optimize edilebilir'
          ]
        },
        trends: {
          popularItems: ['Margherita Pizza', 'Caesar Salad', 'Tiramisu'],
          seasonalRecommendations: ['Kış menüsü önerileri eklenebilir']
        }
      });
      setAnalyzing(false);
    }, 2000);
  };

  const uploadAreaStyles: React.CSSProperties = {
    border: '2px dashed rgba(59, 130, 246, 0.3)',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const analysisCardStyles: React.CSSProperties = {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px'
  };

  const buttonStyles: React.CSSProperties = {
    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  };

  if (!acik) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#1A1B23',
        borderRadius: '16px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            color: '#F1F5F9',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🧑‍🍳 Menü Analizi
          </h2>
          <button
            onClick={onKapat}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {!analysisResult ? (
            <div>
              <h3 style={{ color: '#F1F5F9', marginBottom: '16px' }}>
                Menü Dosyası Yükleyin
              </h3>
              
              <div
                style={uploadAreaStyles}
                onClick={() => document.getElementById('menu-file')?.click()}
              >
                <input
                  id="menu-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '48px', marginBottom: '16px', color: '#3B82F6' }}>
                  📄
                </div>
                <p style={{ color: '#F1F5F9', fontSize: '18px', margin: 0 }}>
                  {selectedFile ? selectedFile.name : 'PDF, JPG veya PNG dosyası seçin'}
                </p>
                <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '8px' }}>
                  Maksimum dosya boyutu: 10MB
                </p>
              </div>

              {selectedFile && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button
                    onClick={analyzeMenu}
                    disabled={analyzing}
                    style={{
                      ...buttonStyles,
                      opacity: analyzing ? 0.7 : 1,
                      cursor: analyzing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {analyzing ? '🔄 Analiz Ediliyor...' : '🚀 Analizi Başlat'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={analysisCardStyles}>
                <h3 style={{ color: '#3B82F6', marginBottom: '16px' }}>
                  📊 Genel Özet
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F1F5F9' }}>
                      {analysisResult.menuItems}
                    </div>
                    <div style={{ color: '#94A3B8' }}>Menü Öğesi</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F1F5F9' }}>
                      ₺{analysisResult.avgPrice}
                    </div>
                    <div style={{ color: '#94A3B8' }}>Ortalama Fiyat</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>
                      %{analysisResult.profitability.score}
                    </div>
                    <div style={{ color: '#94A3B8' }}>Kârlılık Skoru</div>
                  </div>
                </div>
              </div>

              <div style={analysisCardStyles}>
                <h3 style={{ color: '#3B82F6', marginBottom: '16px' }}>
                  🏷️ Kategori Analizi
                </h3>
                {analysisResult.categories.map((cat: any, index: number) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: index < analysisResult.categories.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                  }}>
                    <span style={{ color: '#F1F5F9' }}>{cat.name}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#F1F5F9', fontWeight: 'bold' }}>
                        {cat.count} öğe
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '14px' }}>
                        Ort. ₺{cat.avgPrice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={analysisCardStyles}>
                <h3 style={{ color: '#3B82F6', marginBottom: '16px' }}>
                  💡 AI Önerileri
                </h3>
                {analysisResult.profitability.recommendations.map((rec: string, index: number) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ color: '#10B981', fontSize: '18px' }}>✓</span>
                    <span style={{ color: '#F1F5F9' }}>{rec}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button
                  onClick={() => {
                    setAnalysisResult(null);
                    setSelectedFile(null);
                  }}
                  style={buttonStyles}
                >
                  🔄 Yeni Analiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
