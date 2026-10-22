'use client'

import { useEffect, useState } from 'react'

export interface UserLocation {
  lat: number
  lng: number
}

type UserLocationStatus = 'off' | 'locating' | 'on' | 'denied' | 'unavailable'

// enabled のあいだだけ端末の現在地を追いかける（許可ダイアログはボタンを押したときだけ出す）
export function useUserLocation(enabled: boolean) {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState<'denied' | 'unavailable' | null>(null)
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  useEffect(() => {
    if (!enabled || !supported) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setError(null)
      },
      (err) => setError(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      setLocation(null)
      setError(null)
    }
  }, [enabled, supported])

  let status: UserLocationStatus = 'off'
  if (enabled) {
    if (!supported) status = 'unavailable'
    else if (error) status = error
    else status = location ? 'on' : 'locating'
  }

  return { location: enabled ? location : null, status }
}
