'use client'

import { BusLocation, BusRoutePath } from '@/lib/bus-location'
import { cn } from '@/lib/utils'
import { LngLatBounds, Map as MapLibreMap, Marker, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FaBus } from 'react-icons/fa'

// バンドル後も worker を読み込めるよう、URL を明示する
setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href)

export interface BusMapStop {
  name: string
  lat: number
  lng: number
  kind: 'departure' | 'destination'
}

interface BusMapProps {
  buses: BusLocation[]
  routePath: BusRoutePath | null
  stops: BusMapStop[]
  // false のときはドラッグ・ズームできないプレビューとして表示する
  interactive?: boolean
  className?: string
}

const ROUTE_SOURCE_ID = 'bus-route'

// 地理院タイル（淡色地図）
const GSI_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'
const GSI_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer">地理院タイル</a>'

// ダークモードではタイルの明暗を反転させて暗い地図にする
function rasterPaint(isDark: boolean) {
  return isDark
    ? {
        'raster-brightness-min': 0.9,
        'raster-brightness-max': 0.05,
        'raster-saturation': -0.6,
        'raster-hue-rotate': 180,
      }
    : {
        'raster-brightness-min': 0,
        'raster-brightness-max': 1,
        'raster-saturation': 0,
        'raster-hue-rotate': 0,
      }
}

// globals.css の --primary と同じ色
const ROUTE_COLOR = '#3b82f6'

export default function BusMap({
  buses,
  routePath,
  stops,
  interactive = false,
  className,
}: BusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef(new Map<string, { marker: Marker; el: HTMLDivElement }>())
  const [isLoaded, setIsLoaded] = useState(false)
  const [markerEls, setMarkerEls] = useState<{ id: string; el: HTMLDivElement }[]>([])
  const [stopEls, setStopEls] = useState<{ stop: BusMapStop; el: HTMLDivElement }[]>([])
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  // 地図の生成
  useEffect(() => {
    if (!containerRef.current) return

    const map = new MapLibreMap({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          gsi: {
            type: 'raster',
            tiles: [GSI_TILE_URL],
            tileSize: 256,
            maxzoom: 18,
            attribution: GSI_ATTRIBUTION,
          },
        },
        layers: [{ id: 'gsi', type: 'raster', source: 'gsi' }],
      },
      center: [139.3392, 35.6278],
      zoom: 14,
      interactive,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    })
    if (interactive) map.touchZoomRotate.disableRotation()

    map.on('load', () => setIsLoaded(true))
    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    const markers = markersRef.current
    return () => {
      resizeObserver.disconnect()
      markers.clear()
      map.remove()
      mapRef.current = null
      setIsLoaded(false)
    }
  }, [interactive])

  // テーマに合わせてタイルの色を変える
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return
    const paint = rasterPaint(isDark)
    map.setPaintProperty('gsi', 'raster-brightness-min', paint['raster-brightness-min'])
    map.setPaintProperty('gsi', 'raster-brightness-max', paint['raster-brightness-max'])
    map.setPaintProperty('gsi', 'raster-saturation', paint['raster-saturation'])
    map.setPaintProperty('gsi', 'raster-hue-rotate', paint['raster-hue-rotate'])
  }, [isDark, isLoaded])

  // 経路の線と表示範囲
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const coordinates = routePath ?? stops.map((stop) => [stop.lng, stop.lat] as [number, number])
    if (coordinates.length === 0) return

    if (routePath) {
      const data = {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: routePath },
      }
      const source = map.getSource(ROUTE_SOURCE_ID) as
        | { setData: (value: typeof data) => void }
        | undefined
      if (source) {
        source.setData(data)
      } else {
        map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data })
        map.addLayer({
          id: `${ROUTE_SOURCE_ID}-casing`,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.8 },
        })
        map.addLayer({
          id: ROUTE_SOURCE_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': ROUTE_COLOR, 'line-width': 4 },
        })
      }
    }

    const bounds = coordinates.reduce(
      (b, coord) => b.extend(coord),
      new LngLatBounds(coordinates[0], coordinates[0])
    )
    map.fitBounds(bounds, { padding: interactive ? 56 : 28, duration: 0, maxZoom: 16 })
  }, [routePath, stops, isLoaded, interactive])

  // バス停のマーカー
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const created = stops.map((stop) => {
      const el = document.createElement('div')
      const marker = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map)
      return { stop, el, marker }
    })
    setStopEls(created.map(({ stop, el }) => ({ stop, el })))

    return () => {
      created.forEach((c) => c.marker.remove())
    }
  }, [stops, isLoaded])

  // バスのマーカー（bus_id ごとに使い回して位置だけ更新する）
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const markers = markersRef.current
    const activeIds = new Set(buses.map((bus) => bus.bus_id))

    for (const [id, { marker }] of markers) {
      if (!activeIds.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    }
    for (const bus of buses) {
      const existing = markers.get(bus.bus_id)
      if (existing) {
        existing.marker.setLngLat([bus.lon, bus.lat])
      } else {
        const el = document.createElement('div')
        const marker = new Marker({ element: el }).setLngLat([bus.lon, bus.lat]).addTo(map)
        markers.set(bus.bus_id, { marker, el })
      }
    }
    setMarkerEls(Array.from(markers, ([id, { el }]) => ({ id, el })))
  }, [buses, isLoaded])

  const busesById = new Map(buses.map((bus) => [bus.bus_id, bus]))

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      <div ref={containerRef} className="absolute inset-0" />

      {stopEls.map(({ stop, el }) =>
        createPortal(
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'rounded-md border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shadow-sm',
                stop.kind === 'departure'
                  ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-200'
                  : 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900 dark:border-green-800 dark:text-green-200'
              )}
            >
              {stop.name}
            </span>
            <span
              className={cn(
                'mt-0.5 size-2.5 rounded-full border-2 border-white dark:border-neutral-900',
                stop.kind === 'departure' ? 'bg-blue-500' : 'bg-green-500'
              )}
            />
          </div>,
          el,
          `stop-${stop.kind}`
        )
      )}

      {markerEls.map(({ id, el }) => {
        const bus = busesById.get(id)
        if (!bus) return null
        return createPortal(
          <div className={cn('relative size-8', bus.stale && 'opacity-50')}>
            {/* 進行方向 */}
            <div
              className="absolute inset-0 transition-transform duration-700"
              style={{ transform: `rotate(${bus.heading}deg)` }}
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-b-[8px] border-b-primary" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-md dark:border-neutral-900">
              <FaBus className="size-3.5" />
            </div>
          </div>,
          el,
          id
        )
      })}
    </div>
  )
}
