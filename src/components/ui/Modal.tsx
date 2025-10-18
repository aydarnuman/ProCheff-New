import React, { useEffect } from 'react';

interface ModalProps {
  children: React.ReactNode;
  acik: boolean;
  onKapat: () => void;
  baslik?: string;
  boyut?: 'kucuk' | 'orta' | 'buyuk' | 'tam';
  kapatilabilir?: boolean;
  arkaPlanKapatma?: boolean;
  className?: string;
}

export default function Modal({
  children,
  acik,
  onKapat,
  baslik,
  boyut = 'orta',
  kapatilabilir = true,
  arkaPlanKapatma = true,
  className = ''
}: ModalProps) {

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && kapatilabilir) {
        onKapat();
      }
    };

    if (acik) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [acik, kapatilabilir, onKapat]);

  if (!acik) return null;

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  };

  const boyutStilleri: Record<string, React.CSSProperties> = {
    kucuk: { maxWidth: '400px', width: '100%' },
    orta: { maxWidth: '600px', width: '100%' },
    buyuk: { maxWidth: '800px', width: '100%' },
    tam: { maxWidth: '95vw', width: '95vw', height: '90vh' }
  };

  const modalStyles: React.CSSProperties = {
    background: '#1A1B23',
    borderRadius: '12px',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    maxHeight: '90vh',
    overflow: 'auto',
    ...boyutStilleri[boyut]
  };

  const headerStyles: React.CSSProperties = {
    padding: '24px 24px 16px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const closeButtonStyles: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#94A3B8',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    transition: 'all 0.2s ease'
  };

  const closeButtonHoverStyles: React.CSSProperties = {
    color: '#F1F5F9',
    background: 'rgba(148, 163, 184, 0.1)'
  };

  const contentStyles: React.CSSProperties = {
    padding: '24px'
  };

  return (
    <div
      style={overlayStyles}
      onClick={arkaPlanKapatma ? onKapat : undefined}
    >
      <div
        style={modalStyles}
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        {(baslik || kapatilabilir) && (
          <div style={headerStyles}>
            {baslik && (
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#F1F5F9',
                margin: 0
              }}>
                {baslik}
              </h2>
            )}
            
            {kapatilabilir && (
              <button
                style={closeButtonStyles}
                onClick={onKapat}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, closeButtonHoverStyles);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, {
                    color: '#94A3B8',
                    background: 'transparent'
                  });
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}
        
        <div style={contentStyles}>
          {children}
        </div>
      </div>
    </div>
  );
}
