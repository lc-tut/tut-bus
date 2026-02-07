'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa'

interface AnnouncementBannerProps {
  /** 未指定時は NEXT_PUBLIC_ANNOUNCEMENT_MESSAGE を使用 */
  message?: string
  /** 未指定時は NEXT_PUBLIC_ANNOUNCEMENT_TITLE または 「お知らせ」 */
  title?: string
  /** 未指定時は NEXT_PUBLIC_ANNOUNCEMENT_TYPE または 'info' */
  type?: 'info' | 'warning'
  /** 未指定時は NEXT_PUBLIC_ANNOUNCEMENT_LINK_URL */
  linkUrl?: string
  /** 未指定時は NEXT_PUBLIC_ANNOUNCEMENT_LINK_TEXT または 「詳細はこちら」 */
  linkText?: string
  /** ルート要素に追加するCSSクラス */
  className?: string
  /** × ボタンで非表示にできるかどうか (default: true) */
  dismissible?: boolean
}

export function AnnouncementBanner({
  message: messageProp,
  title: titleProp,
  type: typeProp,
  linkUrl: linkUrlProp,
  linkText: linkTextProp,
  className,
  dismissible = true,
}: AnnouncementBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  // props 優先、未指定時は環境変数をフォールバック
  const message = messageProp ?? process.env.NEXT_PUBLIC_ANNOUNCEMENT_MESSAGE
  const title = titleProp ?? process.env.NEXT_PUBLIC_ANNOUNCEMENT_TITLE ?? 'お知らせ'
  const type =
    typeProp ?? (process.env.NEXT_PUBLIC_ANNOUNCEMENT_TYPE as 'info' | 'warning' | undefined) ?? 'info'
  const linkUrl = linkUrlProp ?? process.env.NEXT_PUBLIC_ANNOUNCEMENT_LINK_URL
  const linkText = linkTextProp ?? process.env.NEXT_PUBLIC_ANNOUNCEMENT_LINK_TEXT ?? '詳細はこちら'

  if (!message || !isVisible) return null

  const Icon = type === 'warning' ? FaExclamationTriangle : FaInfoCircle
  const variant = type === 'warning' ? 'destructive' : 'default'

  return (
    <div className={cn(className)}>
      <Alert variant={variant} className="relative rounded-lg border">
        <Icon className="h-4 w-4" />
        <AlertTitle className={cn(dismissible && 'pr-6')}>{title}</AlertTitle>
        <AlertDescription
          className={cn('text-xs md:text-sm text-muted-foreground!', dismissible && 'pr-6')}
        >
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
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-3 right-3 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            aria-label="閉じる"
          >
            <FaTimes className="h-3.5 w-3.5" />
          </button>
        )}
      </Alert>
    </div>
  )
}
