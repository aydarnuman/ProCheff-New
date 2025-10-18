'use client';

import MarketDataModal from '@/components/analysis/MarketDataModal';
import MenuAnalysisModal from '@/components/analysis/MenuAnalysisModal';
import SystemHealthModal from '@/components/analysis/SystemHealthModal';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';

export default function HomePage() {
  // FeatureCard komponentini HomePage içinde tanımlayalım
  const FeatureCard = ({ children, baslik, aciklama, ikon, onClick, varyant = 'varsayilan' }: any) => {
    const varyantStilleri: any = {
      varsayilan: { 
        background: 'linear-gradient(145deg, rgba(37, 41, 54, 0.95), rgba(30, 33, 43, 0.85))', 
        borderColor: 'rgba(71, 85, 105, 0.3)',
        shadowColor: 'rgba(0, 0, 0, 0.15)'
      },
      vurgu: { 
        background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.08))', 
        borderColor: 'rgba(16, 185, 129, 0.35)',
        shadowColor: 'rgba(16, 185, 129, 0.15)'
      },
      uyari: { 
        background: 'linear-gradient(145deg, rgba(251, 146, 60, 0.12), rgba(249, 115, 22, 0.08))', 
        borderColor: 'rgba(251, 146, 60, 0.35)',
        shadowColor: 'rgba(251, 146, 60, 0.15)'
      }
    };

    return (
      <div 
        style={{
          background: varyantStilleri[varyant].background,
          border: `1px solid ${varyantStilleri[varyant].borderColor}`,
          borderRadius: '16px',
          padding: '28px 24px',
          textAlign: 'center',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: onClick ? 'pointer' : 'default',
          boxShadow: `0 4px 20px ${varyantStilleri[varyant].shadowColor}, 0 1px 3px rgba(0, 0, 0, 0.05)`,
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
          e.currentTarget.style.boxShadow = `0 8px 32px ${varyantStilleri[varyant].shadowColor}, 0 4px 12px rgba(0, 0, 0, 0.1)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = `0 4px 20px ${varyantStilleri[varyant].shadowColor}, 0 1px 3px rgba(0, 0, 0, 0.05)`;
        }}
      >
        {/* Subtle background gradient overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.001) 100%)',
          borderRadius: '16px',
          pointerEvents: 'none'
        }} />
        
        {ikon && (
          <div style={{
            fontSize: '3.5rem', 
            marginBottom: '18px',
            lineHeight: '1',
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
            position: 'relative',
            zIndex: 1
          }}>
            {ikon}
          </div>
        )}
        
        {baslik && (
          <h2 style={{
            fontSize: '1.375rem', 
            fontWeight: '600', 
            marginBottom: '12px', 
            color: varyant === 'vurgu' ? '#10B981' : '#F8FAFC',
            lineHeight: '1.4',
            letterSpacing: '-0.02em',
            position: 'relative',
            zIndex: 1
          }}>
            {baslik}
          </h2>
        )}
        
        {aciklama && (
          <p style={{
            color: '#CBD5E1', 
            marginBottom: '20px',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            fontWeight: '400',
            opacity: 0.9,
            position: 'relative',
            zIndex: 1
          }}>
            {aciklama}
          </p>
        )}
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </div>
    );
  };

  const [modalAcik, setModalAcik] = useState(false);
  const [secilenOzellik, setSecilenOzellik] = useState('');
  const [aramaMetni, setAramaMetni] = useState('');
  const [aktifFiltre, setAktifFiltre] = useState('hepsi');
  
  // Gelişmiş arama özellikleri
  const [aramaGecmisi, setAramaGecmisi] = useState<string[]>([]);
  const [aramaTavsiyeAcik, setAramaTavsiyeAcik] = useState(false);
  const [sonArama, setSonArama] = useState('');
  
  // Modal states for each analysis type
  const [menuModalAcik, setMenuModalAcik] = useState(false);
  const [marketModalAcik, setMarketModalAcik] = useState(false);
  const [healthModalAcik, setHealthModalAcik] = useState(false);
  const [sistemDurumu, setSistemDurumu] = useState({
    menu: true,
    market: true,
    design: true,
    api: true // Başlangıçta sabit değer
  });
  const [metrikler, setMetrikler] = useState({
    kullanici: 25,
    yanit: 85,
    yuk: 20
  });

  // Client-side'da rastgele değerler oluştur
  useEffect(() => {
    setSistemDurumu(prev => ({
    ...prev,
    api: Math.random() > 0.3
  }));
  setMetrikler({
    kullanici: Math.floor(Math.random() * 50) + 10,
    yanit: Math.floor(Math.random() * 100) + 50,
    yuk: Math.floor(Math.random() * 30) + 15
  });
  
  // Arama geçmişini localStorage'dan yükle
  const kaydedilmisAramalar = localStorage.getItem('procheff-arama-gecmisi');
  if (kaydedilmisAramalar) {
    setAramaGecmisi(JSON.parse(kaydedilmisAramalar));
  }
  }, []);

  const ozellikleriGoster = (ozellik: string) => {
    switch (ozellik) {
      case 'menu':
        setMenuModalAcik(true);
        break;
      case 'market':
        setMarketModalAcik(true);
        break;
      case 'health':
        setHealthModalAcik(true);
        break;
      case 'dashboard':
        // Dashboard zaten ana sayfa - scroll to analytics
        document.getElementById('analytics-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'inventory':
        alert('📦 Stok Yönetimi: Malzeme envanter takip sistemi yakında aktif olacak!');
        break;
      case 'reports':
        alert('📋 Raporlar: Detaylı performans raporu modülü geliştiriliyor!');
        break;
      case 'notifications':
        alert('🔔 Bildirimler: Uyarı ve bildirim yönetim sistemi hazırlanıyor!');
        break;
      case 'settings':
        alert('⚙️ Ayarlar: Platform konfigürasyon paneli yakında!');
        break;
      default:
        break;
    }
  };

  const ozellikleriFiltrele = () => {
    const tumOzellikler = [
      { id: 'menu', baslik: 'Menü Analizi', kategori: 'analiz', ikon: '📊', aciklama: 'AI destekli menü değerlendirmesi', etiketler: ['yapay zeka', 'menü', 'analiz', 'kârlılık'] },
      { id: 'market', baslik: 'Piyasa Verileri', kategori: 'veri', ikon: '💰', aciklama: 'Gerçek zamanlı fiyat takibi', etiketler: ['piyasa', 'fiyat', 'trend', 'veri'] },
      { id: 'dashboard', baslik: 'Kontrol Paneli', kategori: 'analiz', ikon: '📈', aciklama: 'Kapsamlı iş analitikleri', etiketler: ['dashboard', 'analitik', 'rapor', 'metrik'] },
      { id: 'health', baslik: 'Sistem Sağlığı', kategori: 'sistem', ikon: '⚡', aciklama: 'API ve servis durumu', etiketler: ['sistem', 'api', 'performans', 'izleme'] },
      { id: 'inventory', baslik: 'Stok Yönetimi', kategori: 'veri', ikon: '📦', aciklama: 'Malzeme envanter takibi', etiketler: ['stok', 'envanter', 'malzeme', 'yönetim'] },
      { id: 'reports', baslik: 'Raporlar', kategori: 'analiz', ikon: '📋', aciklama: 'Detaylı performans raporları', etiketler: ['rapor', 'performans', 'excel', 'pdf'] },
      { id: 'notifications', baslik: 'Bildirimler', kategori: 'sistem', ikon: '🔔', aciklama: 'Uyarı ve bildirim yönetimi', etiketler: ['bildirim', 'uyarı', 'alert', 'sistem'] },
      { id: 'settings', baslik: 'Ayarlar', kategori: 'sistem', ikon: '⚙️', aciklama: 'Platform konfigürasyonu', etiketler: ['ayar', 'config', 'yapılandırma', 'sistem'] }
    ];

    return tumOzellikler.filter(ozellik => {
      // Boş arama tüm sonuçları göster
      if (!aramaMetni.trim()) {
        const filtreUyumu = aktifFiltre === 'hepsi' || ozellik.kategori === aktifFiltre;
        return filtreUyumu;
      }

      const aramaKelimesi = aramaMetni.toLowerCase().trim();
      
      // Başlık, açıklama ve etiketlerde arama yap
      const baslikUyumu = ozellik.baslik.toLowerCase().includes(aramaKelimesi);
      const aciklamaUyumu = ozellik.aciklama?.toLowerCase().includes(aramaKelimesi);
      const etiketUyumu = ozellik.etiketler?.some(etiket => 
        etiket.toLowerCase().includes(aramaKelimesi)
      );
      
      const aramaUyumu = baslikUyumu || aciklamaUyumu || etiketUyumu;
      const filtreUyumu = aktifFiltre === 'hepsi' || ozellik.kategori === aktifFiltre;
      
      return aramaUyumu && filtreUyumu;
    });
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1A1B23 100%)",
      color: "#F8FAFC", 
      minHeight: "100vh"
    }}>
      
      {/* Toolbar */}
      <nav style={{
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
        padding: "18px 32px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
      }}>
        <div style={{
          fontSize: "1.6rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #10B981, #3B82F6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.02em"
        }}>
          🧑‍🍳 ProCheff AI
        </div>
        
        <div style={{display: "flex", alignItems: "center", gap: "24px"}}>
          <div style={{
            color: "#10B981", 
            fontWeight: "600", 
            padding: "10px 18px", 
            borderRadius: "12px", 
            background: "linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))", 
            border: "1px solid rgba(16, 185, 129, 0.25)",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.1)"
          }}>
            🏠 Ana Sayfa
          </div>
          <div style={{
            color: "#CBD5E1", 
            cursor: "pointer", 
            padding: "10px 18px", 
            borderRadius: "12px",
            transition: "all 0.3s ease",
            fontSize: "0.95rem",
            fontWeight: "500"
          }}>
            📊 Menü Analizi
          </div>
          <div style={{
            color: "#CBD5E1", 
            cursor: "pointer", 
            padding: "10px 18px", 
            borderRadius: "12px",
            transition: "all 0.3s ease",
            fontSize: "0.95rem",
            fontWeight: "500"
          }}>
            💰 Piyasa
          </div>
          <div style={{
            color: "#CBD5E1", 
            cursor: "pointer", 
            padding: "10px 18px", 
            borderRadius: "12px",
            transition: "all 0.3s ease",
            fontSize: "0.95rem",
            fontWeight: "500"
          }}>
            ⚙️ Yönetim
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        paddingTop: "100px", 
        padding: "100px 32px 32px 32px",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        
        {/* Hero Section */}
        <div style={{textAlign: "center", marginBottom: "56px"}}>
          <h1 style={{
            fontSize: "clamp(2.5rem, 5vw, 3.5rem)", 
            fontWeight: "700", 
            marginBottom: "1.5rem",
            background: "linear-gradient(135deg, #10B981 0%, #3B82F6 50%, #8B5CF6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: "1.1",
            letterSpacing: "-0.025em"
          }}>
            🧑‍🍳 ProCheff AI Kontrol Paneli
          </h1>
          <p style={{
            fontSize: "1.3rem", 
            color: "#94A3B8",
            lineHeight: "1.6",
            maxWidth: "600px",
            margin: "0 auto",
            fontWeight: "400"
          }}>
            Yapay zeka destekli menü analizi ve fiyatlandırma paneli
          </p>
        </div>

        {/* Arama ve Filtre */}
        <div style={{
          background: "linear-gradient(145deg, rgba(37, 41, 54, 0.85), rgba(30, 33, 43, 0.75))",
          border: "1px solid rgba(71, 85, 105, 0.25)",
          borderRadius: "20px",
          padding: "32px",
          marginBottom: "40px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(12px)"
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>
            {/* Arama Kutusu */}
            <div style={{position: "relative"}}>
              <input
                type="text"
                placeholder="🔍 Özellik ara..."
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  background: "rgba(15, 23, 42, 0.7)",
                  color: "#F8FAFC",
                  fontSize: "1.05rem",
                  outline: "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  fontWeight: "400",
                  lineHeight: "1.5"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#10B981";
                  e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(148, 163, 184, 0.2)";
                  e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                }}
              />
            </div>

            {/* Filtre Butonları */}
            <div style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              alignItems: "center"
            }}>
              {[
                { id: 'hepsi', label: 'Hepsi', ikon: '🔍' },
                { id: 'analiz', label: 'Analiz', ikon: '📊' },
                { id: 'veri', label: 'Veri', ikon: '💾' },
                { id: 'sistem', label: 'Sistem', ikon: '⚙️' }
              ].map(filtre => (
                <button
                  key={filtre.id}
                  onClick={() => setAktifFiltre(filtre.id)}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "14px",
                    border: `1px solid ${aktifFiltre === filtre.id ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
                    background: aktifFiltre === filtre.id 
                      ? "linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))"
                      : "rgba(15, 23, 42, 0.3)",
                    color: aktifFiltre === filtre.id ? "#10B981" : "#CBD5E1",
                    fontSize: "0.95rem",
                    fontWeight: aktifFiltre === filtre.id ? "600" : "500",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: aktifFiltre === filtre.id 
                      ? "0 4px 12px rgba(16, 185, 129, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)"
                      : "0 2px 6px rgba(0, 0, 0, 0.05)",
                    letterSpacing: "-0.01em"
                  }}
                  onMouseEnter={(e) => {
                    if (aktifFiltre !== filtre.id) {
                      e.currentTarget.style.background = "rgba(148, 163, 184, 0.08)";
                      e.currentTarget.style.color = "#F8FAFC";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (aktifFiltre !== filtre.id) {
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.3)";
                      e.currentTarget.style.color = "#CBD5E1";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {filtre.ikon} {filtre.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Arama Sonuçları */}
          {(aramaMetni.trim() || aktifFiltre !== 'hepsi') && (
            <div style={{
              background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.08))',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              margin: '16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ color: '#3B82F6', fontSize: '16px' }}>🔍</span>
              <span style={{ color: '#F1F5F9', fontSize: '14px' }}>
                <strong>{ozellikleriFiltrele().length}</strong> sonuç bulundu
                {aramaMetni.trim() && <span> "{aramaMetni}" için</span>}
                {aktifFiltre !== 'hepsi' && <span> ({aktifFiltre} kategorisinde)</span>}
              </span>
              {(aramaMetni.trim() || aktifFiltre !== 'hepsi') && (
                <button
                  onClick={() => {
                    setAramaMetni('');
                    setAktifFiltre('hepsi');
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#EF4444',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginLeft: 'auto'
                  }}
                >
                  ✕ Temizle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div id="analytics-section" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "28px",
          marginBottom: "56px",
          padding: "0 4px"
        }}>
          
          {ozellikleriFiltrele().map(ozellik => {
            const renkler = {
              menu: { bg: '#10B981', variant: 'vurgu' as const },
              market: { bg: '#3B82F6', variant: 'varsayilan' as const },
              dashboard: { bg: '#8B5CF6', variant: 'varsayilan' as const },
              health: { bg: '#F97316', variant: 'uyari' as const },
              inventory: { bg: '#06B6D4', variant: 'varsayilan' as const },
              reports: { bg: '#84CC16', variant: 'vurgu' as const },
              notifications: { bg: '#F59E0B', variant: 'uyari' as const },
              settings: { bg: '#6B7280', variant: 'varsayilan' as const }
            };

            return (
              <FeatureCard
                key={ozellik.id}
                ikon={ozellik.ikon}
                baslik={ozellik.baslik}
                aciklama={ozellik.aciklama}
                varyant={renkler[ozellik.id as keyof typeof renkler]?.variant || 'varsayilan'}
                onClick={() => ozellikleriGoster(ozellik.id)}
              >
                <Button 
                  varyant="birincil" 
                  onClick={() => ozellikleriGoster(ozellik.id)}
                  style={{
                    background: renkler[ozellik.id as keyof typeof renkler]?.bg || '#10B981'
                  }}
                >
                  {ozellik.id === 'menu' ? 'Analiz Et' :
                   ozellik.id === 'market' ? 'Görüntüle' :
                   ozellik.id === 'dashboard' ? 'Paneli Aç' :
                   'Kontrol Et'} →
                </Button>
              </FeatureCard>
            );
          })}

          {ozellikleriFiltrele().length === 0 && (
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "64px 32px",
              color: "#94A3B8"
            }}>
              <div style={{
                fontSize: "4rem", 
                marginBottom: "1.5rem",
                filter: "grayscale(0.3) opacity(0.8)"
              }}>
                🔍
              </div>
              <h3 style={{
                fontSize: "1.5rem", 
                marginBottom: "12px",
                fontWeight: "600",
                color: "#CBD5E1"
              }}>
                Sonuç Bulunamadı
              </h3>
              <p style={{
                fontSize: "1.1rem",
                lineHeight: "1.6",
                maxWidth: "400px",
                margin: "0 auto"
              }}>
                "{aramaMetni}" araması için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.
              </p>
            </div>
          )}

        </div>

        {/* System Status */}
        <div style={{
          background: "linear-gradient(145deg, rgba(37, 41, 54, 0.9), rgba(30, 33, 43, 0.8))",
          border: "1px solid rgba(71, 85, 105, 0.25)",
          borderRadius: "20px",
          padding: "32px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(12px)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px"
          }}>
            <h2 style={{
              fontSize: "1.75rem", 
              fontWeight: "700",
              color: "#F8FAFC",
              letterSpacing: "-0.02em"
            }}>
              🔧 Sistem Durumu
            </h2>
            <button
              onClick={() => {
                setSistemDurumu(prev => ({
                  ...prev,
                  api: Math.random() > 0.3
                }));
                setMetrikler({
                  kullanici: Math.floor(Math.random() * 50) + 10,
                  yanit: Math.floor(Math.random() * 100) + 50,
                  yuk: Math.floor(Math.random() * 30) + 15
                });
              }}
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                background: "transparent",
                color: "#94A3B8",
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                e.currentTarget.style.color = "#10B981";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#94A3B8";
              }}
            >
              🔄 Yenile
            </button>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px"
          }}>
            {[
              { key: 'menu', label: 'Gelişmiş Menü Analizi', status: sistemDurumu.menu },
              { key: 'market', label: 'Piyasa Veri Toplayıcısı', status: sistemDurumu.market },
              { key: 'design', label: '🎨 Tasarım Sistemi v1.1.0', status: sistemDurumu.design },
              { key: 'api', label: 'API Servis Durumu', status: sistemDurumu.api }
            ].map(item => (
              <div key={item.key} style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <span>{item.label}</span>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  background: item.status ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  color: item.status ? "#10B981" : "#EF4444",
                  border: `1px solid ${item.status ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  animation: item.key === 'api' ? 'pulse 2s infinite' : 'none'
                }}>
                  {item.status ? '●' : '●'}
                </span>
              </div>
            ))}
          </div>

          {/* Gerçek Zamanlı Metrikler */}
          <div style={{
            marginTop: "32px",
            padding: "24px",
            background: "linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))",
            borderRadius: "16px",
            border: "1px solid rgba(71, 85, 105, 0.2)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{
              fontSize: "1.25rem", 
              fontWeight: "600", 
              marginBottom: "20px",
              color: "#F8FAFC",
              letterSpacing: "-0.01em"
            }}>
              📊 Gerçek Zamanlı Metrikler
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              fontSize: "0.95rem"
            }}>
              <div style={{
                padding: "12px 0",
                borderBottom: "1px solid rgba(71, 85, 105, 0.2)"
              }}>
                <span style={{
                  color: "#94A3B8",
                  display: "block",
                  fontSize: "0.85rem",
                  marginBottom: "4px"
                }}>
                  Aktif Kullanıcı:
                </span>
                <span style={{
                  color: "#10B981", 
                  fontWeight: "700", 
                  fontSize: "1.5rem",
                  lineHeight: "1"
                }}>
                  {metrikler.kullanici}
                </span>
              </div>
              <div style={{
                padding: "12px 0",
                borderBottom: "1px solid rgba(71, 85, 105, 0.2)"
              }}>
                <span style={{
                  color: "#94A3B8",
                  display: "block",
                  fontSize: "0.85rem",
                  marginBottom: "4px"
                }}>
                  API Yanıt:
                </span>
                <span style={{
                  color: "#3B82F6", 
                  fontWeight: "700", 
                  fontSize: "1.5rem",
                  lineHeight: "1"
                }}>
                  {metrikler.yanit}ms
                </span>
              </div>
              <div style={{
                padding: "12px 0",
                borderBottom: "1px solid rgba(71, 85, 105, 0.2)"
              }}>
                <span style={{
                  color: "#94A3B8",
                  display: "block",
                  fontSize: "0.85rem",
                  marginBottom: "4px"
                }}>
                  Sistem Yükü:
                </span>
                <span style={{
                  color: "#F59E0B", 
                  fontWeight: "700", 
                  fontSize: "1.5rem",
                  lineHeight: "1"
                }}>
                  %{metrikler.yuk}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Analysis Modals */}
      <MenuAnalysisModal 
        acik={menuModalAcik}
        onKapat={() => setMenuModalAcik(false)}
      />
      
      <MarketDataModal 
        acik={marketModalAcik}
        onKapat={() => setMarketModalAcik(false)}
      />
      
      <SystemHealthModal 
        acik={healthModalAcik}
        onKapat={() => setHealthModalAcik(false)}
      />
    </div>
  );
}
