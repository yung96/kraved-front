/**
 * Server-side fetch helpers (used in Next.js Server Components).
 * For client-side data fetching — use RTK Query hooks from @/store/kraevedApi.
 */
import type { PostListResponse, PostResponse, ReviewListResponse } from "@/lib/types"

export type { Post, PostList, PostResponse, PostListResponse, Interest, InterestList, Review, ReviewList, User } from "@/lib/types"

/** Базовый URL бэкенда Kraeved (путь с `/api`). */
export const PUBLIC_API_BASE_URL = "https://apikraeved.tw1.su/api"

const API = PUBLIC_API_BASE_URL

async function get<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json()
}

/** Server-side API calls (Server Components / Route Handlers) */
export const api = {
  posts: {
    list: (page = 1) => get<PostListResponse>(`/posts?page=${page}&pageSize=20`),
    get: (id: number) => get<PostResponse>(`/posts/${id}`),
    reviews: (id: number) => get<ReviewListResponse>(`/posts/${id}/reviews`),
  },
}

const API_HOST = PUBLIC_API_BASE_URL.replace(/\/api$/, "")

/** Resolve full image URL from relative or absolute path */
export const imgSrc = (url?: string) => {
  if (!url) return "/park.jpeg"
  if (url.startsWith("http")) return url
  return `${API_HOST}${url}`
}
