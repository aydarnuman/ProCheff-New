export default function KikAnalizPage() {
  return (
    <div style={{ flex: '1', padding: '32px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#F8FAFC', marginBottom: '8px' }}>
          ⚖️ KİK Analizi (PRO)
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>
          Tebliğ 4734'e göre sınır değer ve oran hesaplamaları
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.5rem' }}>📐</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#F8FAFC' }}>
              Sınır Değer Hesabı
            </span>
          </div>
          <p style={{ 
            color: '#94A3B8', 
            fontSize: '0.9rem', 
            marginBottom: '20px', 
            lineHeight: '1.5' 
          }}>
            KİK 4734 tebliği kapsamında ihale sınır değer hesaplamaları
          </p>
          <button style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: 'linear-gradient(135deg, #10B981, #3B82F6)',
            color: 'white'
          }}>
            Hesapla →
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#F8FAFC' }}>
              Oran Hesaplama
            </span>
          </div>
          <p style={{ 
            color: '#94A3B8', 
            fontSize: '0.9rem', 
            marginBottom: '20px', 
            lineHeight: '1.5' 
          }}>
            Teklif/sınır değer oranları ve rekabet analizi
          </p>
          <button style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: 'linear-gradient(135deg, #10B981, #3B82F6)',
            color: 'white'
          }}>
            Analiz Et →
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          border: '1px solid rgba(71, 85, 105, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.5rem' }}>📋</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#F8FAFC' }}>
              Yasal Uyumluluk
            </span>
          </div>
          <p style={{ 
            color: '#94A3B8', 
            fontSize: '0.9rem', 
            marginBottom: '20px', 
            lineHeight: '1.5' 
          }}>
            Mevzuat uygunluk kontrolü ve risk analizi
          </p>
          <a 
            href="../offer/"
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
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              color: 'white'
            }}
          >
            Teklif Paneline Geç →
          </a>
        </div>
      </div>
    </div>
  );
}
