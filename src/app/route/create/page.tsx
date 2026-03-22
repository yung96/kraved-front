"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { skipToken } from "@reduxjs/toolkit/query/react"
import {
  ChevronDown,
  Plus,
  Sparkles,
  ListOrdered,
  X,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  ChevronRight,
  Trash2,
  BookOpen,
} from "lucide-react"
import {
  useListFilterCitiesQuery,
  useListUserSavedRoutesQuery,
  useListMyInterestsQuery,
  useListPostsQuery,
  useGenerateIvanAltRouteMutation,
  useCreateUserSavedRouteMutation,
} from "@/store/kraevedApi"
import { BrandMark } from "@/components/BrandMark/BrandMark"
import { auth } from "@/lib/auth"
import { searchGeocode } from "@/lib/geocoding"
import type { GeocodeSearchResult } from "@/lib/geocoding"
import type { FilterCity, PostResponse } from "@/lib/types"
import { ruPlacesCount } from "@/lib/plurals"
import BottomBar from "@/components/ui/BottomBar/BottomBar"
import styles from "./create.module.css"

type ModalMode = null | "pick" | "ai" | "manual"

/** Сколько мест-кандидатов отобрать в городе до LLM; порядок и подписи задаёт модель. */
const IVAN_ALT_AUTO_CANDIDATES_N = 12
/** Полуразмер bbox вокруг центра города (одна агломерация в БД). */
const IVAN_ALT_CITY_BBOX_DELTA = 0.38

