"use client"

import { BrandMark } from "@/components/BrandMark/BrandMark"
import {
  useGetAdminDashboardQuery,
  useAdminUpdatePostMutation,
  useAdminCreateInterestMutation,
  useAdminUpdateInterestMutation,
  useAdminDeleteInterestMutation,
} from "@/store/kraevedApi"
import type {
  AdminInterestCard,
  AdminPostCard,
  AdminUserCard,
  Season,
} from "@/lib/types"
import {
  AlertTriangle, ChevronLeft, ChevronRight,
  Edit2, ImageOff, Loader2, MapPin, Plus, Star, Trash2, Users, X, Zap,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import styles from "./admin.module.css"

const PAGE_SIZE = 20
const SEASON_LABELS: Record<Season, string> = {
  spring: "🌸 Весна",
  summer: "☀️ Лето",
  autumn: "🍂 Осень",
  winter: "❄️ Зима",
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "admin"
const AUTH_KEY = "admin_auth"

function AdminLogin({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw]       = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "ok")
      onAuth()
    } else {
      setError("Неверный пароль")
    }
  }

  return (
    <div className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <p className={styles.loginTitle}>Админ-панель</p>
        <p className={styles.loginSub}>
          <BrandMark /> · введите пароль для входа
        </p>
        <input
          className={styles.input}
          type="password"
          placeholder="Пароль"
          value={pw}
          onChange={e => { setPw(e.target.value); setError("") }}
          style={{ width: "100%", boxSizing: "border-box" }}
          autoFocus
        />
        {error && <p className={styles.loginError}>{error}</p>}
        <button
          className={styles.btnSave}
          type="submit"
          style={{ alignSelf: "flex-end" }}
        >
          Войти
        </button>
      </form>
    </div>
  )
}

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE)
  if (pages <= 1) return null
  return (
    <div className={styles.pagination}>
      <button className={styles.pageBtn} disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={15} />
      </button>
      <span className={styles.pageInfo}>{page} / {pages}</span>
      <button className={styles.pageBtn} disabled={page === pages} onClick={() => onPage(page + 1)}>
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

// ─── ConfirmModal ──────────────────────────────────────────────────────────────

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  isLoading,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className={styles.modalHeader}>
            <span className={styles.modalTitle}>Подтверждение</span>
            <button className={styles.modalClose} onClick={onCancel}><X size={14} /></button>
          </div>
          <p className={styles.confirmText}>{message}</p>
          <div className={styles.modalActions}>
            <button className={styles.btnCancel} onClick={onCancel}>Отмена</button>
            <button
              className={styles.btnDanger}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={14} className={styles.spin} /> : <><Trash2 size={13} /> Удалить</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── PostModal ─────────────────────────────────────────────────────────────────

interface PostModalProps {
  post: AdminPostCard
  interests: AdminInterestCard[]
  onClose: () => void
  onSave: (data: { title: string; description: string; season: Season; interestIds: number[] }) => Promise<void>
  isLoading: boolean
}

function PostModal({ post, interests, onClose, onSave, isLoading }: PostModalProps) {
  const [title, setTitle]       = useState(post.title)
  const [desc, setDesc]         = useState(post.description ?? "")
  const [season, setSeason]     = useState<Season>(post.season)
  const [selInterests, setSelInterests] = useState<number[]>(post.interestIds ?? [])

  function toggleInterest(id: number) {
    setSelInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className={styles.modalHeader}>
            <span className={styles.modalTitle}>Редактировать место #{post.id}</span>
            <button className={styles.modalClose} onClick={onClose}><X size={14} /></button>
          </div>

          <div>
            <p className={styles.modalLabel}>Название</p>
            <input
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Название"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <p className={styles.modalLabel}>Описание</p>
            <textarea
              className={styles.textarea}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Описание"
              rows={3}
            />
          </div>

          <div>
            <p className={styles.modalLabel}>Сезон</p>
            <div className={styles.seasonRow}>
              {(Object.entries(SEASON_LABELS) as [Season, string][]).map(([s, label]) => (
                <button
                  key={s}
                  className={`${styles.seasonBtn} ${season === s ? styles.seasonBtnActive : ""}`}
                  onClick={() => setSeason(s)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={styles.modalLabel}>Интересы</p>
            <div className={styles.interestPicker}>
              {interests.map(i => (
                <button
                  key={i.id}
                  className={`${styles.interestChip} ${selInterests.includes(i.id) ? styles.interestChipActive : ""}`}
                  onClick={() => toggleInterest(i.id)}
                >
                  {i.emoji} {i.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button className={styles.btnCancel} onClick={onClose}>Отмена</button>
            <button
              className={styles.btnSave}
              onClick={() => onSave({ title, description: desc, season, interestIds: selInterests })}
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? <Loader2 size={14} className={styles.spin} /> : "Сохранить"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── InterestModal ─────────────────────────────────────────────────────────────

interface InterestModalProps {
  interest: AdminInterestCard
  onClose: () => void
  onSave: (data: { name: string; emoji: string }) => Promise<void>
  isLoading: boolean
}

function InterestModal({ interest, onClose, onSave, isLoading }: InterestModalProps) {
  const [name, setName]   = useState(interest.name)
  const [emoji, setEmoji] = useState(interest.emoji ?? "")

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className={styles.modalHeader}>
            <span className={styles.modalTitle}>Редактировать интерес #{interest.id}</span>
            <button className={styles.modalClose} onClick={onClose}><X size={14} /></button>
          </div>

          <div>
            <p className={styles.modalLabel}>Эмодзи</p>
            <input
              className={`${styles.input} ${styles.inputEmoji}`}
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              maxLength={4}
              placeholder="✨"
            />
          </div>

          <div>
            <p className={styles.modalLabel}>Название</p>
            <input
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Название интереса"
              style={{ width: "100%", boxSizing: "border-box" }}
              onKeyDown={e => e.key === "Enter" && name.trim() && onSave({ name, emoji })}
            />
          </div>

          <div className={styles.modalActions}>
            <button className={styles.btnCancel} onClick={onClose}>Отмена</button>
            <button
              className={styles.btnSave}
              onClick={() => onSave({ name, emoji })}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? <Loader2 size={14} className={styles.spin} /> : "Сохранить"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Top-5 interest widget ─────────────────────────────────────────────────────

function TopInterestsWidget({ users, interests }: { users: AdminUserCard[]; interests: AdminInterestCard[] }) {
  const totals = new Map<number, number>()
  users.forEach(u => u.interests.forEach(i => totals.set(i.id, (totals.get(i.id) ?? 0) + i.weight)))

  const top = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  if (top.length === 0) return null
  const max = top[0][1]

  return (
    <div className={styles.topWidget}>
      <p className={styles.topWidgetTitle}>Топ интересов по весу</p>
      {top.map(([id, weight]) => {
        const interest = interests.find(i => i.id === id)
        if (!interest) return null
        const pct = Math.round((weight / max) * 100)
        return (
          <div key={id} className={styles.topItem}>
            <span className={styles.topItemLabel}>
              {interest.emoji && <span>{interest.emoji}</span>} {interest.name}
            </span>
            <div className={styles.topBar}>
              <div className={styles.topBarFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.topItemWeight}>{weight}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Posts Tab ─────────────────────────────────────────────────────────────────

type PostSort = "id_desc" | "id_asc" | "rating_desc" | "title_asc"

function PostsTab({
  posts,
  refetch,
  interests,
  editPostId,
  onEditPost,
}: {
  posts: AdminPostCard[]
  refetch: () => void
  interests: AdminInterestCard[]
  editPostId: number | null
  onEditPost: (id: number | null) => void
}) {
  const [updatePost, { isLoading }] = useAdminUpdatePostMutation()
  const [sort, setSort]             = useState<PostSort>("id_desc")
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState("")

  const editPost = editPostId != null ? (posts.find(p => p.id === editPostId) ?? null) : null

  async function saveEdit(data: { title: string; description: string; season: Season; interestIds: number[] }) {
    if (!editPost) return
    await updatePost({
      id: editPost.id,
      data: {
        title:       data.title,
        description: data.description || null,
        season:      data.season,
        interestIds: data.interestIds,
      },
    }).unwrap()
    onEditPost(null)
    refetch()
  }

  const SORTS: { value: PostSort; label: string }[] = [
    { value: "id_desc",     label: "Новые"   },
    { value: "id_asc",      label: "Старые"  },
    { value: "rating_desc", label: "Рейтинг" },
    { value: "title_asc",   label: "A→Я"     },
  ]

  const filtered = posts.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "id_desc")     return b.id - a.id
    if (sort === "id_asc")      return a.id - b.id
    if (sort === "rating_desc") return (b.averageRating ?? 0) - (a.averageRating ?? 0)
    if (sort === "title_asc")   return a.title.localeCompare(b.title, "ru")
    return 0
  })

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      {editPost && (
        <PostModal
          post={editPost}
          interests={interests}
          onClose={() => onEditPost(null)}
          onSave={saveEdit}
          isLoading={isLoading}
        />
      )}

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Поиск по названию…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <div className={styles.sortGroup}>
          {SORTS.map(o => (
            <button
              key={o.value}
              className={`${styles.sortBtn} ${sort === o.value ? styles.sortBtnActive : ""}`}
              onClick={() => { setSort(o.value); setPage(1) }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scrollList}>
        {paged.map(post => {
          const noCoords = post.geoLat == null && post.geoLng == null
          const noPhoto  = (post.photos?.length ?? 0) === 0
          return (
            <div key={post.id} className={`${styles.row} ${noCoords ? styles.rowWarn : ""}`}>
              <span className={styles.rowId}>#{post.id}</span>

              <div className={styles.rowMain}>
                <p className={styles.rowTitle}>
                  {noCoords && <span className={styles.warnIcon} title="Нет координат"><MapPin size={10} /></span>}
                  {noPhoto  && <span className={styles.warnIcon} title="Нет фото"><ImageOff size={10} /></span>}
                  {post.title}
                </p>
                <p className={styles.rowSub}>
                  {SEASON_LABELS[post.season]} · {post.interestIds?.length ?? 0} интересов
                </p>
              </div>

              <div className={styles.rowMeta}>
                {post.averageRating != null ? (
                  <span className={styles.badge}><Star size={10} /> {post.averageRating.toFixed(1)}</span>
                ) : (
                  <span className={styles.badgeNeutral}>—</span>
                )}
                <span className={styles.badgeNeutral}>
                  {new Date(post.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </div>

              <button className={styles.iconBtn} onClick={() => onEditPost(post.id)}>
                <Edit2 size={14} />
              </button>
            </div>
          )
        })}
      </div>

      <Pagination page={page} total={filtered.length} onPage={setPage} />
    </>
  )
}

// ─── Interests Tab ─────────────────────────────────────────────────────────────

function InterestsTab({
  interests,
  users,
  posts,
  refetch,
  editInterestId,
  onEditInterest,
  confirmDeleteId,
  onConfirmDelete,
}: {
  interests: AdminInterestCard[]
  users: AdminUserCard[]
  posts: AdminPostCard[]
  refetch: () => void
  editInterestId: number | null
  onEditInterest: (id: number | null) => void
  confirmDeleteId: number | null
  onConfirmDelete: (id: number | null) => void
}) {
  const [createInterest, { isLoading: creating }]   = useAdminCreateInterestMutation()
  const [updateInterest, { isLoading: updating }]   = useAdminUpdateInterestMutation()
  const [deleteInterest, { isLoading: deleting }]   = useAdminDeleteInterestMutation()
  const [newName, setNewName]   = useState("")
  const [newEmoji, setNewEmoji] = useState("")
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState("")

  const editItem = editInterestId != null ? (interests.find(i => i.id === editInterestId) ?? null) : null
  const deleteItem = confirmDeleteId != null ? (interests.find(i => i.id === confirmDeleteId) ?? null) : null

  // Pre-compute usage stats
  const placeCount  = new Map<number, number>()
  const userCount   = new Map<number, number>()
  posts.forEach(p   => (p.interestIds ?? []).forEach(id => placeCount.set(id, (placeCount.get(id) ?? 0) + 1)))
  users.forEach(u   => u.interests.forEach(i => userCount.set(i.id, (userCount.get(i.id) ?? 0) + 1)))

  async function handleCreate() {
    if (!newName.trim()) return
    await createInterest({ name: newName.trim(), emoji: newEmoji || null }).unwrap()
    setNewName(""); setNewEmoji(""); refetch()
  }

  async function handleUpdate(data: { name: string; emoji: string }) {
    if (!editItem) return
    await updateInterest({ id: editItem.id, data: { name: data.name, emoji: data.emoji || null } }).unwrap()
    onEditInterest(null); refetch()
  }

  async function handleDeleteConfirmed() {
    if (confirmDeleteId == null) return
    await deleteInterest(confirmDeleteId).unwrap()
    onConfirmDelete(null)
    refetch()
  }

  const filtered = interests.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  )
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      {editItem && (
        <InterestModal
          interest={editItem}
          onClose={() => onEditInterest(null)}
          onSave={handleUpdate}
          isLoading={updating}
        />
      )}

      {deleteItem && (
        <ConfirmModal
          message={`Удалить интерес «${deleteItem.emoji ?? ""} ${deleteItem.name}»? Это действие нельзя отменить.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => onConfirmDelete(null)}
          isLoading={deleting}
        />
      )}

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Поиск…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className={styles.createForm}>
        <input
          className={`${styles.input} ${styles.inputEmoji}`}
          value={newEmoji}
          onChange={e => setNewEmoji(e.target.value)}
          placeholder="✨"
          maxLength={4}
        />
        <input
          className={styles.input}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Название интереса"
          onKeyDown={e => e.key === "Enter" && handleCreate()}
          style={{ flex: 1 }}
        />
        <button className={styles.btnCreate} onClick={handleCreate} disabled={creating || !newName.trim()}>
          {creating ? <Loader2 size={14} className={styles.spin} /> : <><Plus size={13} /> Добавить</>}
        </button>
      </div>

      <div className={styles.scrollList}>
        {paged.map(item => {
          const places = placeCount.get(item.id) ?? 0
          const uCount = userCount.get(item.id) ?? 0
          const isEmpty = places === 0
          return (
            <div key={item.id} className={`${styles.row} ${isEmpty ? styles.rowWarn : ""}`}>
              <span className={styles.rowId}>#{item.id}</span>
              <span className={styles.rowEmoji}>{item.emoji}</span>
              <div className={styles.rowMain}>
                <p className={styles.rowTitle}>{item.name}</p>
                <p className={styles.rowSub}>
                  {places} мест · {uCount} пользователей
                  {isEmpty && <span className={styles.warnText}> · кандидат на удаление</span>}
                </p>
              </div>
              <div className={styles.rowActions}>
                <button
                  className={styles.iconBtn}
                  onClick={() => onEditInterest(item.id)}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  onClick={() => onConfirmDelete(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Pagination page={page} total={filtered.length} onPage={setPage} />
    </>
  )
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────

type UserSort = "date_desc" | "date_asc" | "interests_desc"

function UsersTab({ users, interests }: { users: AdminUserCard[]; interests: AdminInterestCard[] }) {
  const [sort, setSort]         = useState<UserSort>("date_desc")
  const [search, setSearch]     = useState("")
  const [filterInterest, setFilterInterest] = useState<number | null>(null)
  const [page, setPage]         = useState(1)

  const SORTS: { value: UserSort; label: string }[] = [
    { value: "date_desc",      label: "Новые"     },
    { value: "date_asc",       label: "Старые"    },
    { value: "interests_desc", label: "Интересы"  },
  ]

  const filtered = users.filter(u =>
    (!search || u.phone.includes(search)) &&
    (!filterInterest || u.interests.some(i => i.id === filterInterest))
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "date_desc")      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sort === "date_asc")       return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (sort === "interests_desc") return b.interests.length - a.interests.length
    return 0
  })

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Поиск по телефону…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <div className={styles.sortGroup}>
          {SORTS.map(o => (
            <button
              key={o.value}
              className={`${styles.sortBtn} ${sort === o.value ? styles.sortBtnActive : ""}`}
              onClick={() => { setSort(o.value); setPage(1) }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interest filter chips */}
      <div className={styles.filterRow}>
        <button
          className={`${styles.filterChip} ${!filterInterest ? styles.filterChipActive : ""}`}
          onClick={() => { setFilterInterest(null); setPage(1) }}
        >
          Все
        </button>
        {interests.slice(0, 8).map(i => (
          <button
            key={i.id}
            className={`${styles.filterChip} ${filterInterest === i.id ? styles.filterChipActive : ""}`}
            onClick={() => { setFilterInterest(filterInterest === i.id ? null : i.id); setPage(1) }}
          >
            {i.emoji} {i.name}
          </button>
        ))}
      </div>

      <div className={styles.scrollList}>
        {paged.map(user => {
          const top3 = [...user.interests]
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 3)
          return (
            <div key={user.id} className={styles.row}>
              <div className={styles.userAvatar}>{user.phone.slice(-2)}</div>
              <div className={styles.rowMain}>
                <p className={styles.rowTitle}>{user.phone}</p>
                <div className={styles.top3Row}>
                  {top3.map(i => {
                    const int = interests.find(x => x.id === i.id)
                    return (
                      <span key={i.id} className={styles.top3Chip}>
                        {int?.emoji} {int?.name ?? `#${i.id}`}
                        <span className={styles.top3Weight}>{i.weight}</span>
                      </span>
                    )
                  })}
                  {top3.length === 0 && (
                    <span className={styles.rowSub}>нет интересов</span>
                  )}
                </div>
              </div>
              <span className={styles.badgeNeutral}>
                {new Date(user.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>
          )
        })}
      </div>

      <Pagination page={page} total={filtered.length} onPage={setPage} />
    </>
  )
}

// ─── Loading state ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className={styles.center}>
      <Loader2 size={28} className={styles.spin} />
      <p>Загружаем данные…</p>
    </div>
  )
}

// ─── Admin Content (uses useSearchParams) ─────────────────────────────────────

type Tab = "posts" | "interests" | "users"

function AdminContent({ onLogout }: { onLogout: () => void }) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const tab: Tab             = (searchParams.get("tab") as Tab) ?? "posts"
  const editPostId: number | null    = searchParams.get("editPost")    ? Number(searchParams.get("editPost"))    : null
  const editInterestId: number | null = searchParams.get("editInterest") ? Number(searchParams.get("editInterest")) : null
  const confirmDeleteId: number | null = searchParams.get("confirmDelete") ? Number(searchParams.get("confirmDelete")) : null

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    router.replace(`/admin?${params.toString()}`, { scroll: false })
  }

  const { data, isLoading, refetch } = useGetAdminDashboardQuery({
    postsPage: 1, postsPageSize: 100,
    interestsPage: 1, interestsPageSize: 100,
    usersPage: 1, usersPageSize: 100,
  })

  if (isLoading) return <LoadingState />

  if (!data) return (
    <div className={styles.center}><p>Нет доступа или ошибка API</p></div>
  )

  const postsNoCoords = data.posts.filter(p => p.geoLat == null && p.geoLng == null).length
  const postsNoPhoto  = data.posts.filter(p => (p.photos?.length ?? 0) === 0).length

  const TABS = [
    { key: "posts"     as Tab, label: "Места",        count: data.posts.length     },
    { key: "interests" as Tab, label: "Интересы",     count: data.interests.length },
    { key: "users"     as Tab, label: "Пользователи", count: data.users.length     },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 className={styles.title}>Админ-панель</h1>
              <p className={styles.sub}>
                <BrandMark /> · управление данными
              </p>
            </div>
            <button className={styles.btnLogout} onClick={onLogout}>Выйти</button>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><MapPin size={17} /></div>
            <div>
              <p className={styles.statValue}>{data.stats.totalPosts}</p>
              <p className={styles.statLabel}>Мест</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Zap size={17} /></div>
            <div>
              <p className={styles.statValue}>{data.stats.totalInterests}</p>
              <p className={styles.statLabel}>Интересов</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Users size={17} /></div>
            <div>
              <p className={styles.statValue}>{data.stats.totalUsers}</p>
              <p className={styles.statLabel}>Пользователей</p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {(postsNoCoords > 0 || postsNoPhoto > 0) && (
          <div className={styles.warnBar}>
            <AlertTriangle size={13} color="#F59E0B" />
            {postsNoCoords > 0 && <span>{postsNoCoords} мест без координат</span>}
            {postsNoPhoto  > 0 && <span>{postsNoPhoto} мест без фото</span>}
          </div>
        )}

        {/* Top interests widget */}
        {tab === "users" && (
          <TopInterestsWidget users={data.users} interests={data.interests} />
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
              onClick={() => updateParams({ tab: t.key, editPost: null, editInterest: null, confirmDelete: null })}
            >
              {t.label} <span className={styles.tabCount}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className={styles.panel}>
          {tab === "posts" && (
            <PostsTab
              posts={data.posts}
              interests={data.interests}
              refetch={refetch}
              editPostId={editPostId}
              onEditPost={(id) => updateParams({ editPost: id != null ? String(id) : null })}
            />
          )}
          {tab === "interests" && (
            <InterestsTab
              interests={data.interests}
              users={data.users}
              posts={data.posts}
              refetch={refetch}
              editInterestId={editInterestId}
              onEditInterest={(id) => updateParams({ editInterest: id != null ? String(id) : null })}
              confirmDeleteId={confirmDeleteId}
              onConfirmDelete={(id) => updateParams({ confirmDelete: id != null ? String(id) : null })}
            />
          )}
          {tab === "users" && (
            <UsersTab users={data.users} interests={data.interests} />
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setAuthed(localStorage.getItem(AUTH_KEY) === "ok")
  }, [])

  function handleAuth() {
    setAuthed(true)
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_KEY)
    setAuthed(false)
  }

  // Avoid SSR flash — null means "not yet checked"
  if (authed === null) return null

  if (!authed) {
    return <AdminLogin onAuth={handleAuth} />
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <AdminContent onLogout={handleLogout} />
    </Suspense>
  )
}
