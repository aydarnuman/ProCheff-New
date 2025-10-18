import React, { useEffect, useState } from 'react';

interface MarketDataModalProps {
  acik: boolean;
  onKapat: () => void;
}

interface MarketItem {
  name: string;
  price: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
}

export default function MarketDataModal({ acik, onKapat }: MarketDataModalProps) {
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (acik) {
      // Simulate real-time market data fetch
      setTimeout(() => {
        setMarketData([
          { name: 'Premium Dana Eti', price: 85.50, change: 2.5, trend: 'up', category: 'Et' },
          { name: 'Organik Tavuk', price: 32.00, change: -1.2, trend: 'down', category: 'Et' },
          { name: 'Taze Levrek', price: 55.00, change: 0.8, trend: 'up', category: 'Balık' },
          { name: 'Karides', price: 120.00, change: -3.5, trend: 'down', category: 'Balık' },
          { name: 'Mozzarella Peyniri', price: 45.00, change: 1.8, trend: 'up', category: 'Süt Ürünleri' },
          { name: 'Parmesan', price: 180.00, change: 0.0, trend: 'stable', category: 'Süt Ürünleri' },
          { name: 'Domates', price: 8.50, change: 15.2, trend: 'up', category: 'Sebze' },
          { name: 'Soğan', price: 6.00, change: -8.1, trend: 'down', category: 'Sebze' },
          { name: 'Zeytinyağı', price: 65.00, change: 4.2, trend: 'up', category: 'Yağ' },
          { name: 'Tereyağı', price: 28.00, change: -0.5, trend: 'down', category: 'Yağ' }
        ]);
        setLoading(false);
      }, 1500);
    }
  }, [acik]);

  const categories = ['all', 'Et', 'Balık', 'Süt Ürünleri', 'Sebze', 'Yağ'];
  
  const filteredData = selectedCategory === 'all' 
    ? marketData 
    : marketData.filter(item => item.category === selectedCategory);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  const categoryButtonStyles = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' : 'rgba(59, 130, 246, 0.1)',
    color: isActive ? 'white' : '#3B82F6',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  });

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
            📊 Piyasa Verileri
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: '#3B82F6' }}>
                🔄
              </div>
              <p style={{ color: '#F1F5F9', fontSize: '18px' }}>
                Gerçek zamanlı piyasa verileri alınıyor...
              </p>
            </div>
          ) : (
            <>
              {/* Market Summary */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h3 style={{ color: '#3B82F6', marginBottom: '16px' }}>
                  📈 Piyasa Özeti
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10B981' }}>
                      +2.3%
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '14px' }}>Genel Artış</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#F1F5F9' }}>
                      {marketData.length}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '14px' }}>Takip Edilen</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3B82F6' }}>
                      5 dk
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: '14px' }}>Güncelleme</div>
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: '#F1F5F9', marginBottom: '12px' }}>Kategori Filtresi:</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      style={categoryButtonStyles(selectedCategory === category)}
                    >
                      {category === 'all' ? 'Tümü' : category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Market Data Table */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: '16px',
                  fontWeight: 'bold',
                  color: '#3B82F6',
                  fontSize: '14px'
                }}>
                  <div>ÜRÜN</div>
                  <div style={{ textAlign: 'center' }}>FİYAT</div>
                  <div style={{ textAlign: 'center' }}>DEĞİŞİM</div>
                  <div style={{ textAlign: 'center' }}>TREND</div>
                </div>

                {filteredData.map((item, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    gap: '16px',
                    alignItems: 'center',
                    borderBottom: index < filteredData.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <div>
                      <div style={{ color: '#F1F5F9', fontWeight: '500' }}>
                        {item.name}
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '12px' }}>
                        {item.category}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#F1F5F9', fontWeight: 'bold' }}>
                      ₺{item.price.toFixed(2)}
                    </div>
                    <div style={{ 
                      textAlign: 'center', 
                      color: getTrendColor(item.trend),
                      fontWeight: 'bold'
                    }}>
                      {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '20px' }}>
                      {getTrendIcon(item.trend)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Alert Section */}
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '24px'
              }}>
                <h4 style={{ color: '#F59E0B', marginBottom: '12px' }}>
                  ⚠️ Fiyat Uyarıları
                </h4>
                <div style={{ color: '#F1F5F9' }}>
                  • Domates fiyatları %15+ artış gösteriyor - menü fiyatlarını gözden geçirin<br/>
                  • Karides fiyatında düşüş var - promosyon fırsatı<br/>
                  • Zeytinyağı maliyetleri yükselişte - alternatif tedarikçiler araştırın
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
