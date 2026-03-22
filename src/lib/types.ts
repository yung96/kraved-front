// ── Enums ─────────────────────────────────────────────────────────────────────
export type Season = "spring" | "summer" | "autumn" | "winter"
export type FriendRequestStatus = "pending" | "accepted" | "rejected"

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number
  pageSize?: number
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginData {
  phone: string
}

export interface Token {
  access_token: string
  token_type: string
}

// ── Users ─────────────────────────────────────────────────────────────────────
export interface UserData {
  id: number
  phone: string
  created_at: string
}

export interface UserCompactResponse {
  id: number
  phone: string
}

/** GET /users/me/interests — плоский массив из API (без пагинации) */
export interface UserInterestItem {
  id: number
  name: string
  emoji: string | null
  /** Вес для скоринга / ivan-alt */
  weight: number
}

// ── Interests ─────────────────────────────────────────────────────────────────
export interface InterestRequest {
  name: string
  emoji?: string | null
}

export interface InterestResponse {
  id: number
  name: string
  name_en: string
  emoji: string
}

export interface PaginatedInterestsResponse {
  items: InterestResponse[]
  total: number
  page: number
  pageSize: number
}

// ── Achievements ──────────────────────────────────────────────────────────────
export interface AchievementRequest {
  name: string
  description?: string | null
}

export interface AchievementResponse {
  id: number
  name: string
  description: string | null
  createdAt: string
}

export interface PaginatedAchievementsResponse {
  items: AchievementResponse[]
  total: number
  page: number
  pageSize: number
}

// ── Friends ───────────────────────────────────────────────────────────────────
export interface FriendRequestCreateRequest {
  receiverUserId: number
}

export interface FriendRequestResponse {
  id: number
  requesterId: number
  receiverId: number
  status: FriendRequestStatus
  createdAt: string
}

export interface PaginatedFriendRequestsResponse {
  items: FriendRequestResponse[]
  total: number
  page: number
  pageSize: number
}

export interface PaginatedFriendsResponse {
  items: UserCompactResponse[]
  total: number
  page: number
  pageSize: number
}

// ── Posts ─────────────────────────────────────────────────────────────────────
export interface PostResponse {
  id: number
  photos: string[]
  title: string
  description: string | null
  geoLat: number | null
  geoLng: number | null
  interestIds: number[]
  season: Season
  averageRating: number | null
  reviewsCount?: number
  createdAt: string
  updatedAt: string
  city: string | null
}

/** GET /api/user/swipes/next */
export interface SwipeNextResponse {
  done: boolean
  message: string | null
  post: PostResponse | null
}

/** POST /api/user/swipes */
export interface SwipeActionResponse {
  postId: number
  direction: "left" | "right"
  alreadySwiped: boolean
  addedToFavorites: boolean
}

/** POST /api/onboarding/complete */
export interface OnboardingCompleteResponse {
  ok: boolean
  count: number
}

export interface PostListResponse {
  items: PostResponse[]
  total: number
  page: number
  pageSize: number
}

/** Элемент aiRouteMeta.stops из сохранённого ИИ-маршрута */
export interface AiRouteMetaStop {
  postId: number
  caption: string
  highlightedInterestIds?: number[]
}

/** Метаданные ИИ-маршрута (GET /user/routes/{id}) */
export interface AiRouteMeta {
  intro?: string | null
  stops?: AiRouteMetaStop[]
  usedLlm?: boolean
  candidateIds?: number[]
  [key: string]: unknown
}

/** GET /user/routes/{id}, POST /user/routes */
export interface UserSavedRouteResponse {
  id: number
  title: string | null
  startLat: number
  startLng: number
  startLabel: string | null
  postIds: number[]
  posts: PostResponse[]
  aiGenerated: boolean
  aiRouteMeta: AiRouteMeta | null
}

export interface UserSavedRouteListResponse {
  items: UserSavedRouteResponse[]
  total: number
  page: number
  pageSize: number
}

export interface UserSavedRouteCreateRequest {
  title?: string | null
  startLat: number
  startLng: number
  startLabel?: string | null
  postIds: number[]
}

export interface IvanAltInterestWeightItem {
  interestId: number
  weight: number
}

export interface IvanAltLocalRouteGenerateRequest {
  startLat: number
  startLng: number
  startLabel?: string | null
  n: number
  interestWeights: IvanAltInterestWeightItem[]
  bboxDeltaDegrees: number
  save: boolean
  skipLlm?: boolean
}

export interface IvanAltLocalRouteGenerateResponse {
  routeTitle: string | null
  intro: string | null
  candidateIds: number[]
  stops: AiRouteMetaStop[]
  warnings: string[]
  usedLlm: boolean
  savedRouteId?: number
}

