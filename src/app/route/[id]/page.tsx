"use client"

import BottomBar from "@/components/ui/BottomBar/BottomBar"
import { useGetRouteFullQuery, useGetRouteByShareTokenQuery } from "@/store/kraevedApi"
import { motion } from "framer-motion"
import {
  Calendar,
  Car,
  ChevronRight,
  Clock,
  Cloud,
  Grid3X3,
  Hotel,
  Loader2,
  MapPin,
  Navigation,
  Plane,
  Sparkles,
  Star,
  Thermometer,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useState } from "react"
import styles from "./route-detail.module.css"

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Component ──────────────────────────────────────────────────────────────────

export default function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [narExpanded, setNarExpanded] = useState(false)

  const isNumeric = /^\d+$/.test(id) && parseInt(id) < 1000000
  const { data: apiRoute, isLoading: apiLoading } = useGetRouteFullQuery(parseInt(id), { skip: !isNumeric })
  const { data: shareRoute, isLoading: shareLoading } = useGetRouteByShareTokenQuery(id, { skip: isNumeric })

  const route = apiRoute || shareRoute
  const loading = apiLoading || shareLoading

  if (loading) {
    return (
      <div className={styles.center}>
        <Loader2 size={28} className={styles.spin} />
      </div>
    )
  }

  if (!route) {
    return (
      <div className={styles.center}>
        <MapPin size={32} />
        <p>Маршрут не найден</p>
        <button onClick={() => router.push("/route/create")} className={styles.ctaBtn} style={{ width: "auto", margin: 0 }}>
          Создать маршрут
        </button>
      </div>
    )
  }

  const narrative = route.narrative ?? ""
  const narShort = narrative.length > 300 ? narrative.slice(0, 300) + "…" : narrative
  const params2 = route.params ?? {}
  const weather = params2.weather
  const weatherPerDay = params2.weatherPerDay ?? []
  const segments = route.segments ?? []
  const recommendations = params2.llm_context?.recommendations ?? []

  // Collect all experiences
  const allExperiences: any[] = []
  for (const seg of segments) {
    for (const day of seg.days ?? []) {
      for (const exp of day.experiences ?? []) {
        allExperiences.push(exp)
      }
    }
  }

  // Collect flights
  const flights: any[] = []
  for (const seg of segments) {
    for (const leg of seg.legs ?? []) {
      if (leg.details?.transport === "plane") flights.push(leg)
    }
  }

  // Collect stays
  const stays: any[] = []
  for (const seg of segments) {
    for (const stay of seg.stays ?? []) {
      stays.push(stay)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.scrollArea}>

        {/* ── Header ── */}
        <motion.div className={styles.header}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className={styles.title}>{route.title}</h1>
          <motion.button className={styles.closeBtn} onClick={() => router.back()} whileTap={{ scale: 0.85 }}>
            <X size={18} />
          </motion.button>
        </motion.div>

        {/* ── Meta chips ── */}
        <div className={styles.metaChips}>
          {route.totalDays && (
            <span className={styles.metaChip}><Calendar size={12} /> {route.totalDays} дней</span>
          )}
          {params2.total_km && (
            <span className={styles.metaChip}><Car size={12} /> {params2.total_km.toFixed(0)} км</span>
          )}
          {route.totalExperiences > 0 && (
            <span className={styles.metaChip}><MapPin size={12} /> {route.totalExperiences} мест</span>
          )}
          {params2.transport && (
            <span className={styles.metaChip}>{params2.transport === "car" ? "🚗" : "🚌"} {params2.transport}</span>
          )}
          {params2.budget && (
            <span className={styles.metaChip}>💰 {params2.budget}</span>
          )}
          {params2.groupType && (
            <span className={styles.metaChip}>👥 {params2.groupType}</span>
          )}
          {params2.dateFrom && (
            <span className={styles.metaChip}><Calendar size={12} /> {params2.dateFrom} — {params2.dateTo}</span>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className={styles.actions}>
          <motion.button className={styles.actionBtn} whileTap={{ scale: 0.96 }}
            onClick={() => router.push(`/route/${id}/map`)}>
            <span className={styles.actionIcon}><Navigation size={14} /></span>
            Карта
          </motion.button>
          <motion.button className={styles.actionBtn} whileTap={{ scale: 0.96 }}
            onClick={() => router.push(`/route/${id}/map?view=days`)}>
            <span className={styles.actionIcon}><Grid3X3 size={14} /></span>
            По дням
          </motion.button>
          {route.shareToken && (
            <motion.button className={styles.actionBtn} whileTap={{ scale: 0.96 }}
              onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/route/${route.shareToken}`) }}>
              <span className={styles.actionIcon}><Star size={14} /></span>
              Поделиться
            </motion.button>
          )}
        </div>

        {/* ── Weather ── */}
        {weather && (
          <div className={styles.weatherBlock}>
            <div className={styles.weatherMain}>
              <Thermometer size={16} />
              <span className={styles.weatherTemp}>{weather.temperature}°C</span>
              <Cloud size={14} />
              <span>{weather.weather}</span>
            </div>
            {weatherPerDay.length > 0 && (
              <div className={styles.weatherDays}>
                {weatherPerDay.slice(0, 7).map((d: any, i: number) => (
                  <div key={i} className={styles.weatherDay}>
                    <span className={styles.weatherDayDate}>{d.date?.slice(5)}</span>
                    <span>{d.tempC}°</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AI Narrative ── */}
        {narrative && (
          <motion.div className={styles.narrativeBlock}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            <div className={styles.narrativeLabel}>
              <Sparkles size={12} /> AI-НАРРАТИВ
            </div>
            <p className={styles.narrativeText}>
              {narExpanded ? narrative : narShort}
              {narrative.length > 300 && (
                <button className={styles.narrativeToggle} onClick={() => setNarExpanded(!narExpanded)}>
                  {narExpanded ? " Скрыть" : " Читать полностью"}
                </button>
              )}
            </p>
          </motion.div>
        )}

        {/* ── Flights ── */}
        {flights.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><Plane size={16} /> Перелёты</h3>
            {flights.map((leg: any, i: number) => (
              <motion.a
                key={i}
                className={styles.flightCard}
                href={leg.providerUrl}
                target="_blank"
                rel="noopener"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
              >
                <div className={styles.flightRoute}>
                  <span className={styles.flightCity}>{leg.details.from}</span>
                  <Plane size={14} />
                  <span className={styles.flightCity}>{leg.details.to}</span>
                </div>
                <div className={styles.flightMeta}>
                  <span>{leg.details.carrier} {leg.details.flight_number}</span>
                  <span><Clock size={11} /> {Math.floor(leg.details.duration_min / 60)}ч {leg.details.duration_min % 60}мин</span>
                  {leg.details.departure_at && (
                    <span>{new Date(leg.details.departure_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>
                  )}
                </div>
                {leg.price && (
                  <div className={styles.flightPrice}>
                    {leg.price.toLocaleString("ru-RU")} ₽
                    <ChevronRight size={14} />
                  </div>
                )}
              </motion.a>
            ))}
          </div>
        )}

        {/* ── Stays ── */}
        {stays.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><Hotel size={16} /> Где остановиться</h3>
            {stays.map((stay: any, i: number) => (
              <div key={i} className={styles.stayCard}>
                {(stay.details?.options ?? []).slice(0, 3).map((opt: any, j: number) => (
                  <div key={j} className={styles.stayOption}>
                    <span className={styles.stayName}>{opt.name}</span>
                    {opt.address && <span className={styles.stayAddr}>{opt.address}</span>}
                    <span className={styles.stayType}>{opt.type}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── Experiences (places) ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}><MapPin size={16} /> Маршрут · {allExperiences.length} точек</h3>
          {allExperiences.map((exp: any, i: number) => {
            const d = exp.details ?? {}
            return (
              <motion.button
                key={exp.id}
                className={styles.expCard}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.04 * i }}
                whileTap={{ scale: 0.98 }}
                onClick={() => d.post_id && router.push(`/place/${d.post_id}`)}
              >
                <div className={styles.expNum}>{i + 1}</div>
                <div className={styles.expBody}>
                  <h4 className={styles.expName}>{d.name}</h4>
                  {d.description && <p className={styles.expDesc}>{d.description}</p>}
                  <div className={styles.expMeta}>
                    {d.time && <span><Clock size={11} /> {d.time}</span>}
                    {d.duration_min && <span>{d.duration_min} мин</span>}
                    {d.distance_to_next_km && (
                      <span className={styles.expDistance}>
                        → {d.distance_to_next_km} км · {d.duration_to_next_min} мин
                      </span>
                    )}
                  </div>
                </div>
                {d.post_id && <ChevronRight size={16} className={styles.expArrow} />}
              </motion.button>
            )
          })}
        </div>

        {/* ── Food Recommendations ── */}
        {recommendations.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><UtensilsCrossed size={16} /> Где поесть</h3>
            {recommendations.slice(0, 5).map((rec: any, i: number) => (
              <div key={i} className={styles.foodBlock}>
                {(rec.options ?? []).slice(0, 3).map((opt: any, j: number) => (
                  <div key={j} className={styles.foodOption}>
                    <span className={styles.foodName}>{opt.name}</span>
                    {opt.address && <span className={styles.foodAddr}>{opt.address}</span>}
                    <span className={styles.foodType}>{opt.type} · {opt.source}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── CTA ── */}
        <motion.button className={styles.ctaBtn} whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/route/${id}/map`)}>
          <Navigation size={16} /> Открыть на карте
        </motion.button>

        <div style={{ height: 100 }} />
      </div>
      <BottomBar />
    </div>
  )
}
