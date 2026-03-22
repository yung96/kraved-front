/**
 * Overpass API helpers for fetching hiking trails from OpenStreetMap.
 * Bounding box: Krasnodar region + Adygea (43–45°N, 37–41°E)
 */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter"

// Krasnodar region bounding box
const BBOX = "43,37,45,41"

export interface OsmWay {
  id: number
  tags: Record<string, string>
  geometry: { lat: number; lon: number }[]
}

export interface OsmRelation {
  id: number
  tags: Record<string, string>
  members: { type: string; ref: number; role: string; geometry?: { lat: number; lon: number }[] }[]
}

export interface TrailPath {
  id: string
  name: string
  difficulty: "easy" | "medium" | "hard"
  coords: [number, number][]  // [lat, lng][]
}

/** Map OSM sac_scale / route tags to difficulty */
function toDifficulty(tags: Record<string, string>): "easy" | "medium" | "hard" {
  const sac = tags["sac_scale"] ?? ""
  if (sac === "hiking") return "easy"
  if (sac === "mountain_hiking") return "medium"
  if (sac.includes("demanding") || sac.includes("alpine")) return "hard"

  const diff = (tags["difficulty"] ?? "").toLowerCase()
  if (diff.includes("easy") || diff.includes("лёгк")) return "easy"
  if (diff.includes("hard") || diff.includes("сложн")) return "hard"
  return "medium"
}

/**
 * Fetch hiking route relations from Overpass API.
 * Returns array of trail paths with coordinates.
 */
export async function fetchHikingTrails(): Promise<TrailPath[]> {
  const query = `
[out:json][timeout:30][bbox:${BBOX}];
(
  relation["route"~"hiking|foot"]["name"];
);
out geom;
`

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    next: { revalidate: 3600 }, // cache 1 hour
  })

  if (!res.ok) throw new Error(`Overpass error: ${res.status}`)
  const data = await res.json()

  const trails: TrailPath[] = []

  for (const element of data.elements ?? []) {
    if (element.type !== "relation") continue

    const name: string = element.tags?.name ?? element.tags?.["name:ru"] ?? `Маршрут ${element.id}`

    // Collect all coords from member ways
    const coords: [number, number][] = []
    for (const member of element.members ?? []) {
      if (member.type !== "way" || !member.geometry) continue
      for (const pt of member.geometry) {
        coords.push([pt.lat, pt.lon])
      }
    }

    if (coords.length < 2) continue

    trails.push({
      id: `osm-${element.id}`,
      name,
      difficulty: toDifficulty(element.tags ?? {}),
      coords,
    })
  }

  return trails
}

/**
 * Fetch individual hiking paths (ways) — for denser coverage on the map.
 * Uses sac_scale tag to find marked mountain trails.
 */
export async function fetchHikingPaths(): Promise<TrailPath[]> {
  const query = `
[out:json][timeout:30][bbox:${BBOX}];
(
  way["highway"="path"]["sac_scale"];
  way["highway"="track"]["sac_scale"];
);
out geom;
`

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`Overpass paths error: ${res.status}`)
  const data = await res.json()

  return (data.elements ?? [])
    .filter((el: { type: string; geometry?: unknown[] }) => el.type === "way" && (el.geometry?.length ?? 0) >= 2)
    .map((el: { id: number; tags?: Record<string, string>; geometry: { lat: number; lon: number }[] }) => ({
      id: `osm-way-${el.id}`,
      name: el.tags?.name ?? el.tags?.["name:ru"] ?? "Тропа",
      difficulty: toDifficulty(el.tags ?? {}),
      coords: el.geometry.map((pt) => [pt.lat, pt.lon] as [number, number]),
    }))
}
