import PWAServiceWorker from '@/components/ServiceWorkerRegistration'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ProCheff - Professional Catering Management System',
  description: 'AI-powered catering management system for tender processes, menu optimization, and cost analysis',
  keywords: ['catering', 'tender management', 'menu optimization', 'cost analysis', 'ProCheff', 'AI'],
  authors: [{ name: 'ProCheff Team' }],
  creator: 'ProCheff',
  publisher: 'ProCheff',
  applicationName: 'ProCheff',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/ProCheff-New/manifest.json',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'ProCheff - Professional Catering Management System',
    description: 'AI-powered catering management system for tender processes, menu optimization, and cost analysis',
    url: 'https://aydarnuman.github.io/ProCheff-New',
    siteName: 'ProCheff',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProCheff - Professional Catering Management System',
    description: 'AI-powered catering management system for tender processes, menu optimization, and cost analysis',
    creator: '@procheff',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#0E0F13',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <div style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1A1B23 100%)',
          color: '#F8FAFC',
          minHeight: '100vh'
        }}>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Unified Sidebar Navigation */}
            <div style={{
              width: '280px',
              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
              borderRight: '1px solid rgba(148, 163, 184, 0.1)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '2px 0 20px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                padding: '24px 20px',
                borderBottom: '1px solid rgba(71, 85, 105, 0.2)',
                textAlign: 'center'
              }}>
                <h1 style={{
                  fontSize: '1.4rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  marginBottom: '8px'
                }}>
                  ProCheff AI
                </h1>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#94A3B8',
                  fontWeight: '500'
                }}>
                  Kontrol Merkezi
                </p>
              </div>

              <nav style={{ padding: '12px 16px', flex: '1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link 
                  href="/"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#CBD5E1',
                    transition: 'all 0.2s ease',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🏠</span>
                  <span>Ana Sayfa</span>
                </Link>
                
                <Link 
                  href="/ihale"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#CBD5E1',
                    transition: 'all 0.2s ease',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                  <span>İhale Merkezi</span>
                </Link>
                
                <Link 
                  href="/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#CBD5E1',
                    transition: 'all 0.2s ease',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>📊</span>
                  <span>Dashboard</span>
                </Link>
                
                <Link 
                  href="/menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#CBD5E1',
                    transition: 'all 0.2s ease',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🍽️</span>
                  <span>Menü Analizi</span>
                </Link>
                
                <Link 
                  href="/offer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#CBD5E1',
                    transition: 'all 0.2s ease',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>💰</span>
                  <span>Teklif Merkezi</span>
                </Link>
                
                <Link 
                  href="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#CBD5E1',
                    transition: 'all 0.2s ease',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>⚙️</span>
                  <span>Admin Panel</span>
                </Link>
              </nav>
            </div>
            
            {/* Main Content Area */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              {children}
            </div>
          </div>
        </div>
        <PWAServiceWorker />
      </body>
    </html>
  )
}
