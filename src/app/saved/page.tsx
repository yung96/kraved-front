"use client"

import BottomBar from "@/components/ui/BottomBar/BottomBar"
import Button from "@/components/ui/Button/Button"
import PageShell from "@/components/ui/PageShell/PageShell"
import SkeletonCard from "@/components/ui/SkeletonCard/SkeletonCard"
import PlaceCard from "@/components/PlaceCard/PlaceCard"
import AppImage from "@/components/ui/AppImage/AppImage"
import { auth } from "@/lib/auth"
import { imgSrc } from "@/lib/api"
import { listRoutes, type SavedRoute } from "@/lib/routeStore"
import { useListFavoritesQuery, useListInterestsQuery } from "@/store/kraevedApi"
import { Bookmark, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import styles from "./saved.module.css"

type Tab = "places" | "routes"

export default function SavedPage() {
  const router   = useRouter()
  const loggedIn = auth.isLoggedIn()

  const [tab, setTab] = useState<Tab>("places")
  const [routes, setRoutes] = useState<SavedRoute[]>([])

  const { data, isLoading } = useListFavoritesQuery(undefined, { skip: !loggedIn })
  const { data: interestsData } = useListInterestsQuery()
  const posts = data?.items ?? []

  const interestsMap = useMemo(() => {
    const map: Record<number, { name: string; emoji?: string }> = {}
    interestsData?.items?.forEach(i => { map[i.id] = { name: i.name, emoji: i.emoji } })
    return map
  }, [interestsData])

  useEffect(() => {
    setRoutes(listRoutes())
  }, [tab])

  if (!loggedIn) {
    return (
      <div className={styles.empty} style={{ minHeight: "100dvh" }}>
        <div className={styles.emptyIcon}>
          <Bookmark size={26} strokeWidth={1.5} color="var(--color-text-secondary)" />
        </div>
        <p className={styles.emptyTitle}>Войдите в аккаунт</p>
        <p className={styles.emptySub}>Чтобы сохранять любимые места</p>
        <Button variant="primary" size="lg" style={{ width: 200 }} onClick={() => router.push("/login")}>
          Войти
        </Button>
        <BottomBar />
      </div>
    )
  }

  return (
    <PageShell withBottomBar>
      <div className={styles.page}>

        <header className={styles.header}>
          <h1 className={styles.headerTitle}>
            Сохранено{" "}
            {tab === "places" && !isLoading && data?.total ? (
              <span className={styles.headerCount}>{data.total}</span>
            ) : null}
          </h1>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === "places" ? styles.tabActive : ""}`}
              onClick={() => setTab("places")}
            >
              Места
            </button>
            <button
              className={`${styles.tab} ${tab === "routes" ? styles.tabActive : ""}`}
              onClick={() => setTab("routes")}
            >
              Маршруты
            </button>
          </div>
        </header>

        {tab === "places" ? (
          <>
            {isLoading ? (
              <div className={styles.skeletons}>
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : posts.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>
                  <Bookmark size={26} strokeWidth={1.5} color="var(--color-text-secondary)" />
                </div>
                <p className={styles.emptyTitle}>Пока ничего нет</p>
                <p className={styles.emptySub}>Сохраняйте места из ленты</p>
                <Button variant="secondary" size="md" onClick={() => router.push("/")}>
                  Перейти в ленту
                </Button>
              </div>
            ) : (
              <div className={styles.feed}>
                {posts.map(p => <PlaceCard key={p.id} place={p} interestsMap={interestsMap} />)}
              </div>
            )}
          </>
        ) : (
          <>
            {routes.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>
                  <MapPin size={26} strokeWidth={1.5} color="var(--color-text-secondary)" />
                </div>
                <p className={styles.emptyTitle}>Маршруты появятся тут</p>
                <p className={styles.emptySub}>Постройте первый!</p>
                <Button variant="secondary" size="md" onClick={() => router.push("/route/create")}>
                  Построить маршрут
                </Button>
              </div>
            ) : (
              <div className={styles.routesFeed}>
                {routes.map(route => {
                  const coverUrl = imgSrc(route.places[0]?.photos?.[0])
                  return (
                    <div key={route.id} className={styles.routeCard} onClick={() => router.push(`/route/${route.id}`)}>
                      {/* Cover with overlay text */}
                      <div className={styles.routeCover}>
                        {coverUrl ? (
                          <AppImage src={coverUrl} alt={route.title} fill style={{ objectFit: "cover" }} sizes="(max-width:600px) 100vw, 560px" unoptimized />
                        ) : (
                          <div className={styles.routeCoverFallback} />
                        )}
                        <div className={styles.routeCoverGradient} />
                        <div className={styles.routeCoverText}>
                          <p className={styles.routeCoverTitle}>{route.title}</p>
                          <p className={styles.routeCoverMeta}>{route.groupLabel} · {route.days} {pluralDays(route.days)}</p>
                        </div>
                      </div>

                      {/* Body */}
                      <div className={styles.routeBody}>
                        {/* Numbered stops */}
                        <div className={styles.routeStops}>
                          {route.places.slice(0, 5).map((_, i) => (
                            <span key={i} className={styles.routeStop}>{i + 1}</span>
                          ))}
                          {route.places.length > 5 && (
                            <span className={styles.routeStopMore}>+{route.places.length - 5}</span>
                          )}
                        </div>

                        {/* Narrative */}
                        {route.narrative && (
                          <p className={styles.routeNarrative}>{route.narrative}</p>
                        )}

                        {/* Open link */}
                        <div className={styles.routeOpenLink}>
                          Открыть маршрут <span>→</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

      </div>
      <BottomBar />
    </PageShell>
  )
}

function pluralDays(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return "дней"
  if (mod10 === 1) return "день"
  if (mod10 >= 2 && mod10 <= 4) return "дня"
  return "дней"
}
