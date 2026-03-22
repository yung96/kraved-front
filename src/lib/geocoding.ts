// ── In-memory cache (survives page navigation, cleared on hard refresh) ────────
const revCache  = new Map<string, string>()
const searchCache = new Map<string, GeocodeSearchResult[]>()
const routeCache = new Map<string, { distanceKm: number; durationMin: number } | null>()

export interface GeocodeSearchResult {
  lat: number
  lng: number
  displayName: string
}

/** Nominatim forward search (первые результаты). */
export async function searchGeocode(query: string, limit = 5): Promise<GeocodeSearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const key = `${limit}|${q.toLowerCase()}`
  if (searchCache.has(key)) return searchCache.get(key)!

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}` +
      `&limit=${limit}&accept-language=ru`
    const res = await fetch(url, {
      headers: { "User-Agent": "KraevedApp/1.0 (educational project)" },
    })
    if (!res.ok) return []

    const data: { lat?: string; lon?: string; display_name?: string }[] = await res.json()
    if (!Array.isArray(data)) return []

    const out: GeocodeSearchResult[] = []
    for (const row of data) {
      const lat = row.lat != null ? Number(row.lat) : NaN
      const lng = row.lon != null ? Number(row.lon) : NaN
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      out.push({
        lat,
        lng,
        displayName: row.display_name ?? q,
      })
    }
    searchCache.set(key, out)
    return out
  } catch {
    return []
  }
}

/** Центр сегмента А–Б и полуразмер bbox в градусах (для ivan-alt), с запасом и clamp 0.15–2.0. */
export function bboxFromTwoPoints(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): { centerLat: number; centerLng: number; bboxDeltaDegrees: number } {
  const centerLat = (a.lat + b.lat) / 2
  const centerLng = (a.lng + b.lng) / 2
  const halfLat = Math.abs(a.lat - b.lat) / 2
  const halfLng = Math.abs(a.lng - b.lng) / 2
  const raw = Math.max(halfLat, halfLng) + 0.12
  const bboxDeltaDegrees = Math.min(2.0, Math.max(0.15, raw))
  return { centerLat, centerLng, bboxDeltaDegrees }
}

// ── Nominatim reverse geocoding ───────────────────────────────────────────────
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
  if (revCache.has(key)) return revCache.get(key)!

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ru`
    const res  = await fetch(url, {
      headers: { "User-Agent": "KraevedApp/1.0 (educational project)" },
    })
    if (!res.ok) return ""

    const data = await res.json()
    const a    = data.address ?? {}

    const road     = a.road || a.pedestrian || a.path || ""
    const locality = a.city || a.town || a.village || a.suburb || ""
    const short    = road
      ? (locality ? `${road}, ${locality}` : road)
      : locality

    revCache.set(key, short)
    return short
  } catch {
    return ""
  }
}

// ── OSRM routing ──────────────────────────────────────────────────────────────
export async function getRouteInfo(
  fromLat: number,
  fromLng: number,
  toLat:   number,
  toLng:   number,
  profile: "driving" | "walking" | "cycling" = "driving",
): Promise<{ distanceKm: number; durationMin: number } | null> {
  const key = `${profile}|${fromLat.toFixed(4)},${fromLng.toFixed(4)}->${toLat.toFixed(4)},${toLng.toFixed(4)}`
  if (routeCache.has(key)) return routeCache.get(key)!

  try {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
    const res = await fetch(url)
    if (!res.ok) { routeCache.set(key, null); return null }

    const data = await res.json()
    if (data.code !== "Ok" || !data.routes?.[0]) { routeCache.set(key, null); return null }

    const { distance, duration } = data.routes[0]
    const result = {
      distanceKm: Math.round(distance / 100) / 10,
      durationMin: Math.ceil(duration / 60),
    }
    routeCache.set(key, result)
    return result
  } catch {
    routeCache.set(key, null)
    return null
  }
}
