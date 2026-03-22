"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import type maplibregl from "maplibre-gl"
import type { PostResponse } from "@/lib/types"
import { useEffect, useRef } from "react"

interface Props {
  places: PostResponse[]
  onPlaceClick?: (place: PostResponse) => void
  activePlaceId?: number | null
  activeCategory?: string | null
}

const SEASON_COLORS: Record<string, string> = {
  spring: "#d4a8d4",
  summer: "#f4c842",
  autumn: "#e59866",
  winter: "#85c1e9",
}

const KRD_CENTER: [number, number] = [38.97, 45.04]
const KRD_ZOOM = 7.5

type MarkerEntry = { marker: maplibregl.Marker; el: HTMLElement }

export default function GeoMap({ places, onPlaceClick, activePlaceId, activeCategory }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)
  const markersRef   = useRef<Map<number, MarkerEntry>>(new Map())

  const validPlaces = places.filter(p => p.geoLat && p.geoLng)

  // ── Build map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    import("maplibre-gl").then(({ default: maplibregl }) => {
      if (!containerRef.current || mapRef.current) return

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            carto: {
              type: "raster",
              tiles: [
                "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=iI0x8mHLMdQbLlu3Z4SJ&language=ru",
              ],
              tileSize: 512,
              attribution: "© MapTiler © OpenStreetMap",
            },
          },
          layers: [{ id: "carto-tiles", type: "raster", source: "carto" }],
        },
        center: KRD_CENTER,
        zoom:   KRD_ZOOM,
        attributionControl: false,
      })

      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-left",
      )

      mapRef.current = map

      map.on("load", () => {
        validPlaces.forEach(place => {
          const color = SEASON_COLORS[place.season] ?? "#888"
          const label = place.averageRating != null
            ? place.averageRating.toFixed(1)
            : "★"

          const el = document.createElement("div")
          el.style.cssText = [
            "width:36px","height:36px","border-radius:50%",
            "background:#fff",`border:2.5px solid ${color}`,
            "box-shadow:0 2px 8px rgba(0,0,0,0.2)",
            "display:flex","align-items:center","justify-content:center",
            "cursor:pointer","font-size:11px","font-weight:600","color:#1a1a1a",
            "transition:transform 0.15s,box-shadow 0.15s",
            "user-select:none",
          ].join(";")
          el.textContent = label

          el.addEventListener("mouseenter", () => {
            el.style.transform   = "scale(1.25)"
            el.style.boxShadow   = "0 4px 16px rgba(0,0,0,0.3)"
          })
          el.addEventListener("mouseleave", () => {
            if (activePlaceId !== place.id) {
              el.style.transform = "scale(1)"
              el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)"
            }
          })
          el.addEventListener("click", () => onPlaceClick?.(place))

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([place.geoLng!, place.geoLat!])
            .addTo(map)

          markersRef.current.set(place.id, { marker, el })
        })
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [validPlaces.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Highlight active pin ────────────────────────────────────────────────────
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      const place = validPlaces.find(p => p.id === id)
      if (!place) return

      const seasonColor = SEASON_COLORS[place.season] ?? "#888"

      if (id === activePlaceId) {
        el.style.background   = "#1a1a1a"
        el.style.color        = "#fff"
        el.style.borderColor  = "#1a1a1a"
        el.style.transform    = "scale(1.3)"
        el.style.boxShadow    = "0 4px 16px rgba(0,0,0,0.35)"
        el.style.zIndex       = "100"
      } else {
        el.style.background   = "#fff"
        el.style.color        = "#1a1a1a"
        el.style.borderColor  = seasonColor
        el.style.transform    = "scale(1)"
        el.style.boxShadow    = "0 2px 8px rgba(0,0,0,0.2)"
        el.style.zIndex       = "1"
      }
    })

    if (activePlaceId != null && mapRef.current) {
      const place = validPlaces.find(p => p.id === activePlaceId)
      if (place?.geoLat && place?.geoLng) {
        mapRef.current.flyTo({
          center:   [place.geoLng, place.geoLat],
          zoom:     Math.max(mapRef.current.getZoom(), 11),
          duration: 500,
          essential: true,
        })
      }
    }
  }, [activePlaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
}
