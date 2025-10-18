'use client';

import React, { useState } from 'react';

type TabType = 'analiz' | 'kik' | 'teklif' | 'rapor';

export default function IhaleMerkezi() {
  const [activeTab, setActiveTab] = useState<TabType>('analiz');
  
  // Şartname Analizi State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // KİK Analizi State
  const [kikData, setKikData] = useState({
    laborCost: '',
    materialCost: '',
    overheadRate: '15',
    profitRate: '10'
  });
  const [kikResult, setKikResult] = useState<any>(null);

  // Teklif State
  const [offerData, setOfferData] = useState({
    basePrice: '',
    discountRate: '',
    validityDays: '30'
  });
  const [offerResult, setOfferResult] = useState<any>(null);

  const tabs = [
    { id: 'analiz' as TabType, label: 'Şartname Analizi', icon: '📄' },
    { id: 'kik' as TabType, label: 'KİK Hesaplama', icon: '⚖️' },
    { id: 'teklif' as TabType, label: 'Teklif Oluşturma', icon: '💰' },
    { id: 'rapor' as TabType, label: 'Raporlama', icon: '📊' }
  ];

  // Handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setAnalysisResult(null);
    }
  };

  const analyzeDocument = async () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      setAnalysisResult({
        institution: "Ankara Büyükşehir Belediyesi",
        tenderType: "Açık İhale",
        estimatedValue: "₺2.450.000",
        deadline: "2024-04-15",
        requirements: [
          "Hijyen sertifikası zorunlu",
          "ISO 22000 belgelendirmesi",
          "5 yıl tecrübe şartı",
          "Referans projeler gerekli"
        ],
        strategy: "Kalite odaklı teklif hazırlayın. Bu kurum detaylı teknik şartname bekler."
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const calculateKik = () => {
    const labor = parseFloat(kikData.laborCost) || 0;
    const material = parseFloat(kikData.materialCost) || 0;
    const overhead = parseFloat(kikData.overheadRate) || 15;
    const profit = parseFloat(kikData.profitRate) || 10;
    
    const baseTotal = labor + material;
    const overheadAmount = (baseTotal * overhead) / 100;
    const subtotal = baseTotal + overheadAmount;
    const profitAmount = (subtotal * profit) / 100;
    const finalTotal = subtotal + profitAmount;
    
    setKikResult({
      baseTotal,
      overheadAmount,
      profitAmount,
      finalTotal
    });
  };

  const generateOffer = () => {
    const basePrice = parseFloat(offerData.basePrice) || 0;
    const discountRate = parseFloat(offerData.discountRate) || 0;
    const discountAmount = (basePrice * discountRate) / 100;
    const finalPrice = basePrice - discountAmount;
    
    setOfferResult({
      basePrice,
      discountAmount,
      finalPrice,
      validityDays: offerData.validityDays,
      createdAt: new Date().toLocaleDateString('tr-TR')
    });
  };

  // Render functions for each tab
  const renderAnalizTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      {/* Upload Section */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid rgba(71, 85, 105, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#F8FAFC', marginBottom: '16px' }}>
          📄 Şartname Dosyası Yükle
        </h3>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            borderRadius: '8px',
            color: '#F8FAFC',
            marginBottom: '24px'
          }}
        />
        
        {uploadedFile && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ color: '#22C55E', margin: 0 }}>
              ✅ {uploadedFile.name} yüklendi
            </p>
          </div>
        )}
        
        <button
          onClick={analyzeDocument}
          disabled={!uploadedFile || isAnalyzing}
          style={{
            width: '100%',
            padding: '16px',
            background: uploadedFile ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'rgba(71, 85, 105, 0.5)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: uploadedFile ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease'
          }}
        >
          {isAnalyzing ? '🔄 Analiz Ediliyor...' : '🔍 Şartnameyi Analiz Et'}
        </button>
      </div>

      {/* Results Section */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid rgba(71, 85, 105, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#F8FAFC', marginBottom: '16px' }}>
          📊 Analiz Sonuçları
        </h3>
        
        {analysisResult ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#F8FAFC' }}>Kurum:</strong>
              <p style={{ color: '#94A3B8', margin: '4px 0' }}>{analysisResult.institution}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#F8FAFC' }}>İhale Türü:</strong>
              <p style={{ color: '#94A3B8', margin: '4px 0' }}>{analysisResult.tenderType}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#F8FAFC' }}>Tahmini Değer:</strong>
              <p style={{ color: '#22C55E', margin: '4px 0', fontSize: '1.2rem', fontWeight: '600' }}>
                {analysisResult.estimatedValue}
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#F8FAFC' }}>Son Başvuru:</strong>
              <p style={{ color: '#F59E0B', margin: '4px 0' }}>{analysisResult.deadline}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#F8FAFC' }}>Gereksinimler:</strong>
              <ul style={{ color: '#94A3B8', margin: '8px 0', paddingLeft: '20px' }}>
                {analysisResult.requirements.map((req: string, index: number) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{req}</li>
                ))}
              </ul>
            </div>
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <strong style={{ color: '#3B82F6' }}>💡 Strateji Önerisi:</strong>
              <p style={{ color: '#94A3B8', margin: '8px 0 0 0' }}>{analysisResult.strategy}</p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748B', textAlign: 'center', marginTop: '40px' }}>
            Analiz sonuçları burada görünecek
          </p>
        )}
      </div>
    </div>
  );

  const renderKikTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      {/* KİK Input Form */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid rgba(71, 85, 105, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#F8FAFC', marginBottom: '24px' }}>
          ⚖️ KİK Hesaplama Formu
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#F8FAFC', display: 'block', marginBottom: '8px' }}>İşçilik Maliyeti (₺)</label>
          <input
            type="number"
            value={kikData.laborCost}
            onChange={(e) => setKikData({...kikData, laborCost: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '8px',
              color: '#F8FAFC'
            }}
            placeholder="0"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#F8FAFC', display: 'block', marginBottom: '8px' }}>Malzeme Maliyeti (₺)</label>
          <input
            type="number"
            value={kikData.materialCost}
            onChange={(e) => setKikData({...kikData, materialCost: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '8px',
              color: '#F8FAFC'
            }}
            placeholder="0"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#F8FAFC', display: 'block', marginBottom: '8px' }}>Genel Gider Oranı (%)</label>
          <input
            type="number"
            value={kikData.overheadRate}
            onChange={(e) => setKikData({...kikData, overheadRate: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '8px',
              color: '#F8FAFC'
            }}
            placeholder="15"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ color: '#F8FAFC', display: 'block', marginBottom: '8px' }}>Kar Oranı (%)</label>
          <input
            type="number"
            value={kikData.profitRate}
            onChange={(e) => setKikData({...kikData, profitRate: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '8px',
              color: '#F8FAFC'
            }}
            placeholder="10"
          />
        </div>

        <button
          onClick={calculateKik}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          🧮 KİK Hesapla
        </button>
      </div>

      {/* KİK Results */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid rgba(71, 85, 105, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#F8FAFC', marginBottom: '24px' }}>
          📊 KİK Hesaplama Sonuçları
        </h3>
        
        {kikResult ? (
          <div>
            <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#F8FAFC' }}>Temel Maliyet:</span>
                <span style={{ color: '#3B82F6', fontWeight: '600' }}>₺{kikResult.baseTotal.toLocaleString('tr-TR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#F8FAFC' }}>Genel Giderler:</span>
                <span style={{ color: '#F59E0B', fontWeight: '600' }}>₺{kikResult.overheadAmount.toLocaleString('tr-TR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#F8FAFC' }}>Kar Payı:</span>
                <span style={{ color: '#10B981', fontWeight: '600' }}>₺{kikResult.profitAmount.toLocaleString('tr-TR')}</span>
              </div>
              <hr style={{ border: '1px solid rgba(71, 85, 105, 0.3)', margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#F8FAFC', fontSize: '1.2rem', fontWeight: '700' }}>Toplam KİK:</span>
                <span style={{ color: '#22C55E', fontSize: '1.4rem', fontWeight: '700' }}>₺{kikResult.finalTotal.toLocaleString('tr-TR')}</span>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748B', textAlign: 'center', marginTop: '40px' }}>
            KİK hesaplama sonuçları burada görünecek
          </p>
        )}
      </div>
    </div>
  );

  const renderTeklifTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      {/* Offer Form */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid rgba(71, 85, 105, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#F8FAFC', marginBottom: '24px' }}>
          💰 Teklif Oluşturma
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#F8FAFC', display: 'block', marginBottom: '8px' }}>Baz Fiyat (₺)</label>
          <input
            type="number"
            value={offerData.basePrice}
            onChange={(e) => setOfferData({...offerData, basePrice: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '8px',
              color: '#F8FAFC'
            }}
            placeholder="0"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#F8FAFC', display: 'block', marginBottom: '8px' }}>İndirim Oranı (%)</label>
          <input
            type="number"
            value={offerData.discountRate}
            onChange={(e) => setOfferData({...offerData, discountRate: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '8px',
              color: '#F8FAFC'
            }}
            placeholder="0"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ color: '#F8FAFC', display: 'block', marginBottom: '8px' }}>Geçerlilik Süresi (Gün)</label>
          <input
            type="number"
            value={offerData.validityDays}
            onChange={(e) => setOfferData({...offerData, validityDays: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '8px',
              color: '#F8FAFC'
            }}
            placeholder="30"
          />
        </div>

        <button
          onClick={generateOffer}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          📋 Teklif Oluştur
        </button>
      </div>

      {/* Offer Results */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid rgba(71, 85, 105, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#F8FAFC', marginBottom: '24px' }}>
          📄 Teklif Özeti
        </h3>
        
        {offerResult ? (
          <div>
            <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#F8FAFC' }}>Baz Fiyat:</span>
                <span style={{ color: '#F59E0B', fontWeight: '600' }}>₺{offerResult.basePrice.toLocaleString('tr-TR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#F8FAFC' }}>İndirim Tutarı:</span>
                <span style={{ color: '#EF4444', fontWeight: '600' }}>-₺{offerResult.discountAmount.toLocaleString('tr-TR')}</span>
              </div>
              <hr style={{ border: '1px solid rgba(71, 85, 105, 0.3)', margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: '#F8FAFC', fontSize: '1.2rem', fontWeight: '700' }}>Net Teklif Fiyatı:</span>
                <span style={{ color: '#22C55E', fontSize: '1.4rem', fontWeight: '700' }}>₺{offerResult.finalPrice.toLocaleString('tr-TR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#F8FAFC' }}>Geçerlilik Süresi:</span>
                <span style={{ color: '#94A3B8' }}>{offerResult.validityDays} gün</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#F8FAFC' }}>Oluşturulma Tarihi:</span>
                <span style={{ color: '#94A3B8' }}>{offerResult.createdAt}</span>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748B', textAlign: 'center', marginTop: '40px' }}>
            Teklif özeti burada görünecek
          </p>
        )}
      </div>
    </div>
  );

  const renderRaporTab = () => (
    <div style={{
      background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid rgba(71, 85, 105, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
    }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#F8FAFC', marginBottom: '24px' }}>
        📊 İhale Süreç Raporları
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <h4 style={{ color: '#3B82F6', marginBottom: '12px' }}>📈 Analiz Raporu</h4>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Şartname analizi ve gereksinim değerlendirmesi</p>
          <button style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#3B82F6',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            📥 Rapor İndir
          </button>
        </div>

        <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <h4 style={{ color: '#10B981', marginBottom: '12px' }}>💹 KİK Raporu</h4>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Maliyet analizi ve karlılık hesaplamaları</p>
          <button style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10B981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            📥 Rapor İndir
          </button>
        </div>

        <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <h4 style={{ color: '#F59E0B', marginBottom: '12px' }}>📋 Teklif Raporu</h4>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Final teklif ve fiyatlandırma detayları</p>
          <button style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#F59E0B',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            📥 Rapor İndir
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ flex: '1', padding: '32px', overflowY: 'auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#F8FAFC',
          marginBottom: '8px'
        }}>
          🏛️ İhale Merkezi
        </h2>
        <p style={{
          color: '#94A3B8',
          fontSize: '1.1rem'
        }}>
          Birleşik ihale yönetim merkezi - Analiz, hesaplama, teklif ve raporlama
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '32px',
        borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
        paddingBottom: '16px'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              background: activeTab === tab.id 
                ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' 
                : 'rgba(30, 41, 59, 0.6)',
              color: activeTab === tab.id ? '#FFFFFF' : '#94A3B8',
              border: activeTab === tab.id 
                ? '1px solid rgba(59, 130, 246, 0.5)' 
                : '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'analiz' && renderAnalizTab()}
        {activeTab === 'kik' && renderKikTab()}
        {activeTab === 'teklif' && renderTeklifTab()}
        {activeTab === 'rapor' && renderRaporTab()}
      </div>
    </div>
  );
}
