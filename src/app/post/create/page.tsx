"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, ImagePlus, Send, X } from "lucide-react"
import BottomBar from "@/components/ui/BottomBar/BottomBar"
import { auth } from "@/lib/auth"
import type { Season } from "@/lib/types"
import styles from "./create.module.css"

const MAX_PHOTOS = 20

const SEASONS: { value: Season; label: string }[] = [
  { value: "spring", label: "Весна" },
  { value: "summer", label: "Лето" },
  { value: "autumn", label: "Осень" },
  { value: "winter", label: "Зима" },
]

type LocalPhoto = { id: string; file: File; preview: string }

export default function CreatePostPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [city, setCity] = useState("")
  const [description, setDescription] = useState("")
  const [season, setSeason] = useState<Season>("summer")
  const [photos, setPhotos] = useState<LocalPhoto[]>([])
  const [error, setError] = useState("")
  const [moderationOpen, setModerationOpen] = useState(false)

  const photosRef = useRef(photos)
  photosRef.current = photos

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.replace("/?login=1")
    }
  }, [router])

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview))
    }
  }, [])

  const addFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return
    const next: LocalPhoto[] = []
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) continue
      next.push({
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      })
    }
    if (!next.length) return
    setPhotos((prev) => {
      const combined = [...prev, ...next]
      const merged = combined.slice(0, MAX_PHOTOS)
      combined.slice(MAX_PHOTOS).forEach((p) => URL.revokeObjectURL(p.preview))
      return merged
    })
  }, [])

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const x = prev.find((p) => p.id === id)
      if (x) URL.revokeObjectURL(x.preview)
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  function handleSubmit() {
    const t = title.trim()
    if (!t) {
      setError("Укажите название места")
      return
    }
    setError("")
    setModerationOpen(true)
  }

  function closeModerationAndLeave() {
    setModerationOpen(false)
    router.push("/")
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => router.back()} aria-label="Назад">
          <ArrowLeft size={22} />
        </button>
        <h1 className={styles.title}>Новое место</h1>
      </header>

      <div className={styles.form}>
        <div>
          <label className={styles.fieldLabel} htmlFor="post-title">
            Название
          </label>
          <input
            id="post-title"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Смотровая на горе Ахун"
            maxLength={200}
            autoComplete="off"
          />
        </div>

        <div>
          <label className={styles.fieldLabel} htmlFor="post-city">
            Город <span className={styles.optional}>(необязательно)</span>
          </label>
          <input
            id="post-city"
            className={styles.input}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Сочи, Казань…"
            maxLength={120}
            autoComplete="address-level2"
          />
        </div>

        <div>
          <label className={styles.fieldLabel} htmlFor="post-desc">
            Описание
          </label>
          <textarea
            id="post-desc"
            className={`${styles.input} ${styles.textarea}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Что здесь интересного, как добраться…"
            rows={5}
          />
        </div>

        <div>
          <span className={styles.fieldLabel}>Фотографии</span>
          <p className={styles.photoHint}>До {MAX_PHOTOS} фотографий к заявке.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className={styles.fileInput}
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ""
            }}
          />
          {photos.length > 0 && (
            <div className={styles.photosRow}>
              {photos.map((p) => (
                <div key={p.id} className={styles.photoThumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" />
                  <button
                    type="button"
                    className={styles.photoRemove}
                    onClick={() => removePhoto(p.id)}
                    aria-label="Удалить фото"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length < MAX_PHOTOS && (
            <button type="button" className={styles.addPhotoBtn} onClick={() => fileRef.current?.click()}>
              <ImagePlus size={20} />
              Добавить фото
              {photos.length > 0 ? ` (${photos.length}/${MAX_PHOTOS})` : ""}
            </button>
          )}
        </div>

        <div>
          <span className={styles.fieldLabel}>Сезон</span>
          <div className={styles.seasonRow}>
            {SEASONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`${styles.seasonChip} ${season === value ? styles.seasonChipActive : ""}`}
                onClick={() => setSeason(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="button" className={styles.submitBtn} disabled={!title.trim()} onClick={handleSubmit}>
          <Send size={20} />
          Отправить на модерацию
        </button>
      </div>

      {moderationOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="moderation-title"
          onClick={() => setModerationOpen(false)}
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon} aria-hidden>
              <CheckCircle2 size={40} strokeWidth={1.75} />
            </div>
            <h2 id="moderation-title" className={styles.modalTitle}>
              Заявка отправлена
            </h2>
            <p className={styles.modalText}>
              Ваш запрос на добавление места отправлен на модерацию. После проверки карточка может появиться в приложении.
            </p>
            <button type="button" className={styles.modalBtn} onClick={closeModerationAndLeave}>
              На главную
            </button>
          </div>
        </div>
      )}

      <BottomBar />
    </div>
  )
}
