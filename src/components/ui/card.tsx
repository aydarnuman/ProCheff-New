import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div 
      className={className}
      style={{
        background: 'rgba(35, 39, 47, 0.8)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '12px',
        padding: '24px',
        color: '#F1F5F9'
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={className} style={{ marginBottom: '16px' }}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', style = {} }: CardTitleProps) {
  return (
    <h3 className={className} style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#F1F5F9', margin: 0, ...style }}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className} style={{ color: '#F1F5F9' }}>
      {children}
    </div>
  );
}
