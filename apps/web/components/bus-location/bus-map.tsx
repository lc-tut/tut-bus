'use client'

import { BusRoutePath } from '@/lib/bus-location'
import { BusMapBus, BusMapStop } from '@/lib/bus-location-view'
import { UserLocation } from '@/lib/hooks/use-user-location'
import { cn } from '@/lib/utils'
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FaBus } from 'react-icons/fa'

// バンドル後も worker を読み込めるよう、URL を明示する
setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).href)

export interface BusMapFocus {
  // 値が変わったときだけ表示範囲を合わせ直す
  key: string
  points: [number, number][]
}

interface BusMapProps {
  buses: BusMapBus[]
  routePath: BusRoutePath | null
  stops: BusMapStop[]
  userLocation?: UserLocation | null
  // 指定したときはこの範囲に合わせる。null のときは路線全体を表示する
  focus?: BusMapFocus | null
  // スマホ向け: 1本指ではページをスクロールし、2本指で地図を動かす
  cooperativeGestures?: boolean
  // 利用者が地図を動かしたとき（自動で追いかけるのをやめる合図）
  onUserMove?: () => void
  // 地図に重ねたパネルなどで隠れる分の余白（px）
  padding?: { top: number; bottom: number; left: number; right: number }
  className?: string
}

const ROUTE_SOURCE_ID = 'bus-route'

