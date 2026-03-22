"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react"

// ── Constants ────────────────────────────────────────────────────────────────

export const MAP_STYLE = "https://api.maptiler.com/maps/streets-v2/style.json?key=iI0x8mHLMdQbLlu3Z4SJ&language=ru"
export const DEFAULT_CENTER: [number, number] = [38.97, 45.04] // Krasnodar
export const DEFAULT_ZOOM = 10

// ── Types ────────────────────────────────────────────────────────────────────

export interface MapPin {
  id: number | string
  lat: number
  lng: number
  emoji?: string
  color?: string
  size?: number
  label?: string
  onClick?: () => void
}

export interface MapLine {
  id: string
  coordinates: [number, number][]  // [lng, lat]
  color?: string
  width?: number
  halo?: boolean
  onClick?: () => void
}

export interface MapViewRef {
  getMap: () => import("maplibre-gl").Map | null
  flyTo: (lng: number, lat: number, zoom?: number, offset?: [number, number]) => void
  fitBounds: (coords: [number, number][], padding?: number | { top: number; right: number; bottom: number; left: number }) => void
  resize: () => void
  addMarker: (pin: MapPin) => void
  removeAllMarkers: () => void
  setLineData: (sourceId: string, geometry: GeoJSON.LineString) => void
}

interface Props {
  center?: [number, number]  // [lng, lat]
  zoom?: number
  interactive?: boolean
  className?: string
  style?: React.CSSProperties
  onLoad?: (map: import("maplibre-gl").Map) => void
  onMoveEnd?: (map: import("maplibre-gl").Map) => void
}

// ── Component ────────────────────────────────────────────────────────────────

const MapView = forwardRef<MapViewRef, Props>(function MapView(
  { center, zoom, interactive = true, className, style, onLoad, onMoveEnd },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("maplibre-gl").Map | null>(null)
  const markersRef = useRef<Map<string | number, import("maplibre-gl").Marker>>(new Map())
  const readyRef = useRef(false)

  // ── Init map ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import("maplibre-gl").then(({ default: maplibregl }) => {
      if (!containerRef.current || mapRef.current) return

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: center ?? DEFAULT_CENTER,
        zoom: zoom ?? DEFAULT_ZOOM,
        attributionControl: false,
        interactive,
      })

      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right")

      map.on("load", () => {
        readyRef.current = true
        onLoad?.(map)
      })

      if (onMoveEnd) {
        map.on("moveend", () => onMoveEnd(map))
      }

      mapRef.current = map
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      mapRef.current?.remove()
      mapRef.current = null
      readyRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Imperative handle ──────────────────────────────────────────────────
  const flyTo = useCallback((lng: number, lat: number, z?: number, offset?: [number, number]) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: z ?? Math.max(mapRef.current.getZoom(), 12),
      duration: 600,
      offset,
    })
  }, [])

  const fitBounds = useCallback((coords: [number, number][], padding?: number | { top: number; right: number; bottom: number; left: number }) => {
    if (!mapRef.current || coords.length === 0) return
    import("maplibre-gl").then(({ default: maplibregl }) => {
      const bounds = new maplibregl.LngLatBounds()
      coords.forEach(([lng, lat]) => bounds.extend([lng, lat]))
      mapRef.current?.fitBounds(bounds, { padding: padding ?? 60, maxZoom: 13, duration: 1000 })
    })
  }, [])

  const resize = useCallback(() => {
    mapRef.current?.resize()
  }, [])

  const addMarker = useCallback((pin: MapPin) => {
    if (!mapRef.current) return
    import("maplibre-gl").then(({ default: maplibregl }) => {
      // Remove old if exists
      markersRef.current.get(pin.id)?.remove()

      const el = document.createElement("div")
      const sz = pin.size ?? 40
      el.style.cssText = [
        `width:${sz}px`, `height:${sz}px`, "border-radius:50%",
        `background:${pin.color ?? "#fff"}`,
        `border:3px solid ${pin.color ?? "#22EA36"}`,
        "box-shadow:0 2px 12px rgba(0,0,0,0.25)",
        "display:flex", "align-items:center", "justify-content:center",
        "cursor:pointer", "font-size:16px", "line-height:1",
        "transition:all 0.25s cubic-bezier(0.4,0,0.2,1)",
        "user-select:none",
      ].join(";")
      el.textContent = pin.emoji ?? "📍"
      if (pin.label) el.title = pin.label

      if (pin.onClick) el.addEventListener("click", pin.onClick)

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .addTo(mapRef.current!)

      markersRef.current.set(pin.id, marker)
    })
  }, [])

  const removeAllMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()
  }, [])

  const setLineData = useCallback((sourceId: string, geometry: GeoJSON.LineString) => {
    if (!mapRef.current || !readyRef.current) return
    const source = mapRef.current.getSource(sourceId) as import("maplibre-gl").GeoJSONSource | undefined
    if (source) {
      source.setData({ type: "Feature", properties: {}, geometry })
    }
  }, [])

  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current,
    flyTo,
    fitBounds,
    resize,
    addMarker,
    removeAllMarkers,
    setLineData,
  }), [flyTo, fitBounds, resize, addMarker, removeAllMarkers, setLineData])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
    />
  )
})

export default MapView
