'use client'

import { useEffect } from 'react'

export default function PWAServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/ProCheff-New/sw.js')
        .then((registration) => {
          console.log('[ProCheff] Service Worker registered successfully:', registration)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('[ProCheff] Service Worker update found')
          })
        })
        .catch((error) => {
          console.error('[ProCheff] Service Worker registration failed:', error)
        })
    } else {
      console.log('[ProCheff] Service Worker not supported')
    }
  }, [])

  return null // This component doesn't render anything
}
