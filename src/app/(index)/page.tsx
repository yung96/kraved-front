"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ImagePlus, MessageSquare, Plus, Send, Star, User, MapPin, ArrowDown, X } from "lucide-react"
import {
  useGetSubscriptionFeedQuery,
  useGetUserFeedQuery,
  useListPostsQuery,
  useListReviewsQuery,
  useCreateReviewMutation,
  useUploadImageMutation,
} from "@/store/kraevedApi"
import { imgSrc } from "@/lib/api"
import AppImage from "@/components/ui/AppImage/AppImage"
import { BrandMark } from "@/components/BrandMark/BrandMark"
import AuthModal from "@/components/AuthModal/AuthModal"
import BottomBar from "@/components/ui/BottomBar/BottomBar"
import { auth } from "@/lib/auth"
import type { PostResponse } from "@/lib/types"
import styles from "./page.module.css"

const GRADIENTS = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  "linear-gradient(135deg, #2d1b69 0%, #11998e 100%)",
  "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  "linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)",
]

const MAX_REVIEW_PHOTOS = 5

type LocalReviewPhoto = { id: string; file: File; preview: string }

// ── Post card with inline reviews ──────────────────────────────────────────

function PostCard({
  post,
  index,
  isLoggedIn,
  onLoginRequest,
}: {
  post: PostResponse
  index: number
  isLoggedIn: boolean
  onLoginRequest: () => void
}) {
  const router = useRouter()
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [reviewPhotos, setReviewPhotos] = useState<LocalReviewPhoto[]>([])
  const [reviewSending, setReviewSending] = useState(false)
  const reviewFileInputRef = useRef<HTMLInputElement>(null)

  const { data: reviewsData, isFetching: reviewsFetching } = useListReviewsQuery(
    { postId: post.id, pageSize: 20 },
    { skip: !reviewsOpen }
  )
  const [createReview, { isLoading: submitting }] = useCreateReviewMutation()
  const [uploadImage] = useUploadImageMutation()

  const reviews = reviewsData?.items ?? []
  const reviewCount = reviewsData?.total ?? (post.averageRating != null ? "·" : null)

  const reviewPhotosRef = useRef(reviewPhotos)
  reviewPhotosRef.current = reviewPhotos
  useEffect(() => {
    return () => {
      reviewPhotosRef.current.forEach((p) => URL.revokeObjectURL(p.preview))
    }
  }, [])

  function addReviewPhotos(files: FileList | null) {
    if (!files?.length) return
    const next: LocalReviewPhoto[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue
      next.push({
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      })
    }
    if (!next.length) return
    setReviewPhotos((prev) => {
      const combined = [...prev, ...next]
      const merged = combined.slice(0, MAX_REVIEW_PHOTOS)
      combined.slice(MAX_REVIEW_PHOTOS).forEach((p) => URL.revokeObjectURL(p.preview))
      return merged
    })
  }

  function removeReviewPhoto(id: string) {
    setReviewPhotos((prev) => {
      const x = prev.find((p) => p.id === id)
      if (x) URL.revokeObjectURL(x.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  async function submitReview() {
    if (!rating) return
    setReviewSending(true)
    try {
      const urls: string[] = []
      for (const { file } of reviewPhotos) {
        const fd = new FormData()
        fd.append("file", file)
        const up = await uploadImage(fd).unwrap()
        urls.push(up.url)
      }
      await createReview({
        postId: post.id,
        data: {
          rating,
          comment: comment.trim() || null,
          ...(urls.length ? { mediaUrls: urls } : {}),
        },
      }).unwrap()
      reviewPhotos.forEach((p) => URL.revokeObjectURL(p.preview))
      setReviewPhotos([])
      setSubmitted(true)
      setFormOpen(false)
      setRating(0)
      setComment("")
    } catch {
    } finally {
      setReviewSending(false)
    }
  }

  function handleLeaveReview() {
    if (!isLoggedIn) { onLoginRequest(); return }
    setReviewsOpen(true)
    setFormOpen(v => !v)
  }

  const stars = Math.round(post.averageRating ?? 0)

  return (
    <motion.article
      className={styles.postCard}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: (index % 5) * 0.05 }}
    >
      {/* Photo */}
      <button
        className={styles.postCardPhoto}
        onClick={() => router.push(`/place/${post.id}`)}
        aria-label={post.title}
      >
        {post.photos?.[0] ? (
          <AppImage
            src={imgSrc(post.photos[0])}
            alt={post.title}
            fill
            style={{ objectFit: "cover" }}
            unoptimized
          />
        ) : (
          <div
            className={styles.postCardPhotoFallback}
            style={{ background: GRADIENTS[index % GRADIENTS.length] }}
          />
        )}
        <div className={styles.postCardPhotoOverlay} />
        {post.city && (
          <span className={styles.postCardCityBadge}>
            <MapPin size={10} />
            {post.city}
          </span>
        )}
        {post.averageRating != null && (
          <span className={styles.postCardRatingBadge}>
            <Star size={11} fill="#22EA36" stroke="none" />
            {post.averageRating.toFixed(1)}
          </span>
        )}
      </button>

      {/* Body */}
      <div className={styles.postCardBody}>
        <h3 className={styles.postCardTitle} onClick={() => router.push(`/place/${post.id}`)}>
          {post.title}
        </h3>

        {post.description && (
          <p className={styles.postCardDesc}>{post.description}</p>
        )}

        {/* Stars row */}
        {stars > 0 && (
          <div className={styles.postCardStars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < stars ? "#22EA36" : "none"}
                stroke={i < stars ? "#22EA36" : "#d0d0d0"}
              />
            ))}
          </div>
        )}

        {/* Action row */}
        <div className={styles.postCardActions}>
          <button
            className={styles.postCardActionBtn}
            onClick={() => setReviewsOpen(v => !v)}
          >
            <MessageSquare size={15} />
            Отзывы{typeof reviewCount === "number" ? ` (${reviewCount})` : ""}
          </button>
          <button
            className={submitted ? styles.postCardActionBtnDone : styles.postCardActionBtnPrimary}
            onClick={handleLeaveReview}
            disabled={submitted}
          >
            <Star size={15} fill={submitted ? "#22EA36" : "none"} stroke={submitted ? "#22EA36" : "currentColor"} />
            {submitted ? "Отзыв оставлен" : "Оставить отзыв"}
          </button>
        </div>

        {/* Review form */}
        <AnimatePresence>
          {formOpen && (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div className={styles.reviewForm}>
                <div className={styles.reviewStarPicker}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      className={styles.reviewStarBtn}
                      onMouseEnter={() => setHoverRating(i + 1)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(i + 1)}
                      type="button"
                    >
                      <Star
                        size={28}
                        fill={i < (hoverRating || rating) ? "#22EA36" : "none"}
                        stroke={i < (hoverRating || rating) ? "#22EA36" : "#d0d0d0"}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  className={styles.reviewTextarea}
                  placeholder="Поделитесь впечатлениями…"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                />
                <input
                  ref={reviewFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className={styles.reviewFileInput}
                  onChange={(e) => {
                    addReviewPhotos(e.target.files)
                    e.target.value = ""
                  }}
                />
                <div className={styles.reviewPhotosBlock}>
                  {reviewPhotos.length > 0 && (
                    <div className={styles.reviewPhotosRow}>
                      {reviewPhotos.map((p) => (
                        <div key={p.id} className={styles.reviewPhotoThumb}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.preview} alt="" className={styles.reviewPhotoImg} />
                          <button
                            type="button"
                            className={styles.reviewPhotoRemove}
                            onClick={() => removeReviewPhoto(p.id)}
                            aria-label="Убрать фото"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {reviewPhotos.length < MAX_REVIEW_PHOTOS && (
                    <button
                      type="button"
                      className={styles.reviewAddPhotoBtn}
                      onClick={() => reviewFileInputRef.current?.click()}
                    >
                      <ImagePlus size={18} />
                      Фото {reviewPhotos.length > 0 ? `(${reviewPhotos.length}/${MAX_REVIEW_PHOTOS})` : ""}
                    </button>
                  )}
                </div>
                <button
                  className={styles.reviewSubmitBtn}
                  disabled={!rating || submitting || reviewSending}
                  onClick={submitReview}
                  type="button"
                >
                  {reviewSending || submitting ? "Отправляем…" : "Отправить"}
                  <Send size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews list */}
        <AnimatePresence>
          {reviewsOpen && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {reviewsFetching ? (
                <p className={styles.reviewsEmpty}>Загружаем…</p>
              ) : reviews.length === 0 ? (
                <p className={styles.reviewsEmpty}>Пока нет отзывов — будьте первым!</p>
              ) : (
                <div className={styles.reviewsList}>
                  {reviews.map(r => (
                    <div key={r.id} className={styles.reviewItem}>
                      <div className={styles.reviewItemHeader}>
                        <span className={styles.reviewItemAuthor}>{r.author.phone}</span>
                        <div className={styles.reviewItemStars}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={11}
                              fill={i < r.rating ? "#22EA36" : "none"}
                              stroke={i < r.rating ? "#22EA36" : "#ccc"}
                            />
                          ))}
                        </div>
                        <span className={styles.reviewItemDate}>
                          {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      {r.comment && <p className={styles.reviewItemComment}>{r.comment}</p>}
                      {(r.mediaUrls?.length || r.photos?.length) ? (
                        <div className={styles.reviewItemPhotos}>
                          {(r.mediaUrls ?? r.photos ?? []).map((ph) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={ph} src={imgSrc(ph)} alt="" className={styles.reviewItemPhoto} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function FeedPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#fff" }} />}>
      <FeedPageInner />
    </Suspense>
  )
}

type FeedTab = "foryou" | "subscriptions"

function FeedPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [showAuth, setShowAuth] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [feedTab, setFeedTab] = useState<FeedTab>("foryou")
  const [forYouPage, setForYouPage] = useState(1)

  useEffect(() => {
    setIsLoggedIn(auth.isLoggedIn())
    const unsub = auth.subscribe(() => setIsLoggedIn(auth.isLoggedIn()))
    return unsub
  }, [])

  useEffect(() => {
    if (!auth.isLoggedIn() && !localStorage.getItem("kraevd_welcome_seen")) {
      router.replace("/welcome")
    }
  }, [router])

  useEffect(() => {
    if (searchParams.get("login") === "1") setShowAuth(true)
  }, [searchParams])

  // "Для вас" feed — personalized when logged in, public when guest
  const { data: userFeedData, isFetching: userFeedFetching } = useGetUserFeedQuery(
    { page: 1, pageSize: forYouPage * 10 },
    { skip: !isLoggedIn || feedTab !== "foryou" }
  )
  const { data: publicFeedData, isFetching: publicFeedFetching } = useListPostsQuery(
    { page: 1, pageSize: forYouPage * 10 },
    { skip: isLoggedIn || feedTab !== "foryou" }
  )

  const forYouData = isLoggedIn ? userFeedData : publicFeedData
  const forYouPosts = forYouData?.items ?? []
  const forYouTotal = forYouData?.total ?? 0
  const forYouFetching = isLoggedIn ? userFeedFetching : publicFeedFetching
  const hasMore = forYouPosts.length < forYouTotal

  // Subscriptions feed
  const { data: subFeedData } = useGetSubscriptionFeedQuery(
    undefined,
    { skip: !isLoggedIn || feedTab !== "subscriptions" }
  )
  const subFeedItems = subFeedData?.items ?? []

  return (
    <div className={styles.page}>
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false)
          router.replace("/")
        }}
      />

      {/* ── Header ── */}
      <header className={styles.header}>
        <BrandMark className={styles.logo} />
        <div className={styles.headerRight}>
          {isLoggedIn ? (
            <button type="button" className={styles.loginBtn} onClick={() => router.push("/profile")}>
              <User size={18} />
            </button>
          ) : (
            <button type="button" className={styles.loginBtn} onClick={() => setShowAuth(true)}>
              Войти <User size={18} />
            </button>
          )}
        </div>
      </header>

      <button
        type="button"
        className={styles.createPlaceFab}
        onClick={() => {
          if (!isLoggedIn) {
            setShowAuth(true)
            return
          }
          router.push("/post/create")
        }}
        aria-label="Добавить место"
      >
        <Plus size={24} strokeWidth={2.4} />
      </button>

      {/* ── Feed tabs ── */}
      <div className={styles.feedTabBar}>
        <button
          className={`${styles.feedTab} ${feedTab === "foryou" ? styles.feedTabActive : ""}`}
          onClick={() => setFeedTab("foryou")}
        >
          Для вас
        </button>
        <button
          className={`${styles.feedTab} ${feedTab === "subscriptions" ? styles.feedTabActive : ""}`}
          onClick={() => setFeedTab("subscriptions")}
        >
          Подписки
        </button>
      </div>

      {/* ── "Для вас" post feed ── */}
      {feedTab === "foryou" && (
        <section className={styles.postFeed}>
          {forYouPosts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              isLoggedIn={isLoggedIn}
              onLoginRequest={() => setShowAuth(true)}
            />
          ))}

          {forYouFetching && (
            <div className={styles.feedLoading}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.postCardSkeleton} />
              ))}
            </div>
          )}

          {!forYouFetching && forYouPosts.length === 0 && (
            <p className={styles.feedEmpty}>Нет мест. Попробуйте позже.</p>
          )}

          {hasMore && !forYouFetching && (
            <button
              className={styles.loadMoreBtn}
              onClick={() => setForYouPage(p => p + 1)}
            >
              <ArrowDown size={16} />
              Загрузить ещё
            </button>
          )}
        </section>
      )}

      {/* ── Subscriptions feed ── */}
      {feedTab === "subscriptions" && (
        <section className={styles.subFeed}>
          {!isLoggedIn ? (
            <div className={styles.subFeedGate}>
              <p className={styles.subFeedGateText}>Войдите, чтобы видеть отзывы авторов, на которых вы подписаны</p>
              <button className={styles.subFeedGateBtn} onClick={() => setShowAuth(true)}>
                Войти
              </button>
            </div>
          ) : subFeedItems.length === 0 ? (
            <p className={styles.feedEmpty}>Подпишитесь на авторов — здесь появятся их отзывы</p>
          ) : (
            subFeedItems.map(item => (
              <button
                key={item.id}
                className={styles.subFeedCard}
                onClick={() => router.push(`/place/${item.postId}`)}
              >
                <div className={styles.subFeedCardTop}>
                  <span className={styles.subFeedAuthor}>{item.author.phone}</span>
                  <span className={styles.subFeedStars}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        size={13}
                        fill={si < item.rating ? "#22EA36" : "none"}
                        stroke={si < item.rating ? "#22EA36" : "#ccc"}
                      />
                    ))}
                  </span>
                </div>
                <span className={styles.subFeedPostTitle}>{item.postTitle}</span>
                {item.postDescription?.trim() && (
                  <p className={styles.subFeedPostDesc}>{item.postDescription.trim()}</p>
                )}
                {item.comment && <p className={styles.subFeedComment}>{item.comment}</p>}
                {item.mediaUrls && item.mediaUrls.length > 0 && (
                  <div className={styles.subFeedReviewPhotos}>
                    {item.mediaUrls.slice(0, 4).map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={imgSrc(url)} alt="" className={styles.subFeedReviewPhoto} />
                    ))}
                  </div>
                )}
                <div className={styles.subFeedMeta}>
                  {item.postCity && <span><MapPin size={11} /> {item.postCity}</span>}
                  <span>{new Date(item.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
              </button>
            ))
          )}
        </section>
      )}

      <BottomBar />
    </div>
  )
}
