"use client"

import { useGetRouteFullQuery, useGetRouteByShareTokenQuery, useGetTripRoadQuery, useGetTripScheduleQuery } from "@/store/kraevedApi"
import MapView, { type MapViewRef } from "@/components/MapView/MapView"
import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Sparkles,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import styles from "./map.module.css"

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Helpers ──────────────────────────────────────────────────────────────────

function emojiFor(name: string, desc: string): string {
  const t = (name + " " + desc).toLowerCase()
  if (t.includes("вино") || t.includes("дегустац") || t.includes("абрау")) return "🍷"
  if (t.includes("ресторан") || t.includes("кафе") || t.includes("еда")) return "🍽"
  if (t.includes("пляж") || t.includes("море") || t.includes("бухт")) return "🏖"
  if (t.includes("гор") || t.includes("ущель") || t.includes("водопад")) return "⛰️"
  if (t.includes("музей") || t.includes("галере")) return "🏛"
  if (t.includes("парк") || t.includes("сад")) return "🌿"
  if (t.includes("ферм") || t.includes("сыр")) return "🧀"
  if (t.includes("озер") || t.includes("кипарис")) return "🌲"
  return "📍"
}

function catFor(name: string, desc: string): string {
  const t = (name + " " + desc).toLowerCase()
  if (t.includes("вино") || t.includes("дегустац")) return "Винодельня"
  if (t.includes("ресторан") || t.includes("кафе")) return "Ресторан"
  if (t.includes("пляж") || t.includes("море")) return "Пляж"
  if (t.includes("гор") || t.includes("ущель") || t.includes("водопад")) return "Природа"
  if (t.includes("музей") || t.includes("галере")) return "Музей"
  if (t.includes("парк") || t.includes("сад")) return "Парк"
  if (t.includes("ферм")) return "Ферма"
  if (t.includes("озер")) return "Озеро"
  return "Место"
}

// ── Constants ────────────────────────────────────────────────────────────────

const ROUTE_LINE_COLOR = "#206915"
const PIN_SELECTED_COLOR = "#22EA36"
const DAY_COLORS = ["#22EA36", "#F97316", "#6366F1", "#EC4899", "#EAB308"]

// ── Types ────────────────────────────────────────────────────────────────────

