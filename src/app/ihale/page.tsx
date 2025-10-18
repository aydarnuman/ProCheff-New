'use client';

import React, { useState } from 'react';

export default function IhaleMerkezi() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
          Şartname analizi ve ihale stratejisi geliştirme merkezi
        </p>
      </div>
      
      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px'
      }}>
        {/* Upload Section */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#F8FAFC',
              marginBottom: '8px'
            }}>
              📄 Şartname Dosyası Yükle
            </h3>
            <p style={{
              color: '#94A3B8',
              fontSize: '0.9rem'
            }}>
              İhale şartnamesini yükleyerek AI destekli analiz başlatın
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#CBD5E1',
                marginBottom: '8px'
              }}>
                Dosya Seç (PDF/Word)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(71, 85, 105, 0.4)',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#CBD5E1',
                marginBottom: '8px'
              }}>
                Kurum Türü
              </label>
              <select style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(71, 85, 105, 0.4)',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '0.95rem',
                outline: 'none'
              }}>
                <option>Belediye</option>
                <option>Üniversite</option>
                <option>Hastane</option>
                <option>Okul</option>
                <option>Kamu Kurumu</option>
                <option>Diğer</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#CBD5E1',
                marginBottom: '8px'
              }}>
                Analiz Türü
              </label>
              <select style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(71, 85, 105, 0.4)',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '0.95rem',
                outline: 'none'
              }}>
                <option>Tam Analiz</option>
                <option>Kurum Profili Çıkarımı</option>
                <option>Fiyat Analizi</option>
                <option>Teknik Şartlar</option>
              </select>
            </div>

            <button
              onClick={analyzeDocument}
              disabled={!uploadedFile || isAnalyzing}
              style={{
                width: '100%',
                background: uploadedFile && !isAnalyzing 
                  ? 'linear-gradient(135deg, #10B981, #3B82F6)' 
                  : 'linear-gradient(135deg, #64748B, #475569)',
                color: 'white',
                fontWeight: '600',
                padding: '16px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: uploadedFile && !isAnalyzing ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                fontSize: '1rem'
              }}
            >
              {isAnalyzing ? '🔄 Analiz Ediliyor...' : '🚀 Analizi Başlat'}
            </button>
          </div>
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
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#F8FAFC',
              marginBottom: '8px'
            }}>
              🤖 AI Analiz Sonuçları
            </h2>
            <p style={{
              color: '#94A3B8',
              fontSize: '0.9rem'
            }}>
              Şartname analizi ve strateji önerileri
            </p>
          </div>

          {analysisResult ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h4 style={{
                  color: '#10B981',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  📋 Kurum Bilgileri
                </h4>
                <p style={{ color: '#CBD5E1', marginBottom: '4px' }}>
                  <strong>Kurum:</strong> {analysisResult.institution}
                </p>
                <p style={{ color: '#CBD5E1', marginBottom: '4px' }}>
                  <strong>İhale Türü:</strong> {analysisResult.tenderType}
                </p>
                <p style={{ color: '#CBD5E1', marginBottom: '4px' }}>
                  <strong>Tahmini Değer:</strong> {analysisResult.estimatedValue}
                </p>
                <p style={{ color: '#CBD5E1' }}>
                  <strong>Son Teslim:</strong> {analysisResult.deadline}
                </p>
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h4 style={{
                  color: '#3B82F6',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  ✅ Gereksinimler
                </h4>
                <ul style={{ color: '#CBD5E1', paddingLeft: '20px' }}>
                  {analysisResult.requirements.map((req: string, index: number) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{req}</li>
                  ))}
                </ul>
              </div>

              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h4 style={{
                  color: '#8B5CF6',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  🎯 Strateji Önerisi
                </h4>
                <p style={{ color: '#CBD5E1', lineHeight: '1.6' }}>
                  {analysisResult.strategy}
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '48px 0'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '16px'
              }}>
                📋
              </div>
              <p style={{
                color: '#94A3B8',
                marginBottom: '8px'
              }}>
                Analiz sonuçları burada görünecek
              </p>
              <p style={{
                color: '#64748B',
                fontSize: '0.875rem'
              }}>
                Önce şartname dosyası yükleyin ve analizi başlatın
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
