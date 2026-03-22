"use client"

import type { PostResponse } from "@/lib/types"
import "leaflet/dist/leaflet.css"
import { useEffect, useRef } from "react"

interface Props {
  places: PostResponse[]
  expanded?: boolean
  activeIndex?: number
}

const DIFF_COLORS = {
  spring: "#4ade80",
  summer: "#facc15",
  autumn: "#fb923c",
  winter: "#60a5fa",
}

export default function RouteMap({ places, expanded = false, activeIndex }: Props) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  const validPlaces = places.filter(p => p.geoLat && p.geoLng)

  useEffect(() => {
    if (!mapRef.current) return
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }
    if (validPlaces.length === 0) return

    let cancelled = false

    import("leaflet").then(L => {
      if (cancelled || !mapRef.current) return
      // Clear any stale leaflet init on the container
      const container = mapRef.current as any
      if (container._leaflet_id) {
        delete container._leaflet_id
      }
      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: expanded,
      })

      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution('© <a href="https://carto.com">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>')
        .addTo(map)

      // MapTiler tiles
      L.tileLayer("https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=iI0x8mHLMdQbLlu3Z4SJ&language=ru", {
        maxZoom: 20,
        tileSize: 512,
        zoomOffset: -1,
        attribution: "© MapTiler © OpenStreetMap",
      }).addTo(map)

      const coords: [number, number][] = validPlaces.map(p => [p.geoLat!, p.geoLng!])

      // Маршрутная линия
      L.polyline(coords, {
        color: "#FACC15",
        weight: 5,
        opacity: 0.95,
        dashArray: "1 8",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map)

      // Нумерованные маркеры
      validPlaces.forEach((place, i) => {
        const isFirst = i === 0
        const isLast  = i === validPlaces.length - 1

        const isActive = activeIndex === i
        const color = isActive ? "#FACC15" : isFirst ? "#1a1a1a" : isLast ? "#1a1a1a" : "#4ade80"
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              width: ${isFirst || isLast ? 38 : 34}px;
              height: ${isFirst || isLast ? 38 : 34}px;
              border-radius: 50%;
              background: ${color};
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${isFirst || isLast ? 14 : 12}px;
              font-weight: 700;
              font-family: system-ui;
              border: 3px solid #fff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            ">${isFirst ? "🏁" : i + 1}</div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        })

        L.marker([place.geoLat!, place.geoLng!], { icon })
          .addTo(map)
          .bindTooltip(place.title, {
            permanent: isFirst || isLast,
            direction: "top",
            offset: [0, -22],
            className: "route-tooltip",
          })
      })

      // Fit all markers
      const bounds = L.latLngBounds(coords)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })

      mapInstanceRef.current = map
    })

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [validPlaces.length, expanded, activeIndex])

  // Fly to active place without rebuilding the map
  useEffect(() => {
    if (activeIndex == null || !mapInstanceRef.current) return
    const place = validPlaces[activeIndex]
    if (place?.geoLat && place?.geoLng) {
      mapInstanceRef.current.flyTo([place.geoLat, place.geoLng], 12, { duration: 0.8 })
    }
  }, [activeIndex])

  if (validPlaces.length === 0) return null

  return (
    <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
  )
}
