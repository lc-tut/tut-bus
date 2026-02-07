'use client'

import { Button } from '@/components/ui/button'
import { usePwaInstall } from '@/lib/hooks/use-pwa-install'
import { FaDownload, FaExternalLinkAlt } from 'react-icons/fa'

export function PwaInstallButton() {
  const { canInstall, isInstalled, install } = usePwaInstall()

  if (isInstalled) {
    return (
      <Button size="lg" className="font-semibold" onClick={() => window.open('/', '_blank')}>
        <FaExternalLinkAlt className="mr-2 size-3.5" />
        アプリを開く
      </Button>
    )
  }

  if (!canInstall) {
    return null
  }

  return (
    <Button size="lg" className="font-semibold" onClick={install}>
      <FaDownload className="mr-2 size-4" />
      ホーム画面に追加
    </Button>
  )
}
