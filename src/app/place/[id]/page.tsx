"use client"

import "swiper/css"
import "swiper/css/pagination"

import AppImage from "@/components/ui/AppImage/AppImage"
import BottomBar from "@/components/ui/BottomBar/BottomBar"
import { imgSrc } from "@/lib/api"
import {
  useGetTripPlaceQuery,
  useGetTripPlaceAiQuery,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  useListFavoritesQuery,
} from "@/store/kraevedApi"
import MapView, { type MapViewRef } from "@/components/MapView/MapView"
import { motion } from "framer-motion"
import {
  Clock,
  Globe,
  Heart,
  Loader2,
  MapPin,
  Phone,
  Star,
  X,
} from "lucide-react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination } from "swiper/modules"
import { useRouter } from "next/navigation"
import { use, useCallback, useRef, useState } from "react"
import styles from "./place.module.css"

// ── Helpers ────────────────────────────────────────────────────────────────────

function seasonLabel(s?: string | null): string {
  switch (s) {
    case "spring": return "Весна"
    case "summer": return "Лето"
    case "autumn": return "Осень"
    case "winter": return "Зима"
    default: return ""
  }
}

function seasonEmoji(s?: string | null): string {
  switch (s) {
    case "summer": return "☀️"
    case "winter": return "❄️"
    case "autumn": return "🍂"
    case "spring": return "🌸"
    default: return ""
  }
}