/** POST /api/user/posts — URL после POST /api/upload */
export interface PostCreateRequest {
  title: string
  regionId?: number | null
  city?: string | null
  description?: string | null
  geoLat?: number | null
  geoLng?: number | null
  interestIds?: number[]
  season?: Season
  photos?: string[]
}

export interface PostUpdateRequest {
  title?: string | null
  description?: string | null
  geoLat?: number | null
  geoLng?: number | null
  photos?: string[] | null
  interestIds?: number[] | null
  season?: Season | null
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export interface ReviewCreateRequest {
  rating: number // 1–5
  comment?: string | null
  /** Пути с сервера после POST /api/upload (в OpenAPI — mediaUrls) */
  mediaUrls?: string[]
}

export interface ReviewAuthorResponse {
  id: number
  phone: string
}

export interface ReviewResponse {
  id: number
  authorId: number
  postId: number
  rating: number
  comment: string | null
  /** Актуальное поле API */
  mediaUrls?: string[]
  /** Легаси / совместимость */
  photos?: string[]
  createdAt: string
  author: ReviewAuthorResponse
}

export interface ReviewListResponse {
  items: ReviewResponse[]
  total: number
  page: number
  pageSize: number
}

/** GET /api/user/subscriptions/feed (SubscriptionActivityItemResponse) */
export interface SubscriptionFeedItem {
  id: number
  authorId: number
  postId: number
  rating: number
  comment: string | null
  mediaUrls: string[]
  createdAt: string
  author: ReviewAuthorResponse
  postTitle: string
  postCity: string | null
  postRegionId: number | null
  postDescription: string | null
}

export interface SubscriptionFeedResponse {
  items: SubscriptionFeedItem[]
  total: number
  page: number
  pageSize: number
}

// ── Upload ────────────────────────────────────────────────────────────────────
export interface UploadResponse {
  url: string
  filename: string
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface AdminDashboardStats {
  totalPosts: number
  totalInterests: number
  totalUsers: number
}

export interface AdminPostCard {
  id: number
  title: string
  description: string | null
  interestIds: number[]
  season: Season
  createdAt: string
  updatedAt: string
  averageRating: number | null
  geoLat: number | null
  geoLng: number | null
  photos: string[]
  city: string | null
}

export interface AdminPostUpdateRequest {
  title?: string | null
  description?: string | null
  geoLat?: number | null
  geoLng?: number | null
  photos?: string[] | null
  season?: Season | null
  interestIds?: number[] | null
}

export interface AdminInterestCard {
  id: number
  name: string
  emoji: string
}

export interface AdminInterestCreateRequest {
  name: string
  emoji?: string | null
}

export interface AdminInterestUpdateRequest {
  name: string
  emoji?: string | null
}

export interface AdminUserInterest {
  id: number
  name: string
  weight: number
}

export interface AdminUserCard {
  id: number
  phone: string
  createdAt: string
  interests: AdminUserInterest[]
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats
  posts: AdminPostCard[]
  interests: AdminInterestCard[]
  users: AdminUserCard[]
  postsPage: number
  postsPageSize: number
  interestsPage: number
  interestsPageSize: number
  usersPage: number
  usersPageSize: number
}

export interface AdminDashboardParams {
  postsPage?: number
  postsPageSize?: number
  interestsPage?: number
  interestsPageSize?: number
  usersPage?: number
  usersPageSize?: number
}

// ── Filters ──────────────────────────────────────────────────────────────────
export interface FilterOption {
  value: string
  label: string
}

export interface FiltersConfig {
  groupTypes: FilterOption[]
  transportTypes: FilterOption[]
  budgetLevels: FilterOption[]
  paceOptions: FilterOption[]
  interests: FilterOption[]
  seasons: FilterOption[]
  pinTypes: FilterOption[]
  placeTypes: FilterOption[]
}

export interface FilterPreset {
  id: number
  name: string
  config: Record<string, unknown>
  createdAt: string
}

export interface FilterPresetCreate {
  name: string
  config: Record<string, unknown>
}

// ── Generated Route (real API structure) ─────────────────────────────────────

export type RouteStatus = "draft" | "scoring" | "flights" | "distances" | "enriching" | "events" | "weather" | "narrating" | "ready" | "stale"

// Experience (stop/activity within a day)
export interface RouteExperience {
  id: number
  type: "experience"
  details: {
    name: string
    description: string
    lat: number | null
    lng: number | null
    post_id: number | null
    time: string | null
    duration_min: number | null
    photo_url: string | null
    distance_to_next_km: number | null
    duration_to_next_min: number | null
    transport_to_next: string | null
    recommendation_type: "food" | "stay" | "fuel" | null
    options: RouteRecommendationOption[] | null
  }
  price: number | null
  priceStatus: "fresh" | "stale" | "expired" | null
  aiComment: string | null
}

export interface RouteRecommendationOption {
  name: string
  post_id: number | null
  distance_km: number
  type: string
}

// Day within a segment
export interface RouteDay {
  id: number
  type: "day"
  details: {
    day_number: number
    date: string | null
    title: string
    photo_url: string | null
    temp_c: number | null
    weather_icon: number | null
  }
  experiences: RouteExperience[]
}

// Leg (flight/drive/train between cities)
export interface RouteLeg {
  id: number
  type: "leg"
  details: {
    from: string
    to: string
    transport: "plane" | "drive" | "train"
    duration_min: number | null
    stops: number
    departure_at: string | null
    carrier: string | null
  }
  price: number | null
  priceStatus: "fresh" | "stale" | "expired" | null
  providerUrl: string | null
}

// Stay (hotel)
export interface RouteStay {
  id: number
  type: "stay"
  details: {
    name: string
    stars: number | null
    rating: number | null
    review_count: number | null
    source: string | null
    nights: number | null
    photo_url: string | null
    check_in: string | null
    check_out: string | null
    recommendation_type: "stay" | null
    options: RouteRecommendationOption[] | null
  }
  price: number | null
  priceStatus: "fresh" | "stale" | "expired" | null
  aiComment: string | null
}

// Transfer
export interface RouteTransfer {
  id: number
  type: "transfer"
  details: {
    from: string
    to: string
    duration_min: number | null
    provider: string | null
  }
  price: number | null
}

// Car rental
export interface RouteCarRental {
  id: number
  type: "car_rental"
  details: {
    model: string
    class: string | null
    transmission: string | null
    doors: number | null
    photo_url: string | null
  }
  price: number | null
}

// Segment (city section of the route)
export interface RouteSegment {
  id: number
  title: string
  narrative: string | null
  dateFrom: string | null
  dateTo: string | null
  photos: string[] | null
  legs: RouteLeg[]
  transfers: RouteTransfer[]
  stays: RouteStay[]
  carRentals: RouteCarRental[]
  days: RouteDay[]
}

// Weather
export interface RouteWeather {
  temperature: number
  windspeed: number | null
  weather: string
  weathercode: number
}

export interface RouteWeatherPerDay {
  date: string
  tempC: number
  weather: string
  icon: number
}

// Event / Offer
export interface RouteEvent {
  id: number
  title: string
  description: string | null
  dateFrom: string
  dateTo: string | null
}

export interface RouteOffer {
  id: number
  title: string
  description: string | null
  discount: number | null
}

// Route params
export interface RouteParams {
  interests: string[]
  weather: RouteWeather | null
  weatherPerDay: RouteWeatherPerDay[]
  events: RouteEvent[]
  offers: RouteOffer[]
  total_km: number
}

// Map pin
export interface RoutePin {
  id: number
  label: string
  pinType: string
  lat: number
  lng: number
  icon: string | null
  color: string | null
  position: number
  zoomLevel: number
  isVisible: boolean
  source: string | null
  notes: string | null
}

// Route status response (polling)
export interface RouteStatusResponse {
  routeId: number
  status: RouteStatus
  title: string | null
  narrative: string | null
  totalExperiences: number
}

// Build response
export interface RouteBuildResponse {
  routeId: number
  status: RouteStatus
}

// Build request
export interface RouteBuildRequest {
  dateFrom: string
  dateTo: string
  groupType: string
  transport: string
  budget: string
  interests: string[]
  pace: string
}

// Full generated route
export interface GeneratedRoute {
  id: number
  title: string
  narrative: string | null
  coverUrl: string | null
  totalDays: number | null
  totalPrice: number | null
  totalPriceStatus: "fresh" | "stale" | "expired" | null
  totalExperiences: number
  totalHotels: number
  totalTransports: number
  shareToken: string | null
  status: RouteStatus
  cityCount: number
  params: RouteParams
  segments: RouteSegment[]
}

// ── Filter Cities ─────────────────────────────────────────────────────────────
export interface FilterCity {
  id: number
  name: string
  slug: string
  photo: string | null
  centroid: string | null
  population: number | null
  description: string | null
  avgPricePerDay: number | null
  placesCount: number
}

// ── Legacy aliases (for backward compat with existing components) ─────────────
export type Post = PostResponse
export type PostList = PostListResponse
export type Interest = InterestResponse
export type InterestList = PaginatedInterestsResponse
export type Review = ReviewResponse
export type ReviewList = ReviewListResponse
export type User = UserData
