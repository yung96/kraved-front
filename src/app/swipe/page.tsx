"use client"

import AppImage from "@/components/ui/AppImage/AppImage"
import BottomBar from "@/components/ui/BottomBar/BottomBar"
import { imgSrc } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useGetNextSwipeCardQuery, useRecordSwipeMutation } from "@/store/kraevedApi"
import { motion } from "framer-motion"
import { Heart, Loader2, MapPin, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import TinderCard from "react-tinder-card"
import styles from "./swipe.module.css"

type SwipeDir = "left" | "right"

export default function SwipePage() {
  const router = useRouter()
  const cardRef = useRef<{ swipe: (dir: string) => Promise<void> } | null>(null)

  const [loggedIn, setLoggedIn] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [likedCount, setLikedCount] = useState(0)
  const [swipedTotal, setSwipedTotal] = useState(0)
  const [lastDir, setLastDir] = useState<SwipeDir | null>(null)
  const [swipeError, setSwipeError] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => {
      const v = auth.isLoggedIn()
      setLoggedIn(v)
      setAuthReady(true)
      if (!v) router.replace("/?login=1")
    }
    sync()
    return auth.subscribe(sync)
  }, [router])

  const {
    data: nextSwipe,
    isLoading: swipeLoading,
    isFetching: swipeFetching,
    error: swipeQueryError,
    refetch: refetchSwipe,
  } = useGetNextSwipeCardQuery(undefined, {
    skip: !authReady || !loggedIn,
  })

  const [recordSwipe, { isLoading: swipePosting }] = useRecordSwipeMutation()

  const currentPost = nextSwipe?.post ?? null
  const deckDone = nextSwipe?.done === true
  const busy = swipePosting || swipeFetching

  const onSwiped = useCallback(
    async (direction: string) => {
      if (direction !== "left" && direction !== "right") return
      const post = currentPost
      if (!post || deckDone) return
      setSwipeError(null)
      try {
        await recordSwipe({ postId: post.id, direction }).unwrap()
        setLastDir(direction)
        setSwipedTotal((c) => c + 1)
        if (direction === "right") setLikedCount((c) => c + 1)
      } catch {
        setSwipeError("Не удалось сохранить свайп. Попробуйте ещё раз.")
        await refetchSwipe()
      }
    },
    [currentPost, deckDone, recordSwipe, refetchSwipe],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (busy || !currentPost || deckDone) return
      if (e.key === "ArrowLeft") { e.preventDefault(); cardRef.current?.swipe("left") }
      if (e.key === "ArrowRight") { e.preventDefault(); cardRef.current?.swipe("right") }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [busy, currentPost, deckDone])

  if (!authReady || !loggedIn) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Loader2 className={styles.spinner} size={32} />
        </div>
        <BottomBar />
      </div>
    )
  }

  const queryErr =
    swipeQueryError && typeof swipeQueryError === "object" && "status" in swipeQueryError
      ? `Ошибка загрузки (${String((swipeQueryError as { status?: unknown }).status)})`
      : swipeQueryError
        ? "Не удалось загрузить карточки"
        : null

  return (
    <div className={styles.page}>
      <div className={styles.swipeStep}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Что вам нравится?</h1>
            <p className={styles.sub}>
              Вправо — в избранное, влево — пропустить.
              <span className={styles.subKb}> На ПК — ← →.</span>
            </p>
          </div>
        </div>

        {swipeError && <p className={styles.errBanner}>{swipeError}</p>}

        {queryErr && (
          <div className={styles.errBox}>
            <p>{queryErr}</p>
            <button type="button" className={styles.retryBtn} onClick={() => refetchSwipe()}>
              Повторить
            </button>
          </div>
        )}

        {!queryErr && swipeLoading && !nextSwipe && (
          <div className={styles.loading}>
            <Loader2 className={styles.spinner} size={36} />
            <p className={styles.loadingText}>Загружаем карточку…</p>
          </div>
        )}

        {!queryErr && nextSwipe && deckDone && (
          <div className={styles.emptyPanel}>
            <p>{nextSwipe.message ?? "Карточки закончились"}</p>
            <p className={styles.emptySub}>
              {swipedTotal > 0 ? `Просмотрено: ${swipedTotal}` : "Загляните позже — появятся новые."}
            </p>
          </div>
        )}

        {!queryErr && currentPost && !deckDone && (
          <>
            <div className={styles.progressBar}>
              <motion.div
                className={styles.progressFill}
                animate={{ width: swipedTotal === 0 ? "8%" : `${Math.min(100, 8 + swipedTotal * 12)}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>
            <p className={styles.progressText}>
              Просмотрено: {swipedTotal}
              {likedCount > 0 && <span className={styles.progressLiked}> · вправо: {likedCount}</span>}
            </p>

            <div className={styles.cardStack} role="region" aria-label="Карточка места">
              <TinderCard
                key={currentPost.id}
                ref={(el: unknown) => {
                  cardRef.current = el as { swipe: (dir: string) => Promise<void> } | null
                }}
                onSwipe={(dir) => void onSwiped(dir)}
                preventSwipe={["up", "down"]}
                swipeRequirementType="position"
                swipeThreshold={96}
                className={styles.tinderCardWrap}
              >
                <div className={`${styles.card} ${busy ? styles.cardBusy : ""}`}>
                  <div className={styles.cardPhoto}>
                    {currentPost.photos?.[0] ? (
                      <AppImage
                        src={imgSrc(currentPost.photos[0])}
                        alt={currentPost.title}
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className={styles.cardPhotoFallback}>
                        <MapPin size={32} color="#858585" />
                      </div>
                    )}
                    <div className={styles.cardGradient} />
                  </div>
                  <div className={styles.cardBody}>
                    <h2 className={styles.cardTitle}>{currentPost.title}</h2>
                    {currentPost.city && (
                      <p className={styles.cardCity}>
                        <MapPin size={12} /> {currentPost.city}
                      </p>
                    )}
                    {currentPost.description && (
                      <p className={styles.cardDesc}>
                        {currentPost.description.length > 160
                          ? currentPost.description.slice(0, 160) + "…"
                          : currentPost.description}
                      </p>
                    )}
                  </div>
                </div>
              </TinderCard>

              {lastDir && (
                <motion.div
                  className={lastDir === "right" ? styles.flashLike : styles.flashNope}
                  initial={{ opacity: 1, scale: 1.2 }}
                  animate={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.45 }}
                  key={swipedTotal}
                >
                  {lastDir === "right" ? (
                    <Heart size={48} fill="#22EA36" color="#22EA36" />
                  ) : (
                    <X size={48} color="#e03c3c" />
                  )}
                </motion.div>
              )}
            </div>

            <div className={styles.swipeActions}>
              <motion.button
                type="button"
                className={styles.swipeBtnNo}
                onClick={() => cardRef.current?.swipe("left")}
                whileTap={{ scale: 0.85 }}
                disabled={busy}
                aria-label="Пропустить"
              >
                <X size={28} />
              </motion.button>
              <motion.button
                type="button"
                className={styles.swipeBtnYes}
                onClick={() => cardRef.current?.swipe("right")}
                whileTap={{ scale: 0.85 }}
                disabled={busy}
                aria-label="В избранное"
              >
                <Heart size={28} />
              </motion.button>
            </div>
          </>
        )}
      </div>

      <BottomBar />
    </div>
  )
}