function parseCityCentroid(centroid: string | null): { lat: number; lng: number } | null {
  if (!centroid?.trim()) return null
  const parts = centroid.split(",").map((s) => s.trim())
  if (parts.length < 2) return null
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function citiesForGuide(list: FilterCity[] | undefined): FilterCity[] {
  if (!list?.length) return []
  return list
    .filter((c) => c.centroid && c.placesCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
}

// ── Main: путеводитель + модалки ─────────────────────────────────────────────

function useDebounced<T>(value: T, ms: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return d
}

export default function CreateRoutePage() {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => {
    setLoggedIn(auth.isLoggedIn())
    return auth.subscribe(() => setLoggedIn(auth.isLoggedIn()))
  }, [])

  const { data: savedList, isFetching: savedLoading } = useListUserSavedRoutesQuery(
    loggedIn ? { page: 1, pageSize: 50 } : skipToken,
  )
  const { data: myInterests } = useListMyInterestsQuery(loggedIn ? undefined : skipToken)
  const { data: filterCitiesRaw } = useListFilterCitiesQuery()
  const guideCities = useMemo(() => citiesForGuide(filterCitiesRaw), [filterCitiesRaw])

  const [modal, setModal] = useState<ModalMode>(null)

  // ── AI: один город из БД (центроид из GeoRegion), длина цепочки — на стороне модели (кандидаты авто) ──
  const [aiCityId, setAiCityId] = useState<number | "">("")
  const [aiError, setAiError] = useState<string | null>(null)
  const [generateIvanAlt, { isLoading: aiLoading }] = useGenerateIvanAltRouteMutation()

  const runAiGenerate = async () => {
    setAiError(null)
    if (!loggedIn) {
      setAiError("Войдите в аккаунт, чтобы сохранять путеводители.")
      return
    }
    if (!myInterests?.length) {
      setAiError("Добавьте интересы в профиле или пройдите онбординг — без них генерация недоступна.")
      return
    }
    if (aiCityId === "") {
      setAiError("Выберите город из списка.")
      return
    }
    const city = guideCities.find((c) => c.id === aiCityId)
    if (!city) {
      setAiError("Город не найден в списке.")
      return
    }
    const ll = parseCityCentroid(city.centroid)
    if (!ll) {
      setAiError("В базе нет координат центра для этого города — выберите другой.")
      return
    }
    const startLabel = `Путеводитель: ${city.name}`
    const interestWeights = myInterests.map((it) => ({
      interestId: it.id,
      weight: Math.min(1000, Math.max(1, it.weight)),
    }))

    try {
      const res = await generateIvanAlt({
        startLat: ll.lat,
        startLng: ll.lng,
        startLabel,
        n: IVAN_ALT_AUTO_CANDIDATES_N,
        interestWeights,
        bboxDeltaDegrees: IVAN_ALT_CITY_BBOX_DELTA,
        save: true,
        skipLlm: false,
      }).unwrap()

      if (res.savedRouteId != null) {
        setModal(null)
        router.push(`/route/saved/${res.savedRouteId}`)
        return
      }
      setAiError("Путеводитель сгенерирован, но не сохранён. Попробуйте ещё раз или обратитесь в поддержку.")
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "data" in e &&
        e.data &&
        typeof e.data === "object" &&
        "detail" in e.data
          ? String((e.data as { detail: unknown }).detail)
          : "Не удалось сгенерировать путеводитель."
      setAiError(msg)
    }
  }

  // ── Manual chain ──
  const [manualFilterCityId, setManualFilterCityId] = useState<number | "">("")
  const manualFilterCityName = useMemo(() => {
    if (manualFilterCityId === "") return ""
    return guideCities.find((c) => c.id === manualFilterCityId)?.name ?? ""
  }, [manualFilterCityId, guideCities])

  const [startQuery, setStartQuery] = useState("")
  const [startPick, setStartPick] = useState<GeocodeSearchResult | null>(null)
  const [startCandidates, setStartCandidates] = useState<GeocodeSearchResult[]>([])
  const [postSearch, setPostSearch] = useState("")
  const debouncedSearch = useDebounced(postSearch, 350)
  const { data: searchPosts } = useListPostsQuery(
    debouncedSearch.trim().length >= 2
      ? {
          search: debouncedSearch.trim(),
          page: 1,
          pageSize: 15,
          ...(manualFilterCityName ? { city: manualFilterCityName } : {}),
        }
      : skipToken,
  )
  const [chain, setChain] = useState<PostResponse[]>([])
  const [manualError, setManualError] = useState<string | null>(null)
  const [createSaved, { isLoading: manualSaving }] = useCreateUserSavedRouteMutation()

  const lookupStart = useCallback(async () => {
    setManualError(null)
    const q = startQuery.trim()
    if (!q) {
      setStartCandidates([])
      setStartPick(null)
      return
    }
    const r = await searchGeocode(q, 5)
    setStartCandidates(r)
    setStartPick(r[0] ?? null)
    if (!r.length) setManualError("Точку старта не нашли. Попробуйте другое название.")
  }, [startQuery])

  const addToChain = (p: PostResponse) => {
    setChain((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]))
  }

  const moveChain = (index: number, dir: -1 | 1) => {
    setChain((prev) => {
      const j = index + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }

  const removeFromChain = (id: number) => {
    setChain((prev) => prev.filter((p) => p.id !== id))
  }

  const submitManual = async () => {
    setManualError(null)
    if (!loggedIn) {
      setManualError("Войдите в аккаунт.")
      return
    }
    if (!startPick) {
      setManualError("Выберите город из списка или найдите точку старта кнопкой «Найти на карте».")
      return
    }
    if (chain.length === 0) {
      setManualError("Добавьте хотя бы одно место в цепочку.")
      return
    }
    try {
      const created = await createSaved({
        startLat: startPick.lat,
        startLng: startPick.lng,
        startLabel: startPick.displayName,
        postIds: chain.map((p) => p.id),
      }).unwrap()
      setModal(null)
      setChain([])
      setStartPick(null)
      setStartQuery("")
      router.push(`/route/saved/${created.id}`)
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "data" in e &&
        e.data &&
        typeof e.data === "object" &&
        "detail" in e.data
          ? String((e.data as { detail: unknown }).detail)
          : "Не удалось сохранить путеводитель."
      setManualError(msg)
    }
  }

  const savedItems = savedList?.items ?? []

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.headerPill} type="button">
          <BrandMark className={styles.pillLogo} />
          <span className={styles.pillLabel}>путеводитель</span>
          <ChevronDown size={14} color="#858585" />
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Путеводитель</h1>
          <p className={styles.subtitle}>
            Подбор мест из базы по вашим интересам — это не поездка «из А в Б», а гид по городу. Если в текущем городе
            мало интересных точек для генерации, в путеводитель могут предлагаться места из соседних городов.
          </p>
        </div>

        <button type="button" className={styles.addRouteBtn} onClick={() => setModal("pick")}>
          <Plus size={18} strokeWidth={2.5} />
          Новый путеводитель
        </button>

        {!loggedIn && (
          <div className={styles.emptyState}>
            <BookOpen size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Войдите, чтобы создавать путеводители</p>
            <p className={styles.emptyHint}>Сохраняйте маршруты и возвращайтесь к ним в любое время</p>
          </div>
        )}

        {loggedIn && (
          <section className={styles.savedSection}>
            <h2 className={styles.savedHeading}>Сохранённые</h2>
            {savedLoading && <p className={styles.hintMuted}>Загрузка…</p>}
            {!savedLoading && savedItems.length === 0 && (
              <div className={styles.emptyState}>
                <BookOpen size={32} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Нет сохранённых путеводителей</p>
                <p className={styles.emptyHint}>Нажмите «Новый путеводитель», чтобы создать первый</p>
              </div>
            )}
            <ul className={styles.savedList}>
              {savedItems.map((r) => (
                <li key={r.id}>
                  <Link href={`/route/saved/${r.id}`} className={styles.savedCard}>
                    <div className={styles.savedCardTop}>
                      <span className={styles.savedTitle}>{r.title || r.startLabel || `Путеводитель №${r.id}`}</span>
                      <div className={styles.savedCardRight}>
                        {r.aiGenerated && (
                          <span className={styles.badgeAi}>
                            <Sparkles size={9} />
                            ИИ
                          </span>
                        )}
                        <ChevronRight size={16} className={styles.savedCardArrow} />
                      </div>
                    </div>
                    <span className={styles.savedMeta}>
                      {r.postIds.length} {r.postIds.length === 1 ? "точка" : r.postIds.length < 5 ? "точки" : "точек"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {modal && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setModal(null)}
        >
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {modal === "pick" && "Новый путеводитель"}
                {modal === "ai" && "Гид по городу"}
                {modal === "manual" && "Своя цепочка"}
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Закрыть"
                onClick={() => setModal(null)}
              >
                <X size={22} />
              </button>
            </div>

            {modal === "pick" && (
              <div className={styles.modalBody}>
                <button
                  type="button"
                  className={styles.modeChoice}
                  onClick={() => setModal("ai")}
                >
                  <span className={styles.modeChoiceIconWrap} data-variant="ai">
                    <Sparkles size={20} />
                  </span>
                  <span className={styles.modeChoiceText}>
                    <strong>Сгенерировать с моими интересами</strong>
                    <small>
                      Город из базы; при нехватке мест под ваши интересы возможны точки из соседних городов
                    </small>
                  </span>
                  <ChevronRight size={16} className={styles.modeChoiceArrow} />
                </button>
                <button
                  type="button"
                  className={styles.modeChoice}
                  onClick={() => setModal("manual")}
                >
                  <span className={styles.modeChoiceIconWrap} data-variant="manual">
                    <ListOrdered size={20} />
                  </span>
                  <span className={styles.modeChoiceText}>
                    <strong>Собрать цепочку самому</strong>
                    <small>Старт и поиск мест по названию</small>
                  </span>
                  <ChevronRight size={16} className={styles.modeChoiceArrow} />
                </button>
              </div>
            )}

            {modal === "ai" && (
              <div className={styles.modalBody}>
                <label className={styles.fieldLabel}>Город (из базы приложения)</label>
                <select
                  className={styles.input}
                  value={aiCityId === "" ? "" : String(aiCityId)}
                  onChange={(e) => {
                    const v = e.target.value
                    setAiCityId(v === "" ? "" : Number(v))
                  }}
                >
                  <option value="">Выберите город…</option>
                  {guideCities.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} ({ruPlacesCount(c.placesCount)})
                    </option>
                  ))}
                </select>
                {guideCities.length === 0 && (
                  <p className={styles.hintMuted}>Нет городов с местами и координатами в базе.</p>
                )}
                <p className={styles.hintMuted}>
                  Ищем точки по вашим интересам, в приоритете выбранный город. Если в нём мало подходящих мест для
                  путеводителя, могут предлагаться интересные точки из соседних городов. Нейросеть расставит порядок и
                  подписи; длину цепочки подбирает модель автоматически.
                </p>
                {aiError && <p className={styles.formError}>{aiError}</p>}
                <button
                  type="button"
                  className={styles.submitBtn}
                  disabled={aiLoading || guideCities.length === 0}
                  onClick={runAiGenerate}
                >
                  {aiLoading ? "Генерация…" : "Сгенерировать и сохранить"}
                </button>
                <button type="button" className={styles.linkBack} onClick={() => setModal("pick")}>
                  ← Назад
                </button>
              </div>
            )}

            {modal === "manual" && (
              <div className={styles.modalBody}>
                <label className={styles.fieldLabel}>Город из базы (старт и поиск мест)</label>
                <select
                  className={styles.input}
                  value={manualFilterCityId === "" ? "" : String(manualFilterCityId)}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "") {
                      setManualFilterCityId("")
                      return
                    }
                    const id = Number(v)
                    setManualFilterCityId(id)
                    const city = guideCities.find((c) => c.id === id)
                    if (!city) return
                    const ll = parseCityCentroid(city.centroid)
                    if (ll) {
                      setStartPick({
                        lat: ll.lat,
                        lng: ll.lng,
                        displayName: city.name,
                      })
                      setStartQuery(city.name)
                      setStartCandidates([])
                    }
                  }}
                >
                  <option value="">Не выбран — поиск по всем городам</option>
                  {guideCities.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <label className={styles.fieldLabel}>Точка старта (или уточните адрес)</label>
                <div className={styles.rowFlex}>
                  <input
                    className={styles.input}
                    value={startQuery}
                    onChange={(e) => setStartQuery(e.target.value)}
                    placeholder="Откуда начинаем"
                  />
                  <button type="button" className={styles.secondaryBtn} onClick={lookupStart}>
                    Найти на карте
                  </button>
                </div>
                {startCandidates.length > 0 && (
                  <ul className={styles.geoPickList}>
                    {startCandidates.map((c, i) => (
                      <li key={`${c.lat},${c.lng},${i}`}>
                        <button
                          type="button"
                          className={
                            startPick?.lat === c.lat && startPick?.lng === c.lng
                              ? styles.geoPickActive
                              : styles.geoPickBtn
                          }
                          onClick={() => setStartPick(c)}
                        >
                          {c.displayName}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <label className={styles.fieldLabel}>Поиск мест</label>
                <input
                  className={styles.input}
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  placeholder="Введите от 2 букв…"
                />
                {searchPosts && searchPosts.items.length > 0 && (
                  <ul className={styles.postSearchList}>
                    {searchPosts.items.map((p) => (
                      <li key={p.id}>
                        <button type="button" className={styles.postSearchItem} onClick={() => addToChain(p)}>
                          <span>{p.title}</span>
                          {p.city && <small>{p.city}</small>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <label className={styles.fieldLabel}>Цепочка ({chain.length})</label>
                {chain.length === 0 && <p className={styles.hintMuted}>Добавьте места из поиска.</p>}
                <ol className={styles.chainList}>
                  {chain.map((p, i) => (
                    <li key={p.id} className={styles.chainRow}>
                      <span className={styles.chainTitle}>{i + 1}. {p.title}</span>
                      <div className={styles.chainActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Выше"
                          disabled={i === 0}
                          onClick={() => moveChain(i, -1)}
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Ниже"
                          disabled={i === chain.length - 1}
                          onClick={() => moveChain(i, 1)}
                        >
                          <ChevronDownIcon size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Удалить"
                          onClick={() => removeFromChain(p.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>

                {manualError && <p className={styles.formError}>{manualError}</p>}
                <button
                  type="button"
                  className={styles.submitBtn}
                  disabled={manualSaving}
                  onClick={submitManual}
                >
                  {manualSaving ? "Сохранение…" : "Сохранить путеводитель"}
                </button>
                <button type="button" className={styles.linkBack} onClick={() => setModal("pick")}>
                  ← Назад
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomBar />
    </div>
  )
}
