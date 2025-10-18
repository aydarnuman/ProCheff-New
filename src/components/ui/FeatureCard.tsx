import React from 'react';

interface CardProps {
  children: React.ReactNode;
  baslik?: string;
  aciklama?: string;
  ikon?: string;
  onClick?: () => void;
  hover?: boolean;
  varyant?: 'varsayilan' | 'vurgu' | 'basarili' | 'uyari';
  genislik?: 'tam' | 'yarim' | 'otomatik';
  className?: string;
  style?: React.CSSProperties;
}

export default function FeatureCard({
  children,
  baslik,
  aciklama,
  ikon,
  onClick,
  hover = true,
  varyant = 'varsayilan',
  genislik = 'otomatik',
  className = '',
  style = {}
}: CardProps) {
  
  const baseStyles: React.CSSProperties = {
    background: 'rgba(35, 39, 47, 0.8)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: onClick ? 'pointer' : 'default',
    position: 'relative',
    overflow: 'hidden',
    width: genislik === 'tam' ? '100%' : genislik === 'yarim' ? '50%' : 'auto'
  };

  // Varyant stilleri
  const varyantStilleri: Record<string, React.CSSProperties> = {
    varsayilan: {
      background: 'rgba(35, 39, 47, 0.8)',
      borderColor: 'rgba(59, 130, 246, 0.2)',
      color: '#F1F5F9'
    },
    vurgu: {
      background: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      color: '#F1F5F9'
    },
    basarili: {
      background: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
      color: '#F1F5F9'
    },
    uyari: {
      background: 'rgba(249, 115, 22, 0.1)',
      borderColor: 'rgba(249, 115, 22, 0.3)',
      color: '#F1F5F9'
    }
  };

  const finalStyles: React.CSSProperties = {
    ...baseStyles,
    ...varyantStilleri[varyant],
    ...style
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover) {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  return (
    <div 
      className={className}
      style={finalStyles}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {ikon && (
        <div style={{fontSize: '3rem', marginBottom: '1rem'}}>
          {ikon}
        </div>
      )}
      
      {baslik && (
        <h2 style={{
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: varyant === 'vurgu' ? '#10B981' : 
                 varyant === 'basarili' ? '#22C55E' :
                 varyant === 'uyari' ? '#F97316' : '#F1F5F9'
        }}>
          {baslik}
        </h2>
      )}
      
      {aciklama && (
        <p style={{color: '#F1F5F9', marginBottom: '24px'}}>
          {aciklama}
        </p>
      )}
      
      {children}
    </div>
  );
}
