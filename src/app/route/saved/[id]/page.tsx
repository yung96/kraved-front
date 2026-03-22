"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { skipToken } from "@reduxjs/toolkit/query/react"
import { ArrowLeft, Sparkles, MapPin } from "lucide-react"
import { useGetUserSavedRouteQuery } from "@/store/kraevedApi"
import type { PostResponse } from "@/lib/types"
import BottomBar from "@/components/ui/BottomBar/BottomBar"
import { imgSrc } from "@/lib/api"
import styles from "./saved.module.css"

function captionForPost(
  postId: number,
  meta: { stops?: { postId: number; caption: string }[] } | null | undefined,
): string | null {
  const stops = meta?.stops
  if (!stops?.length) return null
  const s = stops.find((x) => x.postId === postId)
  return s?.caption ?? null
}

export default function SavedRouteDetailPage() {
  const params = useParams()
  const idRaw = params?.id
  const id = typeof idRaw === "string" ? Number(idRaw) : NaN
  const valid = Number.isFinite(id) && id > 0

  const { data, isLoading, isError } = useGetUserSavedRouteQuery(valid ? id : skipToken)

  const postById = new Map<number, PostResponse>()
  if (data?.posts) {
    for (const p of data.posts) postById.set(p.id, p)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/route/create" className={styles.back}>
          <ArrowLeft size={16} strokeWidth={2.5} />
          Путеводители
        </Link>
      </header>

      <main className={styles.main}>
        {!valid && <p className={styles.error}>Некорректная ссылка.</p>}
        {valid && isLoading && <p className={styles.loading}>Загрузка…</p>}
        {valid && isError && <p className={styles.error}>Путеводитель не найден или нет доступа.</p>}
        {valid && data && (
          <>
            <h1 className={styles.title}>{data.title || data.startLabel || `Путеводитель №${data.id}`}</h1>
            <div className={styles.badgeRow}>
              {data.aiGenerated && (
                <span className={styles.badgeAi}>
                  <Sparkles size={10} />
                  ИИ
                </span>
              )}
              <span className={styles.badge}>
                <MapPin size={10} />
                {data.postIds.length}{" "}
                {data.postIds.length === 1 ? "точка" : data.postIds.length < 5 ? "точки" : "точек"}
              </span>
            </div>

            {data.aiRouteMeta && typeof data.aiRouteMeta.intro === "string" && data.aiRouteMeta.intro.trim() && (
              <p className={styles.intro}>{data.aiRouteMeta.intro}</p>
            )}

            <h2 className={styles.stopsHeading}>Остановки</h2>
            <ol className={styles.stopList}>
              {data.postIds.map((postId, index) => {
                const post = postById.get(postId)
                const cap = captionForPost(postId, data.aiRouteMeta)
                const href = post ? `/place/${post.id}` : undefined
                const inner = (
                  <>
                    {post?.photos?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={styles.thumb} src={imgSrc(post.photos[0])} alt="" />
                    )}
                    <div className={styles.stopCardBody}>
                      <h3 className={styles.stopTitle}>{post?.title ?? `Место #${postId}`}</h3>
                      {cap && <p className={styles.caption}>{cap}</p>}
                      {post?.description && !cap && (
                        <p className={styles.caption}>{post.description}</p>
                      )}
                      {post?.city && <p className={styles.city}>{post.city}</p>}
                    </div>
                  </>
                )
                return (
                  <li key={`${postId}-${index}`} className={styles.stopItem}>
                    <div className={styles.stopTimeline}>
                      <div className={styles.stopNumber}>{index + 1}</div>
                      {index < data.postIds.length - 1 && <div className={styles.stopLine} />}
                    </div>
                    <div className={styles.stopContent}>
                      {href ? (
                        <Link href={href} className={styles.stopCard}>
                          {inner}
                        </Link>
                      ) : (
                        <div className={styles.stopCard}>{inner}</div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </main>

      <BottomBar />
    </div>
  )
}
