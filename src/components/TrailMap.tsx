"use client"

import type { TrailPath } from "@/lib/overpass"
import type { Trail } from "@/lib/trails"
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from "@/lib/trails"
import "leaflet/dist/leaflet.css"
import { useEffect, useRef, useState } from "react"

interface Props {
  trails: Trail[]
  selected: Trail | null
  onSelect: (t: Trail) => void
}

const DIFF_COLOR: Record<string, string> = {
  easy:   "#16a34a",
  medium: "#d97706",
  hard:   "#dc2626",
}

export default function TrailMap({ trails, selected, onSelect }: Props) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [osmLoading, setOsmLoading] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import("leaflet").then(L => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      })

      const map = L.map(mapRef.current!, {
        center: [44.2, 39.5],
        zoom: 8,
        zoomControl: false,
      })

      L.control.zoom({ position: "topright" }).addTo(map)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map)

      // ── Seed trail markers ──
      trails.forEach(trail => {
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              background: ${DIFF_COLOR[trail.difficulty]};
              color: white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              width: 32px; height: 32px;
              display: flex; align-items: center; justify-content: center;
              font-weight: 700; font-size: 11px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              border: 2px solid white;
            ">
              <span style="transform: rotate(45deg)">${trail.distance}</span>
            </div>
          `,
          iconSize:   [32, 32],
          iconAnchor: [16, 32],
        })

        const marker = L.marker([trail.lat, trail.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: system-ui; min-width: 180px">
              <strong style="font-size: 13px">${trail.name}</strong>
              <p style="color: #888; font-size: 11px; margin: 2px 0 6px">${trail.region}</p>
              <div style="display: flex; gap: 8px; font-size: 11px; color: #444">
                <span>🚶 ${trail.distance} км</span>
                <span>⏱ ${trail.duration} д.</span>
              </div>
            </div>
          `)

        marker.on("click", () => onSelect(trail))
      })

      mapInstanceRef.current = map

      // ── Load real OSM trails ──
      setOsmLoading(true)
      import("@/lib/overpass")
        .then(({ fetchHikingTrails, fetchHikingPaths }) =>
          Promise.all([fetchHikingTrails(), fetchHikingPaths()])
        )
        .then(([relations, paths]) => {
          const all: TrailPath[] = [...relations, ...paths]

          all.forEach(trail => {
            if (trail.coords.length < 2) return
            L.polyline(trail.coords, {
              color:   DIFF_COLOR[trail.difficulty] ?? "#6b7280",
              weight:  trail.id.startsWith("osm-way") ? 2 : 3,
              opacity: 0.7,
            })
              .addTo(map)
              .bindPopup(`<div style="font-family:system-ui;font-size:12px"><strong>${trail.name}</strong><br><span style="color:#888">${trail.difficulty === "easy" ? "Лёгкий" : trail.difficulty === "medium" ? "Средний" : "Сложный"}</span></div>`)
          })
        })
        .catch(() => {/* silently fail — seed markers still visible */})
        .finally(() => setOsmLoading(false))
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Pan to selected trail
  useEffect(() => {
    if (!selected || !mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([selected.lat, selected.lng], 11, { duration: 1 })
  }, [selected])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* OSM loading indicator */}
      {osmLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-full px-3 py-1.5 shadow-md flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-3 h-3 border border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          Загрузка троп OSM…
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-2xl shadow-lg p-3 space-y-1.5">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-2">Сложность</p>
        {[
          { d: "easy",   color: "bg-green-500", label: "Лёгкий"  },
          { d: "medium", color: "bg-amber-500",  label: "Средний" },
          { d: "hard",   color: "bg-red-500",    label: "Сложный" },
        ].map(({ d, color, label }) => (
          <div key={d} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-zinc-600">{label}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-zinc-100">
          <p className="text-[9px] text-zinc-400">Тропы: OSM / OpenStreetMap</p>
        </div>
      </div>
    </div>
  )
}