function priceLabel(p?: string | null): string {
  switch (p) {
    case "free": return "Бесплатно"
    case "budget": return "Бюджетно"
    case "mid": return "Средне"
    case "premium": return "Дорого"
    default: return ""
  }
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

// Safely render any value — objects get .name extracted
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeText(val: any): string {
  if (val == null) return ""
  if (typeof val === "string") return val
  if (typeof val === "number") return String(val)
  if (typeof val === "object" && "name" in val) return val.name
  return JSON.stringify(val)
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const pid = parseInt(id)
  const router = useRouter()

  const { data: place, isLoading, isError } = useGetTripPlaceQuery(pid)
  const { data: aiData } = useGetTripPlaceAiQuery(pid)

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token")
  const { data: favData } = useListFavoritesQuery({ pageSize: 100 }, { skip: !hasToken })
  const [addFav] = useAddToFavoritesMutation()
  const [removeFav] = useRemoveFromFavoritesMutation()

  const isFavorite = favData?.items?.some((p) => p.id === pid) ?? false

  const mapRef = useRef<MapViewRef>(null)

  function toggleLike() {
    if (isFavorite) removeFav(pid)
    else addFav(pid)
  }

  const handleMapLoad = useCallback(() => {
    if (!place?.lat || !place?.lng) return
    mapRef.current?.addMarker({
      id: "place-pin",
      lat: place.lat,
      lng: place.lng,
      emoji: "📍",
      color: "#22EA36",
    })
  }, [place?.lat, place?.lng])

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Loader2 size={28} className={styles.spin} />
      </div>
    )
  }

  if (isError || !place) {
    return (
      <div className={styles.center}>
        <MapPin size={32} strokeWidth={1} />
        <p>Место не найдено</p>
      </div>
    )
  }

  const photos = place.photos ?? []
  const season = seasonLabel(place.season)
  const price = priceLabel(place.priceLevel)
  const tags = place.interests?.map((i) => i.name.toUpperCase()) ?? []
  const paragraphs = (place.description ?? "").split(/\n+/).map((p) => p.trim()).filter(Boolean)

  return (
    <div className={styles.page}>
      <div className={styles.scrollArea}>

        {/* ── Header ── */}
        <motion.div className={styles.header}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className={styles.title}>{safeText(place.title) || "Место"}</h1>
          <div className={styles.headerRight}>
            <motion.button
              className={`${styles.likeBtn} ${isFavorite ? styles.likeBtnActive : ""}`}
              onClick={toggleLike} whileTap={{ scale: 0.85 }}>
              <Heart size={18} fill={isFavorite ? "#e03c3c" : "none"} />
            </motion.button>
            <motion.button className={styles.closeBtn} onClick={() => router.back()} whileTap={{ scale: 0.85 }}>
              <X size={18} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── Tags ── */}
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((tag, i) => (
              <span key={tag}>
                {i > 0 && <span className={styles.tagDot}> · </span>}
                <span className={styles.tag}>{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className={styles.actions}>
          {place.website && (
            <motion.button className={styles.actionBtn} whileTap={{ scale: 0.96 }}
              onClick={() => window.open(place.website!, "_blank")}>
              <span className={styles.actionIcon}><Globe size={14} /></span>
              Сайт
            </motion.button>
          )}
          {place.phone && (
            <motion.button className={styles.actionBtn} whileTap={{ scale: 0.96 }}
              onClick={() => window.open(`tel:${place.phone}`)}>
              <span className={styles.actionIcon}><Phone size={14} /></span>
              Позвонить
            </motion.button>
          )}
        </div>

        {/* ── Photo Slider ── */}
        {photos.length > 0 && (
          <motion.div
            className={styles.slider}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Swiper
              modules={[Pagination]}
              pagination={{ clickable: true }}
              spaceBetween={0}
              slidesPerView={1}
              className={styles.swiper}
            >
              {photos.map((photo, i) => (
                <SwiperSlide key={i}>
                  <div className={styles.slideImage}>
                    <AppImage
                      src={imgSrc(photo)}
                      alt={`${safeText(place.title)} ${i + 1}`}
                      fill
                      unoptimized
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            {photos.length > 1 && (
              <span className={styles.slideCount}>{photos.length} фото</span>
            )}
          </motion.div>
        )}

        {/* ── Description ── */}
        {paragraphs.length > 0 && (
          <motion.div className={styles.description}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            {paragraphs.map((p, i) => (
              <p key={i} className={styles.descParagraph}>{p}</p>
            ))}
          </motion.div>
        )}

        {/* ── Rating ── */}
        {place.rating?.avg && (
          <div className={styles.ratingBlock}>
            <div className={styles.ratingBig}>
              <Star size={20} fill="#f59e0b" color="#f59e0b" />
              <span className={styles.ratingValue}>{place.rating.avg.toFixed(1)}</span>
            </div>
            <span className={styles.ratingCount}>{place.rating.count} отзывов</span>
          </div>
        )}

        {/* ── Info Chips ── */}
        <div className={styles.infoChips}>
          {place.city && (
            <span className={styles.infoChip}><MapPin size={12} /> {safeText(place.city)}</span>
          )}
          {place.region && (
            <span className={styles.infoChip}>🗺️ {safeText(place.region)}</span>
          )}
          {season && (
            <span className={styles.infoChip}>{seasonEmoji(place.season)} {season}</span>
          )}
          {price && (
            <span className={styles.infoChip}>💰 {price}</span>
          )}
          {place.needCar && (
            <span className={styles.infoChip}>🚗 Нужна машина</span>
          )}
          {place.durationHours && (
            <span className={styles.infoChip}><Clock size={12} /> ~{place.durationHours}ч</span>
          )}
          {place.verified && (
            <span className={styles.infoChipVerified}>✓ Проверено</span>
          )}
          {place.interests?.map((i) => (
            <span key={i.id} className={styles.infoChip}>{i.emoji} {i.name}</span>
          ))}
        </div>

        {/* ── AI Recommendation ── */}
        {aiData?.recommendation && (
          <motion.div className={styles.aiBlock}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <p className={styles.aiLabel}>🤖 AI-РЕКОМЕНДАЦИЯ</p>
            <p className={styles.aiText}>{aiData.recommendation}</p>
          </motion.div>
        )}

        {/* ── Schedule ── */}
        {place.schedule && place.schedule.length > 0 && (
          <div className={styles.scheduleBlock}>
            <h3 className={styles.miniTitle}>Расписание</h3>
            <div className={styles.scheduleGrid}>
              {place.schedule.map((s, i) => (
                <div key={i} className={styles.scheduleRow}>
                  <span className={styles.scheduleDay}>{WEEKDAYS[s.dayOfWeek] ?? s.dayOfWeek}</span>
                  <span className={styles.scheduleTime}>{s.open} — {s.close}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Address ── */}
        {place.address && (
          <div className={styles.addressBlock}>
            <h3 className={styles.miniTitle}>Адрес</h3>
            <p className={styles.addressText}>{place.address}</p>
          </div>
        )}

        {/* ── Mini Map ── */}
        {place.lat && place.lng && (
          <div className={styles.miniMap}>
            <MapView
              ref={mapRef}
              center={[place.lng, place.lat]}
              zoom={14}
              interactive={false}
              className={styles.miniMapInner}
              onLoad={handleMapLoad}
            />
          </div>
        )}

        {/* ── Reviews ── */}
        {place.reviews && place.reviews.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Отзывы ({place.reviews.length})</h2>
            <div className={styles.reviewsList}>
              {place.reviews.map((review, i) => (
                <motion.div key={i} className={styles.reviewCard}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star key={si} size={12}
                          fill={si < review.rating ? "#f59e0b" : "none"}
                          color={si < review.rating ? "#f59e0b" : "#e5e7eb"} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className={styles.reviewText}>{review.comment}</p>}
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* ── Nearby Places ── */}
        {place.nearby && place.nearby.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>Рядом</h2>
            <div className={styles.nearbyList}>
              {place.nearby.map((np, i) => (
                <motion.button key={np.id} className={styles.nearbyRow}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 * i }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/place/${np.id}`)}>
                  <div className={styles.nearbyThumb}>
                    {np.photo ? (
                      <AppImage src={imgSrc(np.photo)} alt={np.title} fill unoptimized style={{ objectFit: "cover" }} />
                    ) : (
                      <div className={styles.nearbyThumbEmpty}><MapPin size={16} /></div>
                    )}
                  </div>
                  <div className={styles.nearbyInfo}>
                    <h3 className={styles.nearbyName}>{np.title}</h3>
                    <p className={styles.nearbyMeta}>{np.distanceKm.toFixed(1)} км</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}

        <div style={{ height: 100 }} />
      </div>
      <BottomBar />
    </div>
  )
}
