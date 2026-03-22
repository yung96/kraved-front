"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles, MapPin, Check, ChevronRight, ArrowLeft,
  Newspaper, BookOpen, UserCircle, Zap, Loader2,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { skipToken } from "@reduxjs/toolkit/query/react"
import {
  useListFilterCitiesQuery,
  useListInterestsQuery,
  useListMyInterestsQuery,
  useGenerateIvanAltRouteMutation,
  useCompleteOnboardingMutation,
  useGetUserSavedRouteQuery,
} from "@/store/kraevedApi"
import { auth } from "@/lib/auth"
import { imgSrc } from "@/lib/api"
import type { FilterCity, AiRouteMetaStop } from "@/lib/types"
import styles from "./onboarding.module.css"

function captionForStop(postId: number, stops: AiRouteMetaStop[] | undefined): string | null {
  if (!stops) return null
  return stops.find((s) => s.postId === postId)?.caption ?? null
}

function parseCityCentroid(centroid: string | null): { lat: number; lng: number } | null {
  if (!centroid?.trim()) return null
  const parts = centroid.split(",").map((s) => s.trim())
  if (parts.length < 2) return null
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

type Step = "city" | "interests" | "generating" | "done"

export default function OnboardingPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => {
    setLoggedIn(auth.isLoggedIn())
    return auth.subscribe(() => setLoggedIn(auth.isLoggedIn()))
  }, [])

  const [step, setStep] = useState<Step>("city")
  const [cityQuery, setCityQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState<FilterCity | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<Set<number>>(new Set())
  const [generatedRouteId, setGeneratedRouteId] = useState<number | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const { data: filterCitiesRaw } = useListFilterCitiesQuery()
  const { data: interestsData } = useListInterestsQuery({ pageSize: 50 })
  const { data: myInterests } = useListMyInterestsQuery(loggedIn ? undefined : skipToken)
  const [generateIvanAlt] = useGenerateIvanAltRouteMutation()
  const [completeOnboarding] = useCompleteOnboardingMutation()

  const { data: routeData, isLoading: routeLoading } = useGetUserSavedRouteQuery(
    generatedRouteId != null ? generatedRouteId : skipToken,
  )
  const postById = useMemo(() => {
    const m = new Map()
    if (routeData?.posts) for (const p of routeData.posts) m.set(p.id, p)
    return m
  }, [routeData])

  useEffect(() => {
    if (myInterests && myInterests.length > 0 && selectedInterests.size === 0) {
      setSelectedInterests(new Set(myInterests.map((i) => i.id)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myInterests])

  const cities = useMemo(() => {
    const list = filterCitiesRaw ?? []
    return list
      .filter((c) => c.placesCount > 0 && c.centroid)
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [filterCitiesRaw])

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase()
    if (!q) return cities.slice(0, 20)
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 15)
  }, [cities, cityQuery])

  const interests = interestsData?.items ?? []

  function toggleInterest(id: number) {
    setSelectedInterests((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleGenerate() {
    setGenerateError(null)
    setStep("generating")

    if (!loggedIn || !selectedCity) {
      await new Promise((r) => setTimeout(r, 2200))
      setStep("done")
      return
    }

    const ll = parseCityCentroid(selectedCity.centroid)
    if (!ll) {
      await new Promise((r) => setTimeout(r, 2200))
      setStep("done")
      return
    }

    const interestIds = Array.from(selectedInterests)
    try {
      if (interestIds.length > 0) {
        await completeOnboarding({ interestIds }).unwrap()
      }
      const res = await generateIvanAlt({
        startLat: ll.lat,
        startLng: ll.lng,
        startLabel: selectedCity.name,
        n: 12,
        interestWeights: interestIds.map((id) => ({ interestId: id, weight: 100 })),
        bboxDeltaDegrees: 0.38,
        save: true,
        skipLlm: false,
      }).unwrap()
      if (res.savedRouteId != null) setGeneratedRouteId(res.savedRouteId)
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "data" in e && e.data &&
        typeof e.data === "object" && "detail" in e.data
          ? String((e.data as { detail: unknown }).detail)
          : "Не удалось сгенерировать маршрут"
      setGenerateError(msg)
    }
    setStep("done")
  }

  const stepNum = step === "city" ? 0 : step === "interests" ? 1 : 2

  return (
    <div className={styles.page}>
      {step !== "done" && (
        <div className={styles.progress}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${styles.progressDot} ${
                i === stepNum ? styles.progressDotActive : i < stepNum ? styles.progressDotPast : ""
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "city" && (
          <motion.div
            key="city"
            className={styles.step}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25 }}
          >
            <div className={styles.stepHeader}>
              <div className={styles.stepIconWrap}>
                <MapPin size={22} />
              </div>
              <h1 className={styles.stepTitle}>Выберите город</h1>
              <p className={styles.stepSub}>Подберём маршрут с лучшими местами рядом</p>
            </div>

            <div className={styles.citySearch}>
              <input
                className={styles.cityInput}
                placeholder="Начните вводить название…"
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value)
                  if (selectedCity && e.target.value !== selectedCity.name) setSelectedCity(null)
                }}
                autoFocus
              />
              <ul className={styles.cityList}>
                {filteredCities.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`${styles.cityItem} ${selectedCity?.id === c.id ? styles.cityItemActive : ""}`}
                      onClick={() => { setSelectedCity(c); setCityQuery(c.name) }}
                    >
                      <MapPin size={13} className={styles.cityItemIcon} />
                      <span>{c.name}</span>
                      <span className={styles.cityCount}>{c.placesCount} мест</span>
                      {selectedCity?.id === c.id && <Check size={14} className={styles.cityCheck} />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.stepFooter}>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={!selectedCity}
                onClick={() => setStep("interests")}
              >
                Далее
                <ChevronRight size={18} />
              </button>
              <button type="button" className={styles.ghostBtn} onClick={() => setStep("interests")}>
                Пропустить
              </button>
            </div>
          </motion.div>
        )}

        {step === "interests" && (
          <motion.div
            key="interests"
            className={styles.step}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25 }}
          >
            <div className={styles.stepHeader}>
              <button type="button" className={styles.backBtn} onClick={() => setStep("city")}>
                <ArrowLeft size={15} />
                Назад
              </button>
              <div className={styles.stepIconWrap} data-accent="green">
                <Sparkles size={22} />
              </div>
              <h1 className={styles.stepTitle}>Что вас интересует?</h1>
              <p className={styles.stepSub}>
                {selectedCity
                  ? `Маршрут по ${selectedCity.name} — выберите темы`
                  : "ИИ подберёт места под ваши интересы"}
              </p>
            </div>

            <div className={styles.chipsGrid}>
              {interests.map((interest) => {
                const isSelected = selectedInterests.has(interest.id)
                return (
                  <motion.button
                    key={interest.id}
                    type="button"
                    className={`${styles.chip} ${isSelected ? styles.chipSelected : ""}`}
                    onClick={() => toggleInterest(interest.id)}
                    whileTap={{ scale: 0.93 }}
                    layout
                  >
                    <span className={styles.chipEmoji}>{interest.emoji}</span>
                    <span className={styles.chipName}>{interest.name}</span>
                    {isSelected && <Check size={13} className={styles.chipCheck} />}
                  </motion.button>
                )
              })}
            </div>

            <div className={styles.stepFooter}>
              <motion.button
                type="button"
                className={styles.primaryBtn}
                onClick={handleGenerate}
                whileTap={{ scale: 0.97 }}
              >
                <Sparkles size={17} />
                Сгенерировать маршрут
              </motion.button>
              {selectedInterests.size > 0 && (
                <span className={styles.selCount}>Выбрано: {selectedInterests.size}</span>
              )}
            </div>
          </motion.div>
        )}

        {step === "generating" && (
          <motion.div
            key="generating"
            className={`${styles.step} ${styles.stepCenter}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.generatingWrap}>
              <motion.div
                className={styles.generatingOrb}
                animate={{ scale: [1, 1.1, 1], opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles size={40} />
              </motion.div>
              <h2 className={styles.generatingTitle}>Составляем маршрут</h2>
              <p className={styles.generatingSub}>
                {selectedCity
                  ? `ИИ подбирает лучшие места ${selectedCity.name}…`
                  : "ИИ подбирает места по вашим интересам…"}
              </p>
              <div className={styles.generatingDots}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className={styles.generatingDot}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            className={styles.step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* ── Header ── */}
            <div className={styles.doneHero}>
              <motion.div
                className={styles.doneCheck}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.1 }}
              >
                <Check size={30} strokeWidth={3} />
              </motion.div>
              <h1 className={styles.doneTitle}>
                {generatedRouteId ? "Маршрут готов!" : "Добро пожаловать!"}
              </h1>
              {routeData?.title && (
                <p className={styles.doneRouteTitle}>{routeData.title}</p>
              )}
              {generateError && <p className={styles.generateError}>{generateError}</p>}
            </div>

            {/* ── Inline route preview ── */}
            {generatedRouteId && (
              <div className={styles.routePreview}>
                {routeLoading && (
                  <div className={styles.routeLoading}>
                    <Loader2 size={20} className={styles.routeSpinner} />
                    <span>Загружаем маршрут…</span>
                  </div>
                )}
                {routeData?.aiRouteMeta?.intro && (
                  <p className={styles.routeIntro}>{routeData.aiRouteMeta.intro}</p>
                )}
                {routeData && (
                  <ol className={styles.routeStops}>
                    {routeData.postIds.map((postId, idx) => {
                      const post = postById.get(postId)
                      const cap = captionForStop(postId, routeData.aiRouteMeta?.stops)
                      const photo = post?.photos?.[0]
                      return (
                        <li key={postId} className={styles.routeStop}>
                          <div className={styles.routeStopNum}>{idx + 1}</div>
                          <div className={styles.routeStopCard}>
                            {photo && (
                              <img
                                className={styles.routeStopThumb}
                                src={imgSrc(photo)}
                                alt=""
                              />
                            )}
                            <div className={styles.routeStopBody}>
                              <span className={styles.routeStopTitle}>
                                {post?.title ?? `Место #${postId}`}
                              </span>
                              {cap && (
                                <span className={styles.routeStopCaption}>{cap}</span>
                              )}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            )}

            {/* ── CTA banner ── */}
            <div className={styles.ctaBanner}>
              <p className={styles.ctaBannerText}>
                {generatedRouteId
                  ? "В приложении ещё лента, рекомендации, путеводители и много другого"
                  : "Войдите, чтобы сохранять маршруты и получать рекомендации"}
              </p>
              <div className={styles.ctaCards}>
                {!loggedIn && (
                  <Link href="/login" className={styles.ctaCardPrimary}>
                    <div className={styles.ctaCardIcon}><UserCircle size={20} /></div>
                    <div className={styles.ctaCardText}>
                      <strong>Войти / Зарегистрироваться</strong>
                      <small>Сохраняйте маршруты, получайте рекомендации</small>
                    </div>
                    <ChevronRight size={16} />
                  </Link>
                )}

                {generatedRouteId && (
                  <Link href={`/route/saved/${generatedRouteId}`} className={styles.ctaCardPrimary}>
                    <div className={styles.ctaCardIcon}><BookOpen size={20} /></div>
                    <div className={styles.ctaCardText}>
                      <strong>Открыть путеводитель</strong>
                      <small>Полная версия с картой и деталями</small>
                    </div>
                    <ChevronRight size={16} />
                  </Link>
                )}

                <Link href="/" className={styles.ctaCard}>
                  <div className={styles.ctaCardIcon}><Newspaper size={20} /></div>
                  <div className={styles.ctaCardText}>
                    <strong>Лента</strong>
                    <small>Места, события и маршруты рядом</small>
                  </div>
                  <ChevronRight size={16} />
                </Link>

                <Link href="/route/create" className={styles.ctaCard}>
                  <div className={styles.ctaCardIcon}><Sparkles size={20} /></div>
                  <div className={styles.ctaCardText}>
                    <strong>Путеводители</strong>
                    <small>Создавайте маршруты с помощью ИИ</small>
                  </div>
                  <ChevronRight size={16} />
                </Link>

                {loggedIn && (
                  <Link href="/profile" className={styles.ctaCard}>
                    <div className={styles.ctaCardIcon}><Zap size={20} /></div>
                    <div className={styles.ctaCardText}>
                      <strong>Рекомендации</strong>
                      <small>Алгоритм учитывает ваши интересы</small>
                    </div>
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
