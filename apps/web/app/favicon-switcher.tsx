'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export default function FaviconSwitcher() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const updateFavicon = () => {
      const favicon = document.querySelector("link[rel='icon']") || document.createElement('link')
      favicon.setAttribute('rel', 'icon')
      favicon.setAttribute('type', 'image/x-icon')
      favicon.setAttribute('href', resolvedTheme === 'dark' ? '/favicon-dark.ico' : '/favicon.ico')
      document.head.appendChild(favicon)
    }

    updateFavicon()
  }, [resolvedTheme])

  return null
}
