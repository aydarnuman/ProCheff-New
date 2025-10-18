import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  varyant?: 'birincil' | 'ikincil' | 'tehlike' | 'basit';
  boyut?: 'kucuk' | 'orta' | 'buyuk';
  disabled?: boolean;
  genislik?: 'tam' | 'otomatik';
  className?: string;
  style?: React.CSSProperties;
}

export default function Button({
  children,
  onClick,
  varyant = 'birincil',
  boyut = 'orta',
  disabled = false,
  genislik = 'otomatik',
  className = '',
  style = {}
}: ButtonProps) {
  
  const baseStyles: React.CSSProperties = {
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    width: genislik === 'tam' ? '100%' : 'auto'
  };

  const boyutStilleri: Record<string, React.CSSProperties> = {
    kucuk: { padding: '8px 16px', fontSize: '0.875rem' },
    orta: { padding: '12px 24px', fontSize: '1rem' },
    buyuk: { padding: '16px 32px', fontSize: '1.125rem' }
  };

  const varyantStilleri: Record<string, React.CSSProperties> = {
    birincil: {
      background: '#10B981',
      color: 'white',
      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
    },
    ikincil: {
      background: '#3B82F6',
      color: 'white',
      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
    },
    tehlike: {
      background: '#EF4444',
      color: 'white',
      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
    },
    basit: {
      background: 'transparent',
      color: '#94A3B8',
      border: '1px solid rgba(148, 163, 184, 0.3)'
    }
  };

  const hoverStilleri: Record<string, React.CSSProperties> = {
    birincil: { background: '#059669', transform: 'translateY(-1px)' },
    ikincil: { background: '#2563EB', transform: 'translateY(-1px)' },
    tehlike: { background: '#DC2626', transform: 'translateY(-1px)' },
    basit: { background: 'rgba(148, 163, 184, 0.1)', transform: 'translateY(-1px)' }
  };

  const combinedStyles = {
    ...baseStyles,
    ...boyutStilleri[boyut],
    ...varyantStilleri[varyant],
    ...style
  };

  return (
    <button
      style={combinedStyles}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStilleri[varyant]);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, varyantStilleri[varyant]);
        }
      }}
    >
      {children}
    </button>
  );
}
