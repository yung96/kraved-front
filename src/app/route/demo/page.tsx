"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin, Clock, Tag, Star, ChevronDown, ArrowRight, Navigation } from "lucide-react"
import { BrandMark } from "@/components/BrandMark/BrandMark"
import BottomBar from "@/components/ui/BottomBar/BottomBar"
import styles from "./demo.module.css"

// ── Types ────────────────────────────────────────────────────────────────────

interface Stop {
  time: string
  postId: number | null
  name: string
  photos: string[]
  caption: string
  tip: string | null
  durationMin: number
  tags: string[]
  ratingAvg: number
  schedule: string
  distanceToNextKm: number | null
  durationToNextMin: number | null
  transport: "car" | "walk" | "bike" | "bus"
}

interface Recommendation {
  type: "food" | "stay" | "fuel"
  name: string
  distanceKm: number
  why: string
  postId: number | null
}

interface Day {
  dayNumber: number
  date: string
  title: string
  tempC: number
  weatherIcon: string
  stopsCount: number
  stops: Stop[]
  recommendations: Recommendation[]
}

interface MockRoute {
  id: string
  routeTitle: string
  intro: string
  totalDays: number
  totalKm: number
  totalStops: number
  summary: string
  warnings: string[]
  status: "ready"
  days: Day[]
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_ROUTE: MockRoute = {
  id: "demo",
  routeTitle: "Виноградники и закат Кубани",
  intro: "Два дня по лучшим местам южного берега — от виноделен Абрау-Дюрсо до закатов Геленджика.",
  totalDays: 2,
  totalKm: 156,
  totalStops: 6,
  summary: "Маршрут охватывает лучшие винодельни, рестораны и природные достопримечательности Краснодарского края.",
  warnings: ["Дорога на Абрау-Дюрсо узкая — будьте осторожны на серпантине"],
  status: "ready" as const,
  days: [
    {
      dayNumber: 1,
      date: "2026-04-15",
      title: "Виноградники и дегустации",
      tempC: 22,
      weatherIcon: "☀️",
      stopsCount: 3,
      stops: [
        {
          time: "10:00", postId: 1, name: "Винодельня Абрау-Дюрсо",
          photos: [], caption: "Начните утро с дегустации шести сортов вина в погребах XIX века. Сомелье расскажет историю каждого бокала.",
          tip: "Берите дегустацию с сыром за 1200₽ — сыры подбирает сомелье",
          durationMin: 90, tags: ["Винодельня", "Дегустация"], ratingAvg: 4.6,
          schedule: "Открыто до 18:00", distanceToNextKm: 12, durationToNextMin: 20, transport: "car"
        },
        {
          time: "12:30", postId: 2, name: "Ресторан Грааль",
          photos: [], caption: "Авторская кухня с видом на озеро. Попробуйте каре ягнёнка и домашнюю пасту.",
          tip: "Бронируйте столик на террасе — там лучший вид",
          durationMin: 75, tags: ["Ресторан", "Гастрономия"], ratingAvg: 4.8,
          schedule: "Открыто до 23:00", distanceToNextKm: 32, durationToNextMin: 40, transport: "car"
        },
        {
          time: "15:00", postId: 3, name: "Смотровая площадка «Сафари»",
          photos: [], caption: "Панорама на виноградники и море. Отсюда видно побережье от Анапы до Геленджика.",
          tip: null,
          durationMin: 30, tags: ["Природа", "Вид"], ratingAvg: 4.3,
          schedule: "Круглосуточно", distanceToNextKm: null, durationToNextMin: null, transport: "car"
        }
      ],
      recommendations: [
        { type: "food" as const, name: "Кафе Променад", distanceKm: 0.8, why: "Если Грааль занят — тут проще с бронью и порции больше", postId: null },
        { type: "stay" as const, name: "Гостиница Баден-Баден", distanceKm: 2.1, why: "10 мин от последней точки, завтрак включён, парковка бесплатная", postId: null }
      ]
    },
    {
      dayNumber: 2,
      date: "2026-04-16",
      title: "Побережье и закат",
      tempC: 24,
      weatherIcon: "🌤",
      stopsCount: 3,
      stops: [
        {
          time: "09:30", postId: 4, name: "Голубая бухта",
          photos: [], caption: "Бирюзовая вода и белые скалы. Лучший снорклинг на побережье.",
          tip: "Приходите до 10:00 — пляж ещё пустой",
          durationMin: 120, tags: ["Пляж", "Природа"], ratingAvg: 4.5,
          schedule: "Круглосуточно", distanceToNextKm: 8, durationToNextMin: 15, transport: "car"
        },
        {
          time: "13:00", postId: 5, name: "Набережная Геленджика",
          photos: [], caption: "Самая длинная набережная в России — 14 км. Кафе, аттракционы, вечерняя иллюминация.",
          tip: null,
          durationMin: 90, tags: ["Прогулка", "Город"], ratingAvg: 4.2,
          schedule: "Круглосуточно", distanceToNextKm: 5, durationToNextMin: 10, transport: "walk"
        },
        {
          time: "16:00", postId: 6, name: "Скала Парус",
          photos: [], caption: "Уникальный природный памятник — скала в форме паруса высотой 25 метров прямо у берега моря.",
          tip: "Закат отсюда — одно из лучших зрелищ на побережье",
          durationMin: 60, tags: ["Достопримечательность", "Природа"], ratingAvg: 4.7,
          schedule: "Круглосуточно", distanceToNextKm: null, durationToNextMin: null, transport: "car"
        }
      ],
      recommendations: [
        { type: "fuel" as const, name: "АЗС Лукойл", distanceKm: 1.2, why: "Последняя заправка перед серпантином", postId: null }
      ]
    }
  ]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
}

function recIcon(type: Recommendation["type"]): string {
  if (type === "food") return "🍽"
  if (type === "stay") return "🏨"
  return "⛽"
}

function recLabel(type: Recommendation["type"]): string {
  if (type === "food") return "Где поесть"
  if (type === "stay") return "Где остановиться"
  return "Заправка"
}

function transitIcon(transport: Stop["transport"]): string {
  if (transport === "walk") return "🚶"
  if (transport === "bike") return "🚲"
  if (transport === "bus") return "🚌"
  return "🚗"
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PhotoPlaceholder() {
  return (
    <div className={styles.photoPlaceholder}>
      <MapPin size={18} color="#C0C0C0" />
    </div>
  )
}

interface StopCardProps {
  stop: Stop
  index: number
}

function StopCard({ stop, index }: StopCardProps) {
  return (
    <motion.div
      className={styles.stopWrapper}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      {/* Timeline node */}
      <div className={styles.timelineNode}>
        <div className={styles.timeBadge}>{stop.time}</div>
        <div className={styles.timelineLineSeg} />
      </div>

      {/* Card */}
      <div className={styles.stopCard}>
        {/* Name */}
        <div className={styles.stopName}>
          <span className={styles.stopPin}>📍</span>
          <span>{stop.name}</span>
        </div>

        {/* Photos row */}
        <div className={styles.photosRow}>
          <PhotoPlaceholder />
          <PhotoPlaceholder />
          <PhotoPlaceholder />
        </div>

        {/* Caption */}
        <p className={styles.stopCaption}>{stop.caption}</p>

        {/* Tip */}
        {stop.tip && (
          <div className={styles.tipCard}>
            <span className={styles.tipIcon}>💡</span>
            <span className={styles.tipText}>{stop.tip}</span>
          </div>
        )}

        {/* Meta row */}
        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <Clock size={12} />
            {stop.durationMin >= 60
              ? `${Math.floor(stop.durationMin / 60)}ч${stop.durationMin % 60 ? ` ${stop.durationMin % 60}м` : ""}`
              : `${stop.durationMin} мин`}
          </span>
          <span className={styles.metaDot}>·</span>
          {stop.tags.slice(0, 1).map(tag => (
            <span key={tag} className={styles.metaItem}>
              <Tag size={12} />
              {tag}
            </span>
          ))}
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaItem}>
            <Star size={12} />
            {stop.ratingAvg}
          </span>
        </div>

        {/* Schedule */}
        <div className={styles.schedule}>
          <span className={styles.scheduleGreen}>🟢</span>
          <span>{stop.schedule}</span>
        </div>

        {/* Transit footer */}
        {stop.distanceToNextKm && stop.durationToNextMin && (
          <div className={styles.transitFooter}>
            <Navigation size={12} color="#858585" />
            <span>
              {transitIcon(stop.transport)} {stop.distanceToNextKm} км · ~{stop.durationToNextMin} мин до след. точки
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface RecommendationCardProps {
  rec: Recommendation
  index: number
}

function RecommendationCard({ rec, index }: RecommendationCardProps) {
  return (
    <motion.div
      className={styles.recWrapper}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
    >
      {/* Offset from timeline: empty node space */}
      <div className={styles.recNodeSpacer} />

      <div className={styles.recCard}>
        <div className={styles.recHeader}>
          <span className={styles.recTypeIcon}>{recIcon(rec.type)}</span>
          <div className={styles.recHeaderText}>
            <span className={styles.recLabel}>{recLabel(rec.type)}</span>
            <span className={styles.recName}>
              {rec.name}
              <span className={styles.recDist}> · {rec.distanceKm} км от маршрута</span>
            </span>
          </div>
        </div>
        <p className={styles.recWhy}>{rec.why}</p>
      </div>
    </motion.div>
  )
}

interface DaySectionProps {
  day: Day
}

function DaySection({ day }: DaySectionProps) {
  return (
    <section className={styles.daySection}>
      {/* Sticky day header */}
      <div className={styles.dayHeader}>
        <div className={styles.dayPill}>
          <span className={styles.dayPillMain}>
            День {day.dayNumber} — {formatDate(day.date)}
          </span>
          <span className={styles.dayPillSep}>·</span>
          <span className={styles.dayPillTitle}>{day.title}</span>
          <span className={styles.dayPillSep}>·</span>
          <span className={styles.dayPillWeather}>{day.tempC}°C {day.weatherIcon}</span>
          <span className={styles.dayStopsBadge}>{day.stopsCount}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        {/* Vertical line running behind all stops */}
        <div className={styles.timelineLineMain} />

        {/* Stops */}
        {day.stops.map((stop, i) => (
          <StopCard key={stop.postId ?? i} stop={stop} index={i} />
        ))}

        {/* Recommendations */}
        {day.recommendations.length > 0 && (
          <div className={styles.recsSection}>
            <div className={styles.recsLabel}>Рекомендации рядом</div>
            {day.recommendations.map((rec, i) => (
              <RecommendationCard key={rec.name} rec={rec} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RouteDemoPage() {
  const router = useRouter()
  const route = MOCK_ROUTE

  return (
    <div className={styles.page}>

      {/* ── Hyde header pill ── */}
      <header className={styles.header}>
        <button className={styles.headerPill} onClick={() => router.push("/")}>
          <BrandMark className={styles.logo} />
          <span className={styles.headerLabel}>Маршрут</span>
          <ChevronDown size={14} color="#858585" />
        </button>
      </header>

      {/* ── Route header card ── */}
      <motion.div
        className={styles.routeCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <h1 className={styles.routeTitle}>{route.routeTitle}</h1>
        <p className={styles.routeIntro}>{route.intro}</p>

        {/* Stats */}
        <div className={styles.statsRow}>
          <span className={styles.stat}>{route.totalDays} дня</span>
          <span className={styles.statDot}>·</span>
          <span className={styles.stat}>{route.totalKm} км</span>
          <span className={styles.statDot}>·</span>
          <span className={styles.stat}>{route.totalStops} остановок</span>
        </div>

        {/* Warnings */}
        {route.warnings.map(w => (
          <div key={w} className={styles.warningCard}>
            <span>⚠️</span>
            <span>{w}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Day sections ── */}
      {route.days.map(day => (
        <DaySection key={day.dayNumber} day={day} />
      ))}

      {/* ── Summary ── */}
      <motion.div
        className={styles.summarySection}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <p className={styles.summaryText}>{route.summary}</p>
        <button
          className={styles.newRouteBtn}
          onClick={() => router.push("/route/create")}
        >
          <span>Создать новый маршрут</span>
          <ArrowRight size={16} />
        </button>
      </motion.div>

      <BottomBar />
    </div>
  )
}
