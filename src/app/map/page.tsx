"use client"

import AppImage from "@/components/ui/AppImage/AppImage"
import BottomBar from "@/components/ui/BottomBar/BottomBar"
import { imgSrc, PUBLIC_API_BASE_URL } from "@/lib/api"
import { listRoutes, type SavedRoute } from "@/lib/routeStore"
import type { FilterOption, InterestResponse, PostResponse } from "@/lib/types"
import { useGetFiltersConfigQuery, useListInterestsQuery, useListPostsQuery } from "@/store/kraevedApi"
import { BrandMark } from "@/components/BrandMark/BrandMark"
import MapView, { type MapViewRef } from "@/components/MapView/MapView"
import { ChevronDown, Loader2, MapPin, Navigation, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import styles from "./map.module.css"

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [38.97, 45.04]
const DEFAULT_ZOOM = 11

// ── Category colour & icon map ─────────────────────────────────────────────────
interface PinStyle {
  bg: string
  icon: string
}

function getPinStyle(category: string): PinStyle {
  const c = category.toLowerCase()
  if (c.includes("ресторан") || c.includes("кафе") || c.includes("еда") || c.includes("food") || c.includes("cafe") || c.includes("restaurant"))
    return { bg: "#22C55E", icon: "🍽" }
  if (c.includes("развлечен") || c.includes("парк") || c.includes("entertainment") || c.includes("park"))
    return { bg: "#EAB308", icon: "☀️" }
  if (c.includes("фото") || c.includes("photo") || c.includes("вид") || c.includes("view"))
    return { bg: "#F97316", icon: "📸" }
  if (c.includes("достопримечательн") || c.includes("музей") || c.includes("attraction") || c.includes("museum") || c.includes("история"))
    return { bg: "#6B7280", icon: "🏛" }
  if (c.includes("бар") || c.includes("клуб") || c.includes("bar") || c.includes("club") || c.includes("напит"))
    return { bg: "#6366F1", icon: "🍷" }
  if (c.includes("маршрут") || c.includes("прогул") || c.includes("trail") || c.includes("walk"))
    return { bg: "#0EA5E9", icon: "🚶" }
  if (c.includes("магазин") || c.includes("торг") || c.includes("shop") || c.includes("market"))
    return { bg: "#EC4899", icon: "🛍" }
  return { bg: "#22EA36", icon: "📍" }
}

// ── Tab type ──────────────────────────────────────────────────────────────────
type MapTab = "places" | "districts"

// ── Map points from API ───────────────────────────────────────────────────────
interface MapPoint {
  id: number
  name: string
  type?: string
  centroid?: string   // "lat,lng"
  lat?: number
  lng?: number
  photo?: string
  photos?: string[]
  population?: number
  placesCount?: number
  description?: string
  polygon?: {
    type: string
    coordinates: number[][][]
  }
}

interface MapRoute {
  id: number
  title: string
  shareToken: string
  totalDays: number
  totalExperiences: number
  status: string
  polyline: [number, number][]   // [lat, lng]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapPage() {
  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { data: postsData, isLoading: postsLoading } = useListPostsQuery({ pageSize: 100 } as never)
  const { data: interestsData } = useListInterestsQuery({ pageSize: 100 })
  const { data: filtersConfig } = useGetFiltersConfigQuery()

  const posts = postsData?.items ?? []
  const withGeo = posts.filter((p) => p.geoLat && p.geoLng)
  const interests: InterestResponse[] = interestsData?.items ?? []
  const placeTypes: FilterOption[] = filtersConfig?.placeTypes ?? []

  // Interest id → InterestResponse lookup
  const interestsMap = useMemo(() => {
    const m: Record<number, InterestResponse> = {}
    interests.forEach((i) => { m[i.id] = i })
    return m
  }, [interests])

  // ── URL param: ?city= ────────────────────────────────────────────────────────
  const [cityName, setCityName] = useState("Краснодар")
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const c = p.get("city")
    if (c) setCityName(c)
  }, [])

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeType, setActiveType] = useState<string | null>(null)
  const activeTypeRef = useRef<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MapTab>("places")
  const [districtMsgVisible, setDistrictMsgVisible] = useState(false)
  const [locating, setLocating] = useState(false)

  // Full place overlay state
  const [fullPlaceOpen, setFullPlaceOpen] = useState(false)

  // Day Plans sheet state
  const [dayPlansOpen, setDayPlansOpen] = useState(false)
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([])

  // Map points state (zoom-based API loading)
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const [pointsLevel, setPointsLevel] = useState<string>("city")
  const [mapRoutes, setMapRoutes] = useState<MapRoute[]>([])
  const [districtPolygons, setDistrictPolygons] = useState<MapPoint[]>([])
  const districtsLoadedRef = useRef(false)

  const selected = useMemo(
    () => withGeo.find((p) => p.id === selectedId) ?? null,
    [selectedId, withGeo],
  )

  // ── Filtered places ──────────────────────────────────────────────────────────
  const visiblePlaces = useMemo(() => {
    let list = withGeo
    if (cityName !== "Краснодар") {
      list = list.filter((p) => (p.city ?? "").includes(cityName))
    }
    return list
  }, [withGeo, cityName])

  const filteredByChip = useMemo(() => {
    if (!activeType) return visiblePlaces
    const matchIds = interests
      .filter((i) => i.name.toLowerCase().includes(activeType.toLowerCase()) || activeType.toLowerCase().includes(i.name.toLowerCase()))
      .map((i) => i.id)
    if (matchIds.length === 0) return visiblePlaces
    return visiblePlaces.filter((p) => p.interestIds.some((id) => matchIds.includes(id)))
  }, [visiblePlaces, activeType, interests])

  // ── MapLibre refs ────────────────────────────────────────────────────────────
  const mapRef          = useRef<MapViewRef>(null)
  const markersRef      = useRef<Map<number, import("maplibre-gl").Marker>>(new Map())
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ── Fetch map points from API ─────────────────────────────────────────────────
  function fetchMapPoints() {
    const map = mapRef.current?.getMap()
    if (!map) return

    const zoom = Math.floor(map.getZoom())
    const center = map.getCenter()
    let url = `${PUBLIC_API_BASE_URL}/filters/map-points?zoom=${zoom}`
    if (zoom >= 12) {
      url += `&lat=${center.lat.toFixed(4)}&lng=${center.lng.toFixed(4)}`
    }
    if (activeTypeRef.current) {
      url += `&place_type=${encodeURIComponent(activeTypeRef.current)}`
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        // API returns {zoom, districts[], cities[], places[]}
        // Pick the right level based on current zoom
        let level: string
        let points: MapPoint[]
        if (zoom < 8) {
          level = "district"
          points = data.districts ?? data.points ?? []
        } else if (zoom < 12) {
          level = "city"
          points = data.cities ?? data.points ?? []
        } else {
          level = "place"
          points = data.places ?? data.points ?? []
        }
        setMapPoints(points)
        setPointsLevel(level)
        setMapRoutes(data.routes ?? [])
        // Always store district polygons (loaded once)
        if (!districtsLoadedRef.current && data.districts?.length) {
          setDistrictPolygons(data.districts)
          districtsLoadedRef.current = true
        }
      })
      .catch(() => {})
  }

  // ── onLoad: called once map is ready ─────────────────────────────────────────
  const handleMapLoad = useCallback((map: import("maplibre-gl").Map) => {
    // ── GeoJSON source with clustering (fallback for places level) ─────
    map.addSource("places", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    })

    // Cluster circles
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "places",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#22EA36",
        "circle-radius": [
          "step",
          ["get", "point_count"],
          20,
          5,  25,
          10, 30,
        ],
        "circle-stroke-width": 3,
        "circle-stroke-color": "#fff",
      },
    })

    // Cluster count labels
    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "places",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 14,
      },
      paint: { "text-color": "#fff" },
    })

    // Click on cluster → zoom in
    map.on("click", "clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })
      if (!features.length) return
      const clusterId = (features[0].properties as any).cluster_id
      const source = map.getSource("places") as import("maplibre-gl").GeoJSONSource
      const geom = features[0].geometry as GeoJSON.Point
      source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
        map.easeTo({ center: geom.coordinates as [number, number], zoom })
      })
    })

    map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer" })
    map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = "" })

    // Initial load
    fetchMapPoints()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── onMoveEnd: debounced fetch ───────────────────────────────────────────────
  const handleMoveEnd = useCallback(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
    fetchTimeoutRef.current = setTimeout(fetchMapPoints, 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup fetch timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
    }
  }, [])

  // ── Update GeoJSON source when filtered places change ────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    function updateSource() {
      const source = map!.getSource("places") as import("maplibre-gl").GeoJSONSource | undefined
      if (!source) return
      source.setData({
        type: "FeatureCollection",
        features: filteredByChip.map((p) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [p.geoLng!, p.geoLat!] },
          properties: {
            id: p.id,
            title: p.title,
            photo: p.photos?.[0] ?? "",
            city: p.city ?? "",
          },
        })),
      })
    }

    if (map.loaded()) {
      updateSource()
    } else {
      map.once("load", updateSource)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredByChip])

  // ── Render API-based map point markers ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    import("maplibre-gl").then((mod) => {
      const maplibregl = mod.default

      // Clear all existing API markers
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()

      // ── District polygon fills — always visible ────────────────────────
      {
        // Use districtPolygons (loaded once) not mapPoints
        const polySource = districtPolygons.length > 0 ? districtPolygons : mapPoints
        const polygonFeatures = polySource
          .filter((p) => p.polygon)
          .map((p) => ({
            type: "Feature" as const,
            id: p.id,
            properties: { id: p.id, name: p.name, placesCount: p.placesCount },
            geometry: p.polygon as GeoJSON.Geometry,
          }))

        const existingSource = map.getSource("districts") as import("maplibre-gl").GeoJSONSource | undefined
        if (existingSource) {
          existingSource.setData({ type: "FeatureCollection", features: polygonFeatures })
        } else {
          map.addSource("districts", {
            type: "geojson",
            data: { type: "FeatureCollection", features: polygonFeatures },
            promoteId: "id",
          })

          map.addLayer({
            id: "district-fill",
            type: "fill",
            source: "districts",
            layout: { "visibility": "none" },
            paint: {
              "fill-color": "#22EA36",
              "fill-opacity": [
                "interpolate", ["linear"], ["zoom"],
                6, ["case", ["boolean", ["feature-state", "hover"], false], 0.45, 0.25],
                10, ["case", ["boolean", ["feature-state", "hover"], false], 0.25, 0.1],
                14, ["case", ["boolean", ["feature-state", "hover"], false], 0.15, 0.05],
              ],
            },
          })

          map.addLayer({
            id: "district-outline",
            type: "line",
            source: "districts",
            layout: { "visibility": "none" },
            paint: {
              "line-color": "#206915",
              "line-width": ["interpolate", ["linear"], ["zoom"], 6, 2, 12, 1, 16, 0.5],
              "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.9, 14, 0.3],
            },
          })

          // Hover effect
          let hoveredId: number | null = null
          map.on("mousemove", "district-fill", (e) => {
            if (e.features && e.features.length > 0) {
              if (hoveredId !== null) {
                map.setFeatureState({ source: "districts", id: hoveredId }, { hover: false })
              }
              hoveredId = e.features[0].id as number
              map.setFeatureState({ source: "districts", id: hoveredId }, { hover: true })
              map.getCanvas().style.cursor = "pointer"
            }
          })
          map.on("mouseleave", "district-fill", () => {
            if (hoveredId !== null) {
              map.setFeatureState({ source: "districts", id: hoveredId }, { hover: false })
            }
            hoveredId = null
            map.getCanvas().style.cursor = ""
          })

          // Click to zoom into district centroid
          map.on("click", "district-fill", (e) => {
            if (e.features && e.features.length > 0) {
              const props = e.features[0].properties as { id: number }
              const point = mapPoints.find((p) => p.id === props.id)
              if (point?.centroid) {
                const [lat, lng] = point.centroid.split(",").map(Number)
                map.flyTo({ center: [lng, lat], zoom: 11, duration: 800 })
              }
            }
          })
        }
      }

      // ── Place / city / district label markers ─────────────────────────────
      mapPoints.forEach((point) => {
        let lat: number, lng: number

        if (point.centroid) {
          const parts = point.centroid.split(",")
          lat = parseFloat(parts[0])
          lng = parseFloat(parts[1])
        } else {
          lat = point.lat ?? 0
          lng = point.lng ?? 0
        }

        if (!lat || !lng) return

        const el = document.createElement("div")

        if (pointsLevel === "place") {
          const { bg, icon } = getPinStyle(point.type ?? "")
          const photoUrl = point.photo ?? point.photos?.[0] ?? null
          el.className = styles.pinCard
          el.innerHTML = `
            <div class="${styles.pinCardInner}">
              ${photoUrl
                ? `<img class="${styles.pinCardPhoto}" src="${photoUrl}" alt="" onerror="this.style.display='none'" />`
                : `<div class="${styles.pinCardPhoto}" style="background:#f3f3f3;display:flex;align-items:center;justify-content:center;font-size:22px">${icon}</div>`
              }
              <div class="${styles.pinCardLabel}">
                <span class="${styles.pinCardLabelIcon}" style="background:${bg}">${icon}</span>
                ${point.name}
              </div>
            </div>
            <div class="${styles.pinCardArrow}"></div>
          `
        } else if (pointsLevel === "city") {
          el.className = styles.pinCity
          el.textContent = point.name
        } else {
          // district label pin (on top of polygon)
          el.className = styles.pinDistrict
          el.textContent = point.name
        }

        el.addEventListener("click", () => {
          if (pointsLevel === "place") {
            // Open place page directly
            window.location.href = `/place/${point.id}`
          } else {
            const targetZoom = pointsLevel === "city" ? 13 : 11
            mapRef.current?.flyTo(lng, lat, targetZoom)
          }
        })

        const anchor = pointsLevel === "place" ? "bottom" : "center"
        const marker = new maplibregl.Marker({ element: el, anchor })
          .setLngLat([lng, lat])
          .addTo(map)

        markersRef.current.set(point.id, marker)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapPoints, pointsLevel, postsData, districtPolygons])

  // ── Render route polylines on map ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    // Remove old route layers/sources
    const oldIds = (map.getStyle()?.layers ?? [])
      .filter((l: { id: string }) => l.id.startsWith("route-line-"))
      .map((l: { id: string }) => l.id)
    for (const lid of oldIds) {
      map.removeLayer(lid)
    }
    for (const route of mapRoutes) {
      const srcId = `route-src-${route.id}`
      if (map.getSource(srcId)) map.removeSource(srcId)
    }
    // Also clean any previously rendered route sources
    const styleSources = map.getStyle()?.sources ?? {}
    for (const srcKey of Object.keys(styleSources)) {
      if (srcKey.startsWith("route-src-")) {
        // check if layer still exists first
        const layerHalo = `route-line-halo-${srcKey.replace("route-src-", "")}`
        const layerMain = `route-line-main-${srcKey.replace("route-src-", "")}`
        if (map.getLayer(layerHalo)) map.removeLayer(layerHalo)
        if (map.getLayer(layerMain)) map.removeLayer(layerMain)
        map.removeSource(srcKey)
      }
    }

    // Draw new routes
    const ROUTE_COLORS = ["#206915", "#F97316", "#6366F1", "#EC4899"]

    mapRoutes.forEach((route, idx) => {
      if (!route.polyline || route.polyline.length < 2) return

      const srcId = `route-src-${route.id}`
      const color = ROUTE_COLORS[idx % ROUTE_COLORS.length]
      // polyline is [lat, lng], maplibre needs [lng, lat]
      const coords = route.polyline.map(([lat, lng]) => [lng, lat])

      map.addSource(srcId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { id: route.id, title: route.title, shareToken: route.shareToken },
          geometry: { type: "LineString", coordinates: coords },
        },
      })

      map.addLayer({
        id: `route-line-halo-${route.id}`,
        type: "line",
        source: srcId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#fff", "line-width": 7, "line-opacity": 0.6 },
      })

      map.addLayer({
        id: `route-line-main-${route.id}`,
        type: "line",
        source: srcId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": color, "line-width": 3.5, "line-opacity": 0.85 },
      })

      // Click on route line → navigate to trip page
      map.on("click", `route-line-main-${route.id}`, () => {
        window.location.href = `/trip/${route.shareToken}`
      })

      map.on("mouseenter", `route-line-main-${route.id}`, () => {
        map.getCanvas().style.cursor = "pointer"
      })

      map.on("mouseleave", `route-line-main-${route.id}`, () => {
        map.getCanvas().style.cursor = ""
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRoutes])

  // ── Fly to selected place ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!selected || !map) return
    map.flyTo({
      center: [selected.geoLng!, selected.geoLat!],
      zoom: 14,
      duration: 800,
      offset: [0, -80],
    })
  }, [selected])

  // ── Fly to city when cityName or places load ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || visiblePlaces.length === 0) return
    const first = visiblePlaces[0]
    if (first.geoLat && first.geoLng) {
      map.flyTo({ center: [first.geoLng, first.geoLat], zoom: DEFAULT_ZOOM, duration: 1000 })
    }
  }, [cityName, visiblePlaces.length])

  // ── Load saved routes when day plans sheet opens ──────────────────────────────
  useEffect(() => {
    if (dayPlansOpen) {
      setSavedRoutes(listRoutes())
    }
  }, [dayPlansOpen])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleChipClick(value: string | null) {
    setActiveType(value)
    activeTypeRef.current = value
    setSheetOpen(false)
    setFullPlaceOpen(false)
    setSelectedId(null)
    // Refetch map points with new filter
    setTimeout(() => fetchMapPoints(), 50)
  }

  function handlePinClick(place: PostResponse) {
    setSelectedId(place.id)
    setFullPlaceOpen(true)
  }

  function handleCloseSheet() {
    setSheetOpen(false)
    setSelectedId(null)
  }

  function handleCloseFullPlace() {
    setFullPlaceOpen(false)
    setSelectedId(null)
  }

  function handleRouteClick() {
    if (!selected) return
    const url = `https://maps.2gis.com/routeSearch/to/${selected.geoLng},${selected.geoLat}`
    window.open(url, "_blank", "noopener")
  }

  function handleTabClick(tab: MapTab) {
    setActiveTab(tab)

    // Show/hide district polygons
    const map = mapRef.current?.getMap()
    if (map) {
      const fillVis = tab === "districts" ? "visible" : "none"
      if (map.getLayer("district-fill")) map.setLayoutProperty("district-fill", "visibility", fillVis)
      if (map.getLayer("district-outline")) map.setLayoutProperty("district-outline", "visibility", fillVis)
    }
  }

  function handleLocate() {
    const map = mapRef.current?.getMap()
    if (!navigator.geolocation || !map) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 14,
          duration: 900,
        })
      },
      () => setLocating(false),
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── Map (full screen) ── */}
      <div className={styles.mapWrap}>
        {postsLoading && (
          <div className={styles.mapLoader}>
            <Loader2 size={32} className={styles.spin} color="#888" />
          </div>
        )}
        <MapView
          ref={mapRef}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ width: "100%", height: "100%" }}
          onLoad={handleMapLoad}
          onMoveEnd={handleMoveEnd}
        />
      </div>

      {/* ── Header pill ── */}
      <div className={styles.header}>
        <button className={styles.headerPill}>
          <span>
            <BrandMark /> {cityName}
          </span>
          <ChevronDown size={15} className={styles.headerChevron} />
        </button>
      </div>

      {/* ── Category chips ── */}
      <div className={styles.chips}>
        <button
          className={`${styles.chip} ${activeType === null ? styles.chipActive : ""}`}
          onClick={() => handleChipClick(null)}
        >
          Все
        </button>
        {placeTypes.map((pt) => {
          const { bg, icon } = getPinStyle(pt.value)
          return (
            <button
              key={pt.value}
              className={`${styles.chip} ${activeType === pt.value ? styles.chipActive : ""}`}
              onClick={() => handleChipClick(pt.value)}
            >
              <span
                className={styles.chipIcon}
                style={{ backgroundColor: activeType === pt.value ? "rgba(255,255,255,0.3)" : bg }}
              >
                {icon}
              </span>
              {pt.label}
            </button>
          )
        })}
        {placeTypes.length === 0 && interests.map((interest) => {
          const { bg, icon } = getPinStyle(interest.name)
          return (
            <button
              key={interest.id}
              className={`${styles.chip} ${activeType === String(interest.id) ? styles.chipActive : ""}`}
              onClick={() => handleChipClick(String(interest.id))}
            >
              <span
                className={styles.chipIcon}
                style={{ backgroundColor: activeType === String(interest.id) ? "rgba(255,255,255,0.3)" : bg }}
              >
                {interest.emoji || icon}
              </span>
              {interest.name}
            </button>
          )
        })}
      </div>

      {/* ── Districts coming soon message ── */}
      {districtMsgVisible && (
        <div className={styles.districtMsg}>Районы скоро появятся</div>
      )}

      {/* ── Location button ── */}
      <button
        className={`${styles.locationBtn} ${locating ? styles.locationBtnActive : ""}`}
        onClick={handleLocate}
        aria-label="Моё местоположение"
      >
        <Navigation size={18} strokeWidth={2} />
      </button>

      {/* ── Day Plans button ── */}
      <button
        className={styles.dayPlansBtn}
        onClick={() => setDayPlansOpen(true)}
      >
        <span>🗺</span>
        Маршруты дня
      </button>

      {/* ── Tab bar: Районы | Места ── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === "districts" ? styles.tabActiveDistricts : ""}`}
          onClick={() => handleTabClick("districts")}
        >
          Районы
        </button>
        <button
          className={`${styles.tab} ${activeTab === "places" ? styles.tabActivePlaces : ""}`}
          onClick={() => handleTabClick("places")}
        >
          Места
        </button>
      </div>

      {/* ── Full-screen place card overlay ── */}
      {fullPlaceOpen && selected && (
        <div className={styles.fullPlace}>
          <div className={styles.fullPlaceScroll}>
            {/* Header */}
            <div className={styles.fullPlaceHeader}>
              <h1 className={styles.fullPlaceTitle}>{selected.title}</h1>
              <button className={styles.fullPlaceClose} onClick={handleCloseFullPlace}>
                <X size={18} />
              </button>
            </div>

            {/* Tags */}
            <div className={styles.fullPlaceTags}>
              {selected.interestIds.map((id) => {
                const interest = interestsMap[id]
                if (!interest) return null
                return (
                  <span key={id} className={styles.fullPlaceTag}>
                    {interest.emoji} {interest.name}
                  </span>
                )
              })}
            </div>

            {/* Action buttons */}
            <div className={styles.fullPlaceActions}>
              <button className={styles.fullPlaceActionBtn} onClick={handleRouteClick}>
                <Navigation size={16} /> Маршрут
              </button>
              <button className={styles.fullPlaceActionBtn} onClick={() => { setFullPlaceOpen(false); setDayPlansOpen(true) }}>
                Day Plans
              </button>
            </div>

            {/* Photos */}
            {selected.photos && selected.photos.length > 0 && (
              <div className={styles.fullPlacePhotos}>
                {selected.photos.map((photo, i) => (
                  <div key={i} className={styles.fullPlacePhotoItem}>
                    <AppImage src={imgSrc(photo)} alt="" fill unoptimized style={{ objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {selected.description && (
              <p className={styles.fullPlaceDesc}>{selected.description}</p>
            )}

            {/* What to See */}
            <h2 className={styles.fullPlaceWtsTitle}>Что посмотреть</h2>
            <div className={styles.fullPlaceWtsChips}>
              {placeTypes.slice(0, 5).map((pt) => (
                <span key={pt.value} className={styles.fullPlaceWtsChip}>
                  {getPinStyle(pt.value).icon} {pt.label}
                </span>
              ))}
            </div>

            {/* Nearby places */}
            {filteredByChip
              .filter((p) => p.id !== selected.id)
              .slice(0, 6)
              .map((np) => (
                <button
                  key={np.id}
                  className={styles.fullPlaceNearby}
                  onClick={() => { setSelectedId(np.id) }}
                >
                  <div className={styles.fullPlaceNearbyThumb}>
                    {np.photos?.[0] && (
                      <AppImage src={imgSrc(np.photos[0])} alt="" fill unoptimized style={{ objectFit: "cover" }} />
                    )}
                  </div>
                  <div>
                    <p className={styles.fullPlaceNearbyTitle}>{np.title}</p>
                    <p className={styles.fullPlaceNearbyDesc}>{np.description?.slice(0, 80)}...</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* ── Bottom sheet: selected place (fallback / Day Plans trigger) ── */}
      {sheetOpen && <div className={styles.sheetBackdrop} onClick={handleCloseSheet} />}
      <div className={`${styles.sheet} ${sheetOpen ? styles.sheetOpen : ""}`}>
        <div className={styles.sheetHandle} />
        {selected && (
          <PlaceSheet
            place={selected}
            interestsMap={interestsMap}
            placeTypes={placeTypes}
            nearbyPlaces={filteredByChip.filter((p) => p.id !== selected.id).slice(0, 6)}
            onClose={handleCloseSheet}
            onRoute={handleRouteClick}
            onPlaceClick={handlePinClick}
          />
        )}
      </div>

      {/* ── Bottom sheet: Day Plans ── */}
      {dayPlansOpen && <div className={styles.sheetBackdrop} onClick={() => setDayPlansOpen(false)} />}
      <div className={`${styles.sheet} ${dayPlansOpen ? styles.sheetOpen : ""}`}>
        <div className={styles.sheetHandle} />
        <DayPlansSheet
          routes={mapRoutes}
          onClose={() => setDayPlansOpen(false)}
        />
      </div>

      {/* ── Bottom bar ── */}
      <BottomBar />
    </div>
  )
}

// ── Day Plans bottom sheet ─────────────────────────────────────────────────────
function DayPlansSheet({
  routes,
  onClose,
}: {
  routes: MapRoute[]
  onClose: () => void
}) {
  return (
    <div className={styles.sheetBody}>
      <div className={styles.sheetHeader}>
        <h2 className={styles.sheetTitle}>Маршруты</h2>
        <button className={styles.sheetClose} onClick={onClose} aria-label="Закрыть">
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      {routes.length === 0 ? (
        <div className={styles.dayPlansEmpty}>
          <p className={styles.dayPlansEmptyText}>Маршрутов пока нет</p>
          <Link href="/route/create" className={styles.dayPlansCreateLink} onClick={onClose}>
            Создать маршрут
          </Link>
        </div>
      ) : (
        <div className={styles.dayPlansScroll}>
          {routes.map((route) => (
            <Link
              key={route.id}
              href={`/route/${route.id}`}
              className={styles.dayPlanCard}
              onClick={onClose}
            >
              <div className={styles.dayPlanCardBg}>
                <div className={styles.dayPlanCardOverlay} />
              </div>
              <div className={styles.dayPlanCardContent}>
                <p className={styles.dayPlanCardTitle}>{route.title}</p>
                <p className={styles.dayPlanCardMeta}>
                  {route.totalDays} {route.totalDays === 1 ? "день" : "дней"}
                  {route.totalExperiences > 0 && ` · ${route.totalExperiences} мест`}
                  {` · ${route.status}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Place bottom sheet ─────────────────────────────────────────────────────────
function PlaceSheet({
  place,
  interestsMap,
  placeTypes,
  nearbyPlaces,
  onClose,
  onRoute,
  onPlaceClick,
}: {
  place: PostResponse
  interestsMap: Record<number, InterestResponse>
  placeTypes: FilterOption[]
  nearbyPlaces: PostResponse[]
  onClose: () => void
  onRoute: () => void
  onPlaceClick: (p: PostResponse) => void
}) {
  const primaryInterest = place.interestIds[0] ? interestsMap[place.interestIds[0]] : null
  const categoryLabel = primaryInterest?.name ?? ""
  const { icon } = getPinStyle(categoryLabel)

  return (
    <div className={styles.sheetBody}>
      {/* Title + close */}
      <div className={styles.sheetHeader}>
        <h2 className={styles.sheetTitle}>{place.title}</h2>
        <button className={styles.sheetClose} onClick={onClose} aria-label="Закрыть">
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Category tags */}
      {place.interestIds.length > 0 && (
        <div className={styles.sheetTags}>
          {place.interestIds.map((id) => {
            const interest = interestsMap[id]
            if (!interest) return null
            const ps = getPinStyle(interest.name)
            return (
              <span key={id} className={styles.sheetTag}>
                <span>{interest.emoji || ps.icon}</span>
                {interest.name}
              </span>
            )
          })}
          {place.city && (
            <span className={styles.sheetTag}>
              <MapPin size={11} />
              {place.city}
            </span>
          )}
        </div>
      )}

      {/* Photo carousel */}
      {place.photos && place.photos.length > 0 ? (
        <div className={styles.sheetPhotos}>
          {place.photos.map((photo, idx) => (
            <div key={idx} className={styles.sheetPhotoItem}>
              <AppImage
                src={imgSrc(photo)}
                alt={place.title}
                fill
                unoptimized
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.sheetPhotos}>
          <div className={styles.sheetPhotoItem}>
            <div className={styles.sheetPhotoFallback}>{icon}</div>
          </div>
        </div>
      )}

      {/* Description */}
      {place.description && (
        <p className={styles.sheetDesc}>{place.description}</p>
      )}

      {/* Route button */}
      <div className={styles.sheetActions}>
        <button className={styles.routeBtn} onClick={onRoute}>
          <Navigation size={16} />
          Маршрут
        </button>
      </div>

      {/* Что посмотреть */}
      {nearbyPlaces.length > 0 && (
        <div className={styles.sheetRelated}>
          <p className={styles.sheetRelatedTitle}>Что посмотреть рядом</p>

          {placeTypes.length > 0 && (
            <div className={styles.sheetRelatedChips}>
              {placeTypes.slice(0, 5).map((pt) => (
                <button key={pt.value} className={styles.sheetRelatedChip}>
                  {getPinStyle(pt.value).icon} {pt.label}
                </button>
              ))}
            </div>
          )}

          <div className={styles.relatedList}>
            {nearbyPlaces.map((np) => {
              const npInterest = np.interestIds[0] ? interestsMap[np.interestIds[0]] : null
              const npPs = getPinStyle(npInterest?.name ?? "")
              return (
                <button
                  key={np.id}
                  className={styles.relatedCard}
                  onClick={() => onPlaceClick(np)}
                >
                  <div className={styles.relatedCardThumb}>
                    {np.photos?.[0] ? (
                      <AppImage
                        src={imgSrc(np.photos[0])}
                        alt={np.title}
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className={styles.sheetPhotoFallback} style={{ fontSize: 22 }}>
                        {npPs.icon}
                      </div>
                    )}
                  </div>
                  <div className={styles.relatedCardInfo}>
                    <p className={styles.relatedCardTitle}>{np.title}</p>
                    {npInterest && (
                      <p className={styles.relatedCardSub}>
                        {npInterest.emoji || npPs.icon} {npInterest.name}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
