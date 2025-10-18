'use client';

import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';

export default function HomePage() {
  // FeatureCard komponentini HomePage içinde tanımlayalım
  const FeatureCard = ({ children, baslik, aciklama, ikon, onClick, varyant = 'varsayilan' }: any) => {
    const varyantStilleri: any = {
      varsayilan: { background: 'rgba(35, 39, 47, 0.8)', borderColor: 'rgba(59, 130, 246, 0.2)' },
      vurgu: { background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' },
      uyari: { background: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.3)' }
    };

    return (
      <div 
        style={{
          ...varyantStilleri[varyant],
          border: `1px solid ${varyantStilleri[varyant].borderColor}`,
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          transition: 'transform 0.3s ease',
          cursor: onClick ? 'pointer' : 'default'
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {ikon && <div style={{fontSize: '3rem', marginBottom: '1rem'}}>{ikon}</div>}
        {baslik && <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: varyant === 'vurgu' ? '#10B981' : '#F1F5F9'}}>{baslik}</h2>}
        {aciklama && <p style={{color: '#F1F5F9', marginBottom: '24px'}}>{aciklama}</p>}
        {children}
      </div>
    );
  };

  const [modalAcik, setModalAcik] = useState(false);
  const [secilenOzellik, setSecilenOzellik] = useState('');
  const [aramaMetni, setAramaMetni] = useState('');
  const [aktifFiltre, setAktifFiltre] = useState('hepsi');
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
  }, []);

  const ozellikleriGoster = (ozellik: string) => {
    setSecilenOzellik(ozellik);
    setModalAcik(true);
    
    // Geçici alert sistemi
    const mesajlar = {
      menu: '📊 Menü Analizi: AI destekli otomatik analiz sistemi başlatılıyor...',
      market: '💰 Piyasa Verileri: Gerçek zamanlı fiyat takip sistemi açılıyor...',
      dashboard: '📈 Kontrol Paneli: Analitik dashboard yükleniyor...',
      health: '⚡ Sistem Sağlığı: API sağlık kontrolleri başlatılıyor...'
    };
    
    alert(mesajlar[ozellik as keyof typeof mesajlar] || 'Özellik yükleniyor...');
  };

  const ozellikleriFiltrele = () => {
    const tumOzellikler = [
      { id: 'menu', baslik: 'Menü Analizi', kategori: 'analiz', ikon: '📊' },
      { id: 'market', baslik: 'Piyasa Verileri', kategori: 'veri', ikon: '💰' },
      { id: 'dashboard', baslik: 'Kontrol Paneli', kategori: 'analiz', ikon: '📈' },
      { id: 'health', baslik: 'Sistem Sağlığı', kategori: 'sistem', ikon: '⚡' }
    ];

    return tumOzellikler.filter(ozellik => {
      const aramaUyumu = ozellik.baslik.toLowerCase().includes(aramaMetni.toLowerCase());
      const filtreUyumu = aktifFiltre === 'hepsi' || ozellik.kategori === aktifFiltre;
      return aramaUyumu && filtreUyumu;
    });
  };

  return (
    <div style={{background:"#1A1B23", color:"#F1F5F9", minHeight:"100vh"}}>
      
      {/* Toolbar */}
      <nav style={{
        background: "rgba(26, 27, 35, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "16px 24px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          background: "linear-gradient(135deg, #10B981, #3B82F6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          🧑‍🍳 ProCheff AI
        </div>
        
        <div style={{display: "flex", alignItems: "center", gap: "32px"}}>
          <div style={{color: "#10B981", fontWeight: "600", padding: "8px 16px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)"}}>🏠 Ana Sayfa</div>
          <div style={{color: "#94A3B8", cursor: "pointer", padding: "8px 16px", borderRadius: "8px"}}>📊 Menü Analizi</div>
          <div style={{color: "#94A3B8", cursor: "pointer", padding: "8px 16px", borderRadius: "8px"}}>💰 Piyasa</div>
          <div style={{color: "#94A3B8", cursor: "pointer", padding: "8px 16px", borderRadius: "8px"}}>⚙️ Yönetim</div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{paddingTop: "80px", padding: "80px 24px 24px 24px"}}>
        
        {/* Hero Section */}
        <div style={{textAlign: "center", marginBottom: "48px"}}>
          <h1 style={{
            fontSize: "3rem", 
            fontWeight: "700", 
            marginBottom: "1rem",
            background: "linear-gradient(135deg, #10B981, #3B82F6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            🧑‍🍳 ProCheff AI Kontrol Paneli
          </h1>
          <p style={{fontSize: "1.25rem", color: "#94A3B8"}}>
            Yapay zeka destekli menü analizi ve fiyatlandırma paneli
          </p>
        </div>

        {/* Arama ve Filtre */}
        <div style={{
          background: "rgba(35, 39, 47, 0.6)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "32px"
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px"
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
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  background: "rgba(26, 27, 35, 0.8)",
                  color: "#F1F5F9",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.3s ease"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#10B981";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(148, 163, 184, 0.3)";
                }}
              />
            </div>

            {/* Filtre Butonları */}
            <div style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap"
            }}>
              {[
                { id: 'hepsi', label: 'Hepsi' },
                { id: 'analiz', label: 'Analiz' },
                { id: 'veri', label: 'Veri' },
                { id: 'sistem', label: 'Sistem' }
              ].map(filtre => (
                <button
                  key={filtre.id}
                  onClick={() => setAktifFiltre(filtre.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: "1px solid rgba(148, 163, 184, 0.3)",
                    background: aktifFiltre === filtre.id ? "#10B981" : "transparent",
                    color: aktifFiltre === filtre.id ? "white" : "#94A3B8",
                    fontSize: "0.875rem",
                    fontWeight: aktifFiltre === filtre.id ? "600" : "400",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (aktifFiltre !== filtre.id) {
                      e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                      e.currentTarget.style.color = "#F1F5F9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (aktifFiltre !== filtre.id) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#94A3B8";
                    }
                  }}
                >
                  {filtre.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "48px"
        }}>
          
          {ozellikleriFiltrele().map(ozellik => {
            const renkler = {
              menu: { bg: '#10B981', variant: 'vurgu' as const },
              market: { bg: '#3B82F6', variant: 'varsayilan' as const },
              dashboard: { bg: '#8B5CF6', variant: 'varsayilan' as const },
              health: { bg: '#F97316', variant: 'uyari' as const }
            };

            return (
              <FeatureCard
                key={ozellik.id}
                ikon={ozellik.ikon}
                baslik={ozellik.baslik}
                aciklama={`${ozellik.kategori === 'analiz' ? 'AI destekli' : 
                           ozellik.kategori === 'veri' ? 'Gerçek zamanlı' : 
                           'Sistem'} ${ozellik.baslik.toLowerCase()}`}
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
              padding: "48px 24px",
              color: "#94A3B8"
            }}>
              <div style={{fontSize: "3rem", marginBottom: "1rem"}}>🔍</div>
              <h3 style={{fontSize: "1.25rem", marginBottom: "8px"}}>Sonuç Bulunamadı</h3>
              <p>"{aramaMetni}" araması için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.</p>
            </div>
          )}

        </div>

        {/* System Status */}
        <div style={{
          background: "rgba(35, 39, 47, 0.8)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "12px",
          padding: "24px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px"
          }}>
            <h2 style={{fontSize: "1.5rem", fontWeight: "bold"}}>
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
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(148, 163, 184, 0.3)",
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
            marginTop: "24px",
            padding: "16px",
            background: "rgba(26, 27, 35, 0.6)",
            borderRadius: "8px",
            border: "1px solid rgba(59, 130, 246, 0.1)"
          }}>
            <h3 style={{fontSize: "1rem", fontWeight: "600", marginBottom: "12px"}}>
              📊 Gerçek Zamanlı Metrikler
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              fontSize: "0.875rem"
            }}>
              <div>
                <span style={{color: "#94A3B8"}}>Aktif Kullanıcı:</span>
                <span style={{color: "#10B981", fontWeight: "600", marginLeft: "8px"}}>
                  {metrikler.kullanici}
                </span>
              </div>
              <div>
                <span style={{color: "#94A3B8"}}>API Yanıt:</span>
                <span style={{color: "#3B82F6", fontWeight: "600", marginLeft: "8px"}}>
                  {metrikler.yanit}ms
                </span>
              </div>
              <div>
                <span style={{color: "#94A3B8"}}>Sistem Yükü:</span>
                <span style={{color: "#F59E0B", fontWeight: "600", marginLeft: "8px"}}>
                  %{metrikler.yuk}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