// バス停のラベルはマーカーの上に出るので、上側の余白を広めに取る
const DEFAULT_PADDING = { top: 56, bottom: 32, left: 32, right: 32 }

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
  userLocation = null,
  focus = null,
  cooperativeGestures = false,
  onUserMove,
  padding = DEFAULT_PADDING,
  className,
}: BusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef(new Map<string, { marker: Marker; el: HTMLDivElement }>())
  const [isLoaded, setIsLoaded] = useState(false)
  const [markerEls, setMarkerEls] = useState<{ id: string; el: HTMLDivElement }[]>([])
  const [stopEls, setStopEls] = useState<{ stop: BusMapStop; el: HTMLDivElement }[]>([])
  // 現在地マーカーの要素（ssr: false で読み込むので document がある）
  const [userEl] = useState(() => {
    const el = document.createElement('div')
    el.style.zIndex = '4'
    return el
  })
  const userMarkerRef = useRef<Marker | null>(null)
  const onUserMoveRef = useRef(onUserMove)
  useEffect(() => {
    onUserMoveRef.current = onUserMove
  }, [onUserMove])
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
      cooperativeGestures,
      locale: {
        'CooperativeGesturesHandler.WindowsHelpText': 'Ctrl キーを押しながらスクロールで拡大・縮小',
        'CooperativeGesturesHandler.MacHelpText': '⌘ キーを押しながらスクロールで拡大・縮小',
        'CooperativeGesturesHandler.MobileHelpText': '2本の指で地図を動かせます',
      },
      // 右下は地図の操作ボタンと重なるので左下に置く
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    })
    map.addControl(new AttributionControl({ compact: true }), 'bottom-left')
    map.touchZoomRotate.disableRotation()

    map.on('load', () => setIsLoaded(true))
    // プログラムからの移動には originalEvent が付かない
    const handleUserMove = (e: { originalEvent?: unknown }) => {
      if (e.originalEvent) onUserMoveRef.current?.()
    }
    map.on('dragstart', handleUserMove)
    map.on('zoomstart', handleUserMove)
    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    const markers = markersRef.current
    return () => {
      resizeObserver.disconnect()
      markers.clear()
      userMarkerRef.current = null
      map.remove()
      mapRef.current = null
      setIsLoaded(false)
    }
  }, [cooperativeGestures])

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

  // 経路の線
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const data = {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: routePath ?? [] },
    }
    const source = map.getSource(ROUTE_SOURCE_ID) as
      | { setData: (value: typeof data) => void }
      | undefined
    if (source) {
      source.setData(data)
      return
    }
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
  }, [routePath, isLoaded])

  // 表示範囲（focus があればその範囲、なければ路線全体）
  const routeKey = routePath ? `${routePath.length}:${routePath[0]}` : ''
  const stopsKey = stops.map((stop) => `${stop.lat},${stop.lng}`).join('|')
  const focusKey = focus?.key ?? null
  // 範囲の計算に使う座標は最新を参照するが、合わせ直すのはキーが変わったときだけ
  const latestBoundsRef = useRef<[number, number][]>([])
  useEffect(() => {
    latestBoundsRef.current = focus
      ? focus.points
      : (routePath ?? stops.map((stop) => [stop.lng, stop.lat] as [number, number]))
  })

  useEffect(() => {
    const map = mapRef.current
    const coordinates = latestBoundsRef.current
    if (!map || !isLoaded || coordinates.length === 0) return

    const bounds = coordinates.reduce(
      (b, coord) => b.extend(coord),
      new LngLatBounds(coordinates[0], coordinates[0])
    )
    // 追いかけるときはバスが近づいても周りが分かる程度で止める
    map.fitBounds(bounds, { padding, duration: focusKey ? 800 : 0, maxZoom: focusKey ? 15 : 16 })
  }, [routeKey, stopsKey, focusKey, isLoaded, padding])

  // 自分の現在地（マーカーは表示中のあいだ1つだけ作り、位置は別の effect で更新する）
  const hasUserLocation = userLocation !== null
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded || !hasUserLocation) return
    const marker = new Marker({ element: userEl }).setLngLat(map.getCenter()).addTo(map)
    userMarkerRef.current = marker
    return () => {
      marker.remove()
      userMarkerRef.current = null
    }
  }, [hasUserLocation, isLoaded, userEl])

  useEffect(() => {
    if (userLocation) userMarkerRef.current?.setLngLat([userLocation.lng, userLocation.lat])
  }, [userLocation, hasUserLocation, isLoaded])

  // バス停のマーカー
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const created = stops.map((stop) => {
      const el = document.createElement('div')
      // バス停のラベルはバスより手前に出す
      el.style.zIndex = '3'
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
      let entry = markers.get(bus.bus_id)
      if (entry) {
        entry.marker.setLngLat([bus.lon, bus.lat])
      } else {
        const el = document.createElement('div')
        const marker = new Marker({ element: el }).setLngLat([bus.lon, bus.lat]).addTo(map)
        entry = { marker, el }
        markers.set(bus.bus_id, entry)
      }
      // 出発地に向かっているバスを手前に出す
      entry.el.style.zIndex = bus.variant === 'approaching' ? '2' : '1'
    }
    setMarkerEls(Array.from(markers, ([id, { el }]) => ({ id, el })))
  }, [buses, isLoaded])

  const busesById = new Map(buses.map((bus) => [bus.bus_id, bus]))

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {/* maplibregl-map クラスが position: relative を付けるので、絶対配置ではなく h-full で広げる */}
      <div ref={containerRef} className="h-full w-full" />

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
          // 接近中のバスはオレンジで大きく、出発済みのバスは灰色で小さく薄く出す
          <div
            className={cn(
              'relative',
              bus.variant === 'approaching' ? 'size-8' : 'size-6 opacity-70',
              bus.stale && 'opacity-40'
            )}
          >
            {/* 進行方向 */}
            <div
              className="absolute inset-0 transition-transform duration-700"
              style={{ transform: `rotate(${bus.heading}deg)` }}
            >
              <div
                className={cn(
                  'absolute -top-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-b-[8px]',
                  bus.variant === 'approaching' ? 'border-b-orange-500' : 'border-b-slate-400'
                )}
              />
            </div>
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center rounded-full border-2 border-white text-white shadow-md dark:border-neutral-900',
                bus.variant === 'approaching' ? 'bg-orange-500' : 'bg-slate-400 dark:bg-slate-500'
              )}
            >
              <FaBus className={bus.variant === 'approaching' ? 'size-3.5' : 'size-2.5'} />
            </div>
          </div>,
          el,
          id
        )
      })}

      {userLocation &&
        createPortal(
          <span className="relative flex size-4" aria-label="現在地">
            <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-60 animate-ping" />
            <span className="relative inline-flex size-4 rounded-full border-2 border-white bg-sky-500 shadow-md" />
          </span>,
          userEl
        )}
    </div>
  )
}
