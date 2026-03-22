"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Sparkles, ArrowRight, Check, ChevronDown, Navigation, Clock, Camera } from "lucide-react"
import { useListCitiesQuery, useListPostsQuery, useListInterestsQuery } from "@/store/kraevedApi"
import { imgSrc } from "@/lib/api"
import { auth } from "@/lib/auth"
import { BrandMark } from "@/components/BrandMark/BrandMark"
import AuthModal from "@/components/AuthModal/AuthModal"
import AppImage from "@/components/ui/AppImage/AppImage"
import styles from "./welcome.module.css"

const GRADIENTS = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  "linear-gradient(135deg, #2d1b69 0%, #11998e 100%)",
  "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  "linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)",
]

type Step = "form" | "generating" | "result"

const DURATION_OPTIONS = [
  { label: "Один день", value: "1" },
  { label: "2–3 дня", value: "2-3" },
  { label: "Неделя", value: "7" },
]

const LOADING_MESSAGES = [
  "Анализируем ваши предпочтения…",
  "Подбираем лучшие места…",
  "Выстраиваем оптимальный маршрут…",
  "Почти готово…",
]

export default function WelcomePage() {
  const router = useRouter()

  // If already logged in — skip to feed
  useEffect(() => {
    if (auth.isLoggedIn()) {
      router.replace("/")
    }
  }, [router])

  const { data: citiesData } = useListCitiesQuery()
  const { data: interestsData } = useListInterestsQuery({ pageSize: 50 })

  const cities = citiesData ?? []
  const interests = useMemo(() => interestsData?.items ?? [], [interestsData])

  // Form state
  const [step, setStep] = useState<Step>("form")
  const [selectedCity, setSelectedCity] = useState("")
  const [cityOpen, setCityOpen] = useState(false)
  const [citySearch, setCitySearch] = useState("")
  const [selectedDuration, setSelectedDuration] = useState("1")
  const [selectedInterests, setSelectedInterests] = useState<Set<number>>(new Set())
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [showAuth, setShowAuth] = useState(false)

  // Route query (triggered after city is chosen)
  const [queryCity, setQueryCity] = useState<string | undefined>(undefined)
  const { data: postsData } = useListPostsQuery(
    { pageSize: 8, city: queryCity },
    { skip: !queryCity }
  )
  const routePlaces = useMemo(() => postsData?.items?.slice(0, 5) ?? [], [postsData])

  // Filtered cities for dropdown
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities.slice(0, 12)
    const q = citySearch.toLowerCase()
    return cities.filter((c) => c.toLowerCase().includes(q)).slice(0, 12)
  }, [cities, citySearch])

  // Loading message ticker
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startGenerating() {
    if (!selectedCity) return
    setQueryCity(selectedCity)
    setStep("generating")
    setLoadingMsgIdx(0)

    intervalRef.current = setInterval(() => {
      setLoadingMsgIdx((i) => {
        if (i >= LOADING_MESSAGES.length - 1) {
          clearInterval(intervalRef.current!)
          return i
        }
        return i + 1
      })
    }, 900)

    // Show result after 3.5s
    setTimeout(() => {
      clearInterval(intervalRef.current!)
      setStep("result")
    }, 3600)
  }

  function handleAuthSuccess() {
    localStorage.setItem("kraevd_welcome_seen", "1")
    setShowAuth(false)
    router.push("/")
  }

  function toggleInterest(id: number) {
    setSelectedInterests((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={styles.page}>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />

      {/* ── Step 1: Form ── */}
      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div
            key="form"
            className={styles.formStep}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35 }}
          >
            {/* Logo */}
            <BrandMark className={styles.logo} />

            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <Sparkles size={22} color="#22EA36" />
                <h1 className={styles.formTitle}>
                  Давайте подберём ваш индивидуальный маршрут
                </h1>
                <p className={styles.formSub}>
                  Укажите несколько деталей — мы составим персональный маршрут по самым интересным местам
                </p>
              </div>

              {/* City selector */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <MapPin size={14} /> Куда едете?
                </label>
                <div className={styles.selectWrap}>
                  <button
                    className={`${styles.selectBtn} ${selectedCity ? styles.selectBtnFilled : ""}`}
                    onClick={() => setCityOpen((v) => !v)}
                    type="button"
                  >
                    {selectedCity || "Выберите город"}
                    <ChevronDown
                      size={16}
                      style={{ transform: cityOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}
                    />
                  </button>
                  <AnimatePresence>
                    {cityOpen && (
                      <motion.div
                        className={styles.dropdown}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <input
                          className={styles.dropdownSearch}
                          placeholder="Найти город…"
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          autoFocus
                        />
                        <div className={styles.dropdownList}>
                          {filteredCities.map((city) => (
                            <button
                              key={city}
                              className={`${styles.dropdownItem} ${city === selectedCity ? styles.dropdownItemActive : ""}`}
                              onClick={() => {
                                setSelectedCity(city)
                                setCityOpen(false)
                                setCitySearch("")
                              }}
                            >
                              {city === selectedCity && <Check size={13} />}
                              {city}
                            </button>
                          ))}
                          {filteredCities.length === 0 && (
                            <span className={styles.dropdownEmpty}>Ничего не найдено</span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Duration */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <Clock size={14} /> Продолжительность
                </label>
                <div className={styles.durationRow}>
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.durationBtn} ${selectedDuration === opt.value ? styles.durationBtnActive : ""}`}
                      onClick={() => setSelectedDuration(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              {interests.length > 0 && (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <Sparkles size={14} /> Что интересует? <span className={styles.fieldLabelOpt}>(необязательно)</span>
                  </label>
                  <div className={styles.interestChips}>
                    {interests.slice(0, 16).map((interest) => {
                      const sel = selectedInterests.has(interest.id)
                      return (
                        <button
                          key={interest.id}
                          className={`${styles.chip} ${sel ? styles.chipActive : ""}`}
                          onClick={() => toggleInterest(interest.id)}
                        >
                          <span>{interest.emoji}</span>
                          <span>{interest.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <motion.button
                className={styles.generateBtn}
                onClick={startGenerating}
                disabled={!selectedCity}
                whileTap={{ scale: 0.97 }}
              >
                Подобрать маршрут
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Generating ── */}
        {step === "generating" && (
          <motion.div
            key="generating"
            className={styles.generatingStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BrandMark className={styles.genLogo} />
            <div className={styles.genPulse}>
              <div className={styles.genRing} />
              <div className={styles.genRing2} />
              <div className={styles.genCenter}>
                <Navigation size={28} color="#22EA36" />
              </div>
            </div>
            <h2 className={styles.genTitle}>
              {LOADING_MESSAGES[loadingMsgIdx]}
            </h2>
            <p className={styles.genCity}>
              Маршрут по <strong>{selectedCity}</strong>
            </p>
            <div className={styles.genDots}>
              {LOADING_MESSAGES.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.genDot} ${i === loadingMsgIdx ? styles.genDotActive : i < loadingMsgIdx ? styles.genDotDone : ""}`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Result ── */}
        {step === "result" && (
          <motion.div
            key="result"
            className={styles.resultStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.resultHeader}>
              <BrandMark className={styles.logo} />
              <div className={styles.resultBadge}>
                <Sparkles size={13} />
                Маршрут готов
              </div>
              <h2 className={styles.resultTitle}>
                Ваш маршрут<br />по <span className={styles.resultCity}>{selectedCity}</span>
              </h2>
              <p className={styles.resultDuration}>
                <Clock size={13} />
                {DURATION_OPTIONS.find((o) => o.value === selectedDuration)?.label}
                {selectedInterests.size > 0 && ` · ${selectedInterests.size} интереса`}
              </p>
            </div>

            {/* Route places */}
            <div className={styles.routeList}>
              {routePlaces.length === 0 ? (
                // Fallback skeleton if no places
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.routeItemSkeleton} />
                ))
              ) : (
                routePlaces.map((place, i) => (
                  <motion.div
                    key={place.id}
                    className={styles.routeItem}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.35 }}
                  >
                    <div className={styles.routeItemNum}>{i + 1}</div>
                    <div className={styles.routeItemPhoto}>
                      {place.photos?.[0] ? (
                        <AppImage
                          src={imgSrc(place.photos[0])}
                          alt={place.title}
                          fill
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      ) : (
                        <div
                          className={styles.routeItemPhotoFallback}
                          style={{ background: GRADIENTS[i % GRADIENTS.length] }}
                        >
                          <Camera size={18} color="rgba(255,255,255,0.5)" />
                        </div>
                      )}
                    </div>
                    <div className={styles.routeItemInfo}>
                      <span className={styles.routeItemTitle}>{place.title}</span>
                      {place.city && (
                        <span className={styles.routeItemCity}>
                          <MapPin size={11} /> {place.city}
                        </span>
                      )}
                      {place.description && (
                        <span className={styles.routeItemDesc}>
                          {place.description.length > 80
                            ? place.description.slice(0, 80) + "…"
                            : place.description}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* CTA */}
            <motion.div
              className={styles.ctaBlock}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className={styles.ctaInner}>
                <div className={styles.ctaIconRow}>
                  <span className={styles.ctaIcon}>🗺️</span>
                  <span className={styles.ctaIcon}>⭐</span>
                  <span className={styles.ctaIcon}>🤝</span>
                </div>
                <h3 className={styles.ctaTitle}>
                  У нас ещё есть много интересного
                </h3>
                <p className={styles.ctaSub}>
                  Войдите, чтобы сохранить маршрут, открыть персональную ленту мест, подписаться на авторов и многое другое
                </p>
                <motion.button
                  className={styles.ctaBtn}
                  onClick={() => setShowAuth(true)}
                  whileTap={{ scale: 0.97 }}
                >
                  Войти и продолжить
                  <ArrowRight size={18} />
                </motion.button>
                <button
                  className={styles.ctaSkip}
                  onClick={() => {
                    localStorage.setItem("kraevd_welcome_seen", "1")
                    router.push("/")
                  }}
                >
                  Продолжить без входа
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
