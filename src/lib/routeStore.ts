import type { PostResponse } from "@/lib/types"

export type RouteTransport = "car" | "walk" | "bus" | "bike"
export type RouteBudget    = "budget" | "comfort" | "premium"
export type RouteTempo     = "slow" | "normal" | "active"

export interface SavedRoute {
  id: string
  title: string
  narrative: string
  places: PostResponse[]
  groupLabel: string
  days: number
  transport?: RouteTransport
  budget?: RouteBudget
  tempo?: RouteTempo
  createdAt: string
}

export function saveRoute(route: Omit<SavedRoute, "id" | "createdAt">): string {
  const id = Date.now().toString()
  const saved: SavedRoute = { ...route, id, createdAt: new Date().toISOString() }
  try {
    localStorage.setItem(`route-${id}`, JSON.stringify(saved))
  } catch {}
  return id
}

export function getRoute(id: string): SavedRoute | null {
  try {
    const raw = localStorage.getItem(`route-${id}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function listRoutes(): SavedRoute[] {
  try {
    const routes: SavedRoute[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("route-")) {
        const raw = localStorage.getItem(key)
        if (raw) {
          try { routes.push(JSON.parse(raw)) } catch {}
        }
      }
    }
    return routes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

export function deleteRoute(id: string): void {
  try {
    localStorage.removeItem(`route-${id}`)
  } catch {}
}
