'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useState } from 'react'
import { FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa'

interface AnnouncementBannerProps {
  message?: string
  title?: string
  type?: 'info' | 'warning'
  linkUrl?: string
  linkText?: string
}

export function AnnouncementBanner({
  message,
  title = 'お知らせ',
  type = 'info',
  linkUrl,
  linkText = '詳細はこちら',
}: AnnouncementBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!message || !isVisible) return null

  const Icon = type === 'warning' ? FaExclamationTriangle : FaInfoCircle
  const variant = type === 'warning' ? 'destructive' : 'default'

  return (
    <div className="max-w-6xl mx-auto">
      <div className='mx-4 mt-6'>

      <Alert variant={variant} className="relative rounded-lg border">
        <Icon className="h-4 w-4" />
        <AlertTitle className="pr-6">{title}</AlertTitle>
        <AlertDescription className="pr-6 text-xs md:text-sm text-muted-foreground!">
          {message}
          {linkUrl && (
            <>
              {' '}
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {linkText}
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </>
          )}
        </AlertDescription>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="閉じる"
          >
          <FaTimes className="h-3.5 w-3.5" />
        </button>
      </Alert>
          </div>
    </div>
  )
}
