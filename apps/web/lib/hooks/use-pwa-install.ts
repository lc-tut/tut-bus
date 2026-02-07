'use client'

import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function getIsStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(getIsStandalone)

  useEffect(() => {
    if (isInstalled) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const installedHandler = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [isInstalled])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (outcome === 'accepted') {
      setIsInstalled(true)
      return true
    }
    return false
  }, [deferredPrompt])

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    install,
  }
}