interface Stop {
  id: number
  name: string
  desc: string
  lat: number
  lng: number
  time: string | null
  durationMin: number | null
  distNextKm: number | null
  distNextMin: number | null
  postId: number | null
  dayIdx: number
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RouteMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [view, setView] = useState<"map" | "days">(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("view") === "days" ? "days" : "map"
    }
    return "map"
  })
  const [panelSnap, setPanelSnap] = useState<"half" | "mini" | "full">("half")

  const mapRef = useRef<MapViewRef>(null)
  const markersRef = useRef<Map<number, HTMLElement>>(new Map())
  const roadDrawnRef = useRef(false)

  // ── Load route from API ──────────────────────────────────────────────────
  const isNumeric = /^\d+$/.test(id) && parseInt(id) < 1000000
  const { data: apiRoute, isLoading: apiLoading } = useGetRouteFullQuery(parseInt(id), { skip: !isNumeric })
  const { data: shareRoute, isLoading: shareLoading } = useGetRouteByShareTokenQuery(id, { skip: isNumeric })

  const route = apiRoute || shareRoute
  const tripId = route?.id ?? null

  // Road geometry
  const { data: roadData } = useGetTripRoadQuery(
    tripId ? { tripId } : { tripId: 0 },
    { skip: !tripId }
  )

  // Schedule
  const { data: scheduleData } = useGetTripScheduleQuery(tripId ?? 0, { skip: !tripId })

  // ── Extract stops from API data ─────────────────────────────────────────
  const stops = useMemo<Stop[]>(() => {
    if (!route) return []
    const result: Stop[] = []
    let dayIdx = 0
    for (const seg of route.segments ?? []) {
      for (const day of seg.days ?? []) {
        for (const exp of day.experiences ?? []) {
          const d = exp.details ?? {}
          if (!d.lat || !d.lng) continue
          result.push({
            id: exp.id,
            name: d.name ?? "",
            desc: d.description ?? "",
            lat: d.lat,
            lng: d.lng,
            time: d.time ?? null,
            durationMin: d.duration_min ?? null,
            distNextKm: d.distance_to_next_km ?? null,
            distNextMin: d.duration_to_next_min ?? null,
            postId: d.post_id ?? null,
            dayIdx,
          })
        }
        dayIdx++
      }
    }
    return result
  }, [route])

  // Group stops by day
  const dayGroups = useMemo(() => {
    const groups: { dayIdx: number; date: string | null; stops: Stop[] }[] = []
    for (const stop of stops) {
      let g = groups.find((g) => g.dayIdx === stop.dayIdx)
      if (!g) {
        const seg = (route?.segments ?? [])[0]
        const day = (seg?.days ?? [])[stop.dayIdx]
        g = { dayIdx: stop.dayIdx, date: day?.details?.date ?? null, stops: [] }
        groups.push(g)
      }
      g.stops.push(stop)
    }
    return groups
  }, [stops, route])

  const selected = stops[selectedIndex] ?? null

  // Schedule activity for selected
  const selectedActivity = useMemo(() => {
    if (!selected || !scheduleData?.days) return null
    for (const day of scheduleData.days) {
      const act = day.activities?.find((a: any) =>
        selected.name.toLowerCase().includes(a.name.toLowerCase()) ||
        a.name.toLowerCase().includes(selected.name.toLowerCase())
      )
      if (act) return act
    }
    return null
  }, [selected, scheduleData])

  // ── Build map: called by MapView onLoad ──────────────────────────────────
  const handleMapLoad = useCallback((map: import("maplibre-gl").Map) => {
    if (stops.length === 0) return

    // Empty route source — filled when roadData arrives
    map.addSource("route-line", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
    })

    map.addLayer({
      id: "route-line-halo",
      type: "line",
      source: "route-line",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#fff", "line-width": 8, "line-opacity": 0.7 },
    })

    map.addLayer({
      id: "route-line-main",
      type: "line",
      source: "route-line",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": ROUTE_LINE_COLOR, "line-width": 4, "line-opacity": 0.9 },
    })

    // Markers
    import("maplibre-gl").then(({ default: maplibregl }) => {
      stops.forEach((stop, idx) => {
        const color = DAY_COLORS[stop.dayIdx % DAY_COLORS.length]
        const el = document.createElement("div")
        const isActive = idx === 0

        el.style.cssText = [
          "width:40px", "height:40px", "border-radius:50%",
          `background:${isActive ? PIN_SELECTED_COLOR : "#fff"}`,
          `border:3px solid ${isActive ? PIN_SELECTED_COLOR : color}`,
          "box-shadow:0 2px 12px rgba(0,0,0,0.25)",
          "display:flex", "align-items:center", "justify-content:center",
          "cursor:pointer", "font-size:16px", "line-height:1",
          `transform:scale(${isActive ? 1.3 : 1})`,
          "transition:all 0.25s cubic-bezier(0.4,0,0.2,1)",
          "user-select:none",
        ].join(";")
        el.title = stop.name
        el.textContent = emojiFor(stop.name, stop.desc)
        el.addEventListener("click", () => setSelectedIndex(idx))

        new maplibregl.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map)

        markersRef.current.set(stop.id, el)
      })

      // Fit bounds
      const first = stops[0]
      if (stops.length > 1) {
        const bounds = new maplibregl.LngLatBounds()
        stops.forEach((s) => bounds.extend([s.lng, s.lat]))
        map.fitBounds(bounds, { padding: { top: 100, right: 40, bottom: window.innerHeight * 0.55 + 20, left: 40 }, maxZoom: 13, duration: 1200 })
      } else {
        map.flyTo({ center: [first.lng, first.lat], zoom: 13, duration: 1000 })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops])

  // ── Draw road ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!roadData?.geometry?.coordinates || !map || roadDrawnRef.current) return
    const source = map.getSource("route-line") as any
    if (source) {
      source.setData({ type: "Feature", properties: {}, geometry: roadData.geometry })
      roadDrawnRef.current = true
    }
  }, [roadData])

  // ── Update pins on selection ─────────────────────────────────────────────
  useEffect(() => {
    if (stops.length === 0) return

    stops.forEach((stop, idx) => {
      const el = markersRef.current.get(stop.id)
      if (!el) return
      const isActive = idx === selectedIndex
      const color = DAY_COLORS[stop.dayIdx % DAY_COLORS.length]

      el.style.background = isActive ? PIN_SELECTED_COLOR : "#fff"
      el.style.borderColor = isActive ? PIN_SELECTED_COLOR : color
      el.style.transform = `scale(${isActive ? 1.35 : 1})`
      el.style.boxShadow = isActive ? "0 4px 20px rgba(34,234,54,0.45)" : "0 2px 12px rgba(0,0,0,0.25)"
      el.style.zIndex = isActive ? "10" : "1"
    })

    const map = mapRef.current?.getMap()
    if (map && stops[selectedIndex]) {
      const s = stops[selectedIndex]
      // Offset up so pin isn't hidden behind panel
      const panelPx = panelSnap === "mini" ? 40 : panelSnap === "half" ? window.innerHeight * 0.25 : window.innerHeight * 0.4
      map.flyTo({
        center: [s.lng, s.lat],
        zoom: Math.max(map.getZoom(), 12),
        duration: 600,
        offset: [0, -panelPx],
      })
    }
  }, [selectedIndex, stops, panelSnap])

  // ── Controls ───────────────────────────────────────────────────────────
  const handleZoomIn = useCallback(() => { mapRef.current?.getMap()?.zoomIn({ duration: 250 }) }, [])
  const handleZoomOut = useCallback(() => { mapRef.current?.getMap()?.zoomOut({ duration: 250 }) }, [])
  const goNext = useCallback(() => { setSelectedIndex((i) => Math.min(i + 1, stops.length - 1)) }, [stops.length])
  const goPrev = useCallback(() => { setSelectedIndex((i) => Math.max(i - 1, 0)) }, [])

  const togglePanel = useCallback(() => {
    setPanelSnap((s) => {
      const next = s === "mini" ? "half" : s === "half" ? "full" : "mini"
      // Resize map after panel animation
      setTimeout(() => mapRef.current?.resize(), 350)
      return next
    })
  }, [])

  // Resize map when panel snap changes
  useEffect(() => {
    setTimeout(() => mapRef.current?.resize(), 350)
  }, [panelSnap])

  if (apiLoading || shareLoading) {
    return <div className={styles.center}><Loader2 size={28} className={styles.spin} /></div>
  }

  if (!route || stops.length === 0) {
    return (
      <div className={styles.center}>
        <MapPin size={32} />
        <p>Маршрут не найден</p>
      </div>
    )
  }

  const isFirst = selectedIndex === 0
  const isLast = selectedIndex === stops.length - 1
  const narrative = route.narrative ?? ""
  const distLabel = roadData ? `${roadData.distance_km.toFixed(0)} км` : null
  const durLabel = roadData ? `${Math.floor(roadData.duration_min / 60)}ч ${roadData.duration_min % 60}мин` : null

  const panelHeight = panelSnap === "mini" ? "80px" : panelSnap === "half" ? "55dvh" : "85dvh"

  return (
    <div className={styles.page}>

      {/* ── Map (full screen) ── */}
      <div className={styles.mapContainer}>
        <MapView
          ref={mapRef}
          center={stops.length > 0 ? [stops[0].lng, stops[0].lat] : undefined}
          zoom={10}
          className={styles.mapWrap}
          onLoad={handleMapLoad}
        />

        <div className={styles.mapBadge}>
          <span className={styles.mapBadgeGreen}>{stops.length} точек</span>
          {distLabel && ` · ${distLabel}`}
          {durLabel && ` · ${durLabel}`}
        </div>

        {/* Close button on map */}
        <button className={styles.mapClose} onClick={() => router.back()}>
          <X size={16} />
        </button>

        <div className={styles.zoomControls}>
          <button className={styles.zoomBtn} onClick={handleZoomIn}>+</button>
          <button className={styles.zoomBtn} onClick={handleZoomOut}>−</button>
        </div>
      </div>

      {/* ── Panel (bottom sheet style) ── */}
      <motion.div
        className={styles.panel}
        animate={{ height: panelHeight }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Drag handle + collapse */}
        <button className={styles.panelHandle} onClick={togglePanel}>
          <div className={styles.panelHandleBar} />
          {panelSnap === "mini" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* View toggle */}
        <div className={styles.panelHeaderRow}>
          <h2 className={styles.routeTitle}>{route.title}</h2>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${view === "map" ? styles.viewBtnActive : ""}`}
              onClick={() => setView("map")}>Карта</button>
            <button className={`${styles.viewBtn} ${view === "days" ? styles.viewBtnActive : ""}`}
              onClick={() => setView("days")}>По дням</button>
          </div>
        </div>

        <div className={styles.panelScroll}>

          {/* ── Map view ── */}
          {view === "map" && selected && (
            <>
              <AnimatePresence mode="wait">
                <motion.div key={selected.id + "-info"} className={styles.stopInfo}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}>
                  <div className={styles.stopHeader}>
                    <span className={styles.stopEmoji}>{emojiFor(selected.name, selected.desc)}</span>
                    <div>
                      <h3 className={styles.stopName}>{selected.name}</h3>
                      <span className={styles.stopCat}>
                        {catFor(selected.name, selected.desc).toUpperCase()}
                        {` · Точка ${selectedIndex + 1} из ${stops.length}`}
                        {dayGroups.length > 1 && ` · День ${selected.dayIdx + 1}`}
                      </span>
                    </div>
                  </div>

                  <p className={styles.stopDesc}>{selected.desc}</p>

                  <div className={styles.stopMeta}>
                    {selected.time && <span><Clock size={11} /> {selected.time}</span>}
                    {selected.durationMin && <span>{selected.durationMin} мин</span>}
                    {selected.distNextKm && (
                      <span className={styles.stopDist}>→ {selected.distNextKm} км · {selected.distNextMin} мин</span>
                    )}
                  </div>

                  {selectedActivity?.aiTip && (
                    <div className={styles.tipCard}>
                      <Sparkles size={12} /> {selectedActivity.aiTip}
                    </div>
                  )}

                  <div className={styles.stopActions}>
                    {selected.postId && (
                      <button className={styles.actionBtn} onClick={() => router.push(`/place/${selected.postId}`)}>
                        <MapPin size={13} /> Подробнее
                      </button>
                    )}
                    <button className={styles.actionBtn} onClick={() =>
                      window.open(`https://maps.google.com/?q=${selected.lat},${selected.lng}`, "_blank")}>
                      <Navigation size={13} /> Навигация
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Nav buttons */}
              <div className={styles.bottomNav}>
                <button className={styles.prevBtn} onClick={goPrev} disabled={isFirst}>
                  <ChevronLeft size={16} /> НАЗАД
                </button>
                <button className={styles.nextBtn} onClick={goNext} disabled={isLast}>
                  ДАЛЕЕ <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ── Days view ── */}
          {view === "days" && (
            <div className={styles.daysView}>
              {dayGroups.map((group, di) => (
                <div key={di} className={styles.dayBlock}>
                  <div className={styles.dayHeader}>
                    <span className={styles.dayDot} style={{ background: DAY_COLORS[di % DAY_COLORS.length] }} />
                    <h3 className={styles.dayTitle}>День {di + 1}</h3>
                    {group.date && <span className={styles.dayCount}>{group.date}</span>}
                    <span className={styles.dayCount}>{group.stops.length} мест</span>
                  </div>

                  <div className={styles.dayPlaces}>
                    {group.stops.map((stop, si) => {
                      const globalIdx = stops.indexOf(stop)
                      return (
                        <motion.button
                          key={stop.id}
                          className={`${styles.dayPlaceCard} ${selectedIndex === globalIdx ? styles.dayPlaceCardActive : ""}`}
                          onClick={() => { setSelectedIndex(globalIdx); setView("map"); setPanelSnap("half") }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: si * 0.04 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={styles.dayPlaceEmoji}>{emojiFor(stop.name, stop.desc)}</div>
                          <div className={styles.dayPlaceInfo}>
                            <p className={styles.dayPlaceName}>{stop.name}</p>
                            <p className={styles.dayPlaceCat}>
                              {stop.time && <><Clock size={11} /> {stop.time} · </>}
                              {stop.durationMin && `${stop.durationMin} мин`}
                              {stop.distNextKm && ` · ${stop.distNextKm} км далее`}
                            </p>
                          </div>
                          <ChevronRight size={16} className={styles.dayPlaceArrow} />
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {narrative && (
                <div className={styles.dayNarrative}>
                  <Sparkles size={12} color="#22EA36" />
                  <p className={styles.dayNarrativeText}>
                    {narrative.length > 200 ? narrative.slice(0, 200) + "…" : narrative}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
