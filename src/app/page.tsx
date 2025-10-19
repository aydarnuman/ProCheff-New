export default function HomePage() {
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
          🏠 Ana Sayfa
        </h2>
        <p style={{
          color: '#94A3B8',
          fontSize: '1.1rem'
        }}>
          ProCheff AI kontrol paneline hoş geldiniz
        </p>
      </div>

      {/* Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Menu Analysis Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#F8FAFC'
            }}>
              Menü Analizi
            </span>
          </div>
          <p style={{
            color: '#94A3B8',
            fontSize: '0.9rem',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            AI destekli menü değerlendirmesi ve optimizasyon önerileri
          </p>
          <a 
            href="/menu/"
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
              display: 'inline-block',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              color: 'white'
            }}
          >
            Analiz Et →
          </a>
        </div>

        {/* Market Data Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#F8FAFC'
            }}>
              Piyasa Verileri
            </span>
          </div>
          <p style={{
            color: '#94A3B8',
            fontSize: '0.9rem',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            Gerçek zamanlı fiyat takibi ve pazar analizi
          </p>
          <a 
            href="/menu/fiyat-takip/"
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
              display: 'inline-block',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              color: 'white'
            }}
          >
            Görüntüle →
          </a>
        </div>

        {/* İhale Merkezi Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🏛️</span>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#F8FAFC'
            }}>
              İhale Analiz Merkezi
            </span>
          </div>
          <p style={{
            color: '#94A3B8',
            fontSize: '0.9rem',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            Şartname analizi ve ihale stratejisi geliştirme
          </p>
          <a 
            href="/ihale/"
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
              display: 'inline-block',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              color: 'white'
            }}
          >
            Merkeze Git →
          </a>
        </div>

        {/* Reports Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>📈</span>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#F8FAFC'
            }}>
              Raporlar
            </span>
          </div>
          <p style={{
            color: '#94A3B8',
            fontSize: '0.9rem',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            Detaylı performans raporları ve analizleri
          </p>
          <a 
            href="/reports/"
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
              display: 'inline-block',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              color: 'white'
            }}
          >
            Raporları Gör →
          </a>
        </div>

        {/* Settings Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚙️</span>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#F8FAFC'
            }}>
              Sistem Ayarları
            </span>
          </div>
          <p style={{
            color: '#94A3B8',
            fontSize: '0.9rem',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            Platform konfigürasyonu ve kullanıcı ayarları
          </p>
          <a 
            href="/admin/"
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
              display: 'inline-block',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              color: 'white'
            }}
          >
            Ayarlara Git →
          </a>
        </div>

        {/* System Health Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#F8FAFC'
            }}>
              Sistem Sağlığı
            </span>
          </div>
          <p style={{
            color: '#94A3B8',
            fontSize: '0.9rem',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            API durumu ve sistem performans metrikleri
          </p>
          <a 
            href="/dashboard/"
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
              display: 'inline-block',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              color: 'white'
            }}
          >
            Kontrol Et →
          </a>
        </div>
      </div>
    </div>
  );
}
