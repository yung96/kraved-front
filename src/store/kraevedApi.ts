import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { PUBLIC_API_BASE_URL } from "@/lib/api"
import { auth } from "@/lib/auth"
import type {
  AdminDashboardParams,
  AdminDashboardResponse,
  AdminInterestCard,
  AdminInterestCreateRequest,
  AdminInterestUpdateRequest,
  AdminPostCard,
  AdminPostUpdateRequest,
  AchievementRequest,
  AchievementResponse,
  FriendRequestCreateRequest,
  FriendRequestResponse,
  InterestRequest,
  InterestResponse,
  LoginData,
  OnboardingCompleteResponse,
  PaginatedAchievementsResponse,
  PaginatedFriendRequestsResponse,
  PaginatedFriendsResponse,
  PaginatedInterestsResponse,
  PaginationParams,
  PostCreateRequest,
  PostListResponse,
  PostResponse,
  PostUpdateRequest,
  ReviewCreateRequest,
  SwipeActionResponse,
  SwipeNextResponse,
  ReviewListResponse,
  ReviewResponse,
  Token,
  UploadResponse,
  UserCompactResponse,
  UserData,
  UserInterestItem,
  FiltersConfig,
  FilterCity,
  FilterPreset,
  FilterPresetCreate,
  SubscriptionFeedResponse,
  UserSavedRouteResponse,
  UserSavedRouteListResponse,
  UserSavedRouteCreateRequest,
  IvanAltLocalRouteGenerateRequest,
  IvanAltLocalRouteGenerateResponse,
} from "@/lib/types"

const BASE = PUBLIC_API_BASE_URL

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

function tokenForAuthorization(): string | null {
  const t = getToken()
  if (!t || t === "undefined" || t === "null") return null
  return t
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE,
  prepareHeaders: (headers, { endpoint }) => {
    // Иначе старый невалидный Bearer на POST /auth даёт 401 → clear() до setToken.
    if (endpoint === "login") return headers
    const token = tokenForAuthorization()
    if (token) headers.set("Authorization", `Bearer ${token}`)
    return headers
  },
})

export const kraevedApi = createApi({
  reducerPath: "kraevedApi",
  baseQuery: async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions)
    const st = result.error && typeof result.error === "object" && "status" in result.error
      ? (result.error as { status: unknown }).status
      : null
    const is401 = st === 401 || st === "401"
    if (
      is401 &&
      typeof window !== "undefined" &&
      tokenForAuthorization() &&
      api.endpoint !== "login"
    ) {
      auth.clear()
      api.dispatch(kraevedApi.util.resetApiState())
    }
    return result
  },
  tagTypes: ["Post", "Review", "Interest", "Achievement", "Friend", "FriendRequest", "Me", "Favorites", "Subscriptions", "Swipes", "UserSavedRoute"],

  endpoints: (b) => ({

    // ── Health ──────────────────────────────────────────────────────────────
    ping: b.query<unknown, void>({
      query: () => "/ping",
    }),
    listCities: b.query<string[], void>({
      query: () => "/cities",
    }),
    listFilterCities: b.query<FilterCity[], void>({
      query: () => "/filters/cities",
    }),

    // ── Auth ────────────────────────────────────────────────────────────────
    login: b.mutation<Token, LoginData>({
      query: (body) => ({ url: "/auth", method: "POST", body }),
    }),

    // ── Users ───────────────────────────────────────────────────────────────
    getMe: b.query<UserData, void>({
      query: () => "/users/me",
      providesTags: ["Me"],
    }),
    listMyInterests: b.query<UserInterestItem[], void>({
      query: () => "/users/me/interests",
      providesTags: ["Me"],
    }),

    // ── Interests ───────────────────────────────────────────────────────────
    listInterests: b.query<PaginatedInterestsResponse, PaginationParams | void>({
      query: (p) => { const { page = 1, pageSize = 100 } = p ?? {}; return `/interests?page=${page}&pageSize=${pageSize}` },
      providesTags: ["Interest"],
    }),
    createInterest: b.mutation<InterestResponse, InterestRequest>({
      query: (body) => ({ url: "/interests", method: "POST", body }),
      invalidatesTags: ["Interest"],
    }),
    deleteInterest: b.mutation<void, number>({
      query: (id) => ({ url: `/interests/${id}`, method: "DELETE" }),
      invalidatesTags: ["Interest"],
    }),
    bulkCreateInterests: b.mutation<PaginatedInterestsResponse, number[]>({
      query: (body) => ({ url: "/interests/bulk_create", method: "POST", body }),
      invalidatesTags: ["Interest"],
    }),
    generateInterests: b.mutation<PaginatedInterestsResponse, string>({
      query: (user_data) => ({
        url: `/interests/generate?user_data=${encodeURIComponent(user_data)}`,
        method: "POST",
      }),
      invalidatesTags: ["Interest"],
    }),
    addInterestToMe: b.mutation<UserCompactResponse, number>({
      query: (id) => ({ url: `/users/me/interests/${id}`, method: "POST" }),
      invalidatesTags: ["Me"],
    }),
    removeInterestFromMe: b.mutation<UserCompactResponse, number>({
      query: (id) => ({ url: `/users/me/interests/${id}`, method: "DELETE" }),
      invalidatesTags: ["Me"],
    }),

    // ── Achievements ─────────────────────────────────────────────────────────
    listAchievements: b.query<PaginatedAchievementsResponse, PaginationParams | void>({
      query: (p) => { const { page = 1, pageSize = 20 } = p ?? {}; return `/achievements?page=${page}&pageSize=${pageSize}` },
      providesTags: ["Achievement"],
    }),
    createAchievement: b.mutation<AchievementResponse, AchievementRequest>({
      query: (body) => ({ url: "/achievements", method: "POST", body }),
      invalidatesTags: ["Achievement"],
    }),
    deleteAchievement: b.mutation<void, number>({
      query: (id) => ({ url: `/achievements/${id}`, method: "DELETE" }),
      invalidatesTags: ["Achievement"],
    }),
    addAchievementToMe: b.mutation<UserCompactResponse, number>({
      query: (id) => ({ url: `/users/me/achievements/${id}`, method: "POST" }),
      invalidatesTags: ["Me"],
    }),
    removeAchievementFromMe: b.mutation<UserCompactResponse, number>({
      query: (id) => ({ url: `/users/me/achievements/${id}`, method: "DELETE" }),
      invalidatesTags: ["Me"],
    }),

    // ── Friends ──────────────────────────────────────────────────────────────
    listFriends: b.query<PaginatedFriendsResponse, PaginationParams | void>({
      query: (p) => { const { page = 1, pageSize = 20 } = p ?? {}; return `/friends?page=${page}&pageSize=${pageSize}` },
      providesTags: ["Friend"],
    }),
    deleteFriend: b.mutation<void, number>({
      query: (id) => ({ url: `/friends/${id}`, method: "DELETE" }),
      invalidatesTags: ["Friend"],
    }),
    sendFriendRequest: b.mutation<FriendRequestResponse, FriendRequestCreateRequest>({
      query: (body) => ({ url: "/friends/requests", method: "POST", body }),
      invalidatesTags: ["FriendRequest"],
    }),
    listIncomingFriendRequests: b.query<PaginatedFriendRequestsResponse, PaginationParams | void>({
      query: (p) => { const { page = 1, pageSize = 20 } = p ?? {}; return `/friends/requests/incoming?page=${page}&pageSize=${pageSize}` },
      providesTags: ["FriendRequest"],
    }),
    acceptFriendRequest: b.mutation<FriendRequestResponse, number>({
      query: (id) => ({ url: `/friends/requests/${id}/accept`, method: "POST" }),
      invalidatesTags: ["FriendRequest", "Friend"],
    }),
    rejectFriendRequest: b.mutation<FriendRequestResponse, number>({
      query: (id) => ({ url: `/friends/requests/${id}/reject`, method: "POST" }),
      invalidatesTags: ["FriendRequest"],
    }),
    cancelFriendRequest: b.mutation<void, number>({
      query: (id) => ({ url: `/friends/requests/${id}`, method: "DELETE" }),
      invalidatesTags: ["FriendRequest"],
    }),

    // ── Posts ────────────────────────────────────────────────────────────────
    listPosts: b.query<PostListResponse, (PaginationParams & { city?: string; search?: string; season?: string; regionId?: number }) | void>({
      query: (p) => {
        const { page = 1, pageSize = 20, city, search, season, regionId } = p ?? {}
        const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
        if (city) q.set("city", city)
        if (search) q.set("search", search)
        if (season) q.set("season", season)
        if (regionId != null) q.set("regionId", String(regionId))
        return `/posts?${q}`
      },
      providesTags: (res) =>
        res
          ? [...res.items.map((p) => ({ type: "Post" as const, id: p.id })), "Post"]
          : ["Post"],
    }),
    getPost: b.query<PostResponse, number>({
      query: (id) => `/posts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Post", id }],
    }),
    createPost: b.mutation<PostResponse, PostCreateRequest>({
      query: (body) => ({ url: "/posts", method: "POST", body }),
      invalidatesTags: ["Post"],
    }),
    updatePost: b.mutation<PostResponse, { id: number; data: PostUpdateRequest }>({
      query: ({ id, data }) => ({ url: `/posts/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Post", id }],
    }),
    deletePost: b.mutation<void, number>({
      query: (id) => ({ url: `/posts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Post"],
    }),
    addInterestToPost: b.mutation<PostResponse, { postId: number; interestId: number }>({
      query: ({ postId, interestId }) => ({
        url: `/posts/${postId}/interests/${interestId}`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: "Post", id: postId }],
    }),
    removeInterestFromPost: b.mutation<PostResponse, { postId: number; interestId: number }>({
      query: ({ postId, interestId }) => ({
        url: `/posts/${postId}/interests/${interestId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: "Post", id: postId }],
    }),

    // ── Reviews ──────────────────────────────────────────────────────────────
    listReviews: b.query<ReviewListResponse, { postId: number } & PaginationParams>({
      query: ({ postId, page = 1, pageSize = 20 }) =>
        `/posts/${postId}/reviews?page=${page}&pageSize=${pageSize}`,
      providesTags: (_r, _e, { postId }) => [{ type: "Review", id: postId }],
    }),
    createReview: b.mutation<ReviewResponse, { postId: number; data: ReviewCreateRequest }>({
      query: ({ postId, data }) => ({
        url: `/posts/${postId}/reviews`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_r, _e, { postId }) => [
        { type: "Review", id: postId },
        { type: "Post", id: postId },
        "Me",
      ],
    }),
    deleteReview: b.mutation<void, number>({
      query: (id) => ({ url: `/reviews/${id}`, method: "DELETE" }),
      invalidatesTags: ["Review"],
    }),

    // ── Upload ───────────────────────────────────────────────────────────────
    uploadImage: b.mutation<UploadResponse, FormData>({
      query: (body) => ({
        url: "/upload",
        method: "POST",
        body,
        // don't set Content-Type — browser sets multipart boundary automatically
        formData: true,
      }),
    }),

    // ── User ─────────────────────────────────────────────────────────────────
    userCreatePost: b.mutation<PostResponse, PostCreateRequest>({
      query: (body) => ({ url: "/user/posts", method: "POST", body }),
      invalidatesTags: ["Post"],
    }),
    listFavorites: b.query<PostListResponse, PaginationParams | void>({
      query: (p) => { const { page = 1, pageSize = 20 } = p ?? {}; return `/user/favorites?page=${page}&pageSize=${pageSize}` },
      providesTags: ["Favorites"],
    }),
    addToFavorites: b.mutation<void, number>({
      query: (id) => ({ url: `/user/favorites/${id}`, method: "POST" }),
      invalidatesTags: ["Favorites", "Me"],
    }),
    removeFromFavorites: b.mutation<void, number>({
      query: (id) => ({ url: `/user/favorites/${id}`, method: "DELETE" }),
      invalidatesTags: ["Favorites"],
    }),
    getUserFeed: b.query<PostListResponse, { page?: number; pageSize?: number } | void>({
      query: (p) => { const { page = 1, pageSize = 20 } = p ?? {}; return `/user/feed?page=${page}&pageSize=${pageSize}` },
      providesTags: ["Post"],
    }),

    getNextSwipeCard: b.query<SwipeNextResponse, void>({
      query: () => "/user/swipes/next",
      providesTags: ["Swipes"],
    }),

    recordSwipe: b.mutation<SwipeActionResponse, { postId: number; direction: "left" | "right" }>({
      query: (body) => ({ url: "/user/swipes", method: "POST", body }),
      // Свайп вправо тянет add_favorite → SocialService.apply_post_engagement_weights (веса интересов в БД)
      invalidatesTags: ["Swipes", "Favorites", "Me"],
    }),

    completeOnboarding: b.mutation<OnboardingCompleteResponse, { interestIds: number[] }>({
      query: (body) => ({ url: "/onboarding/complete", method: "POST", body }),
      invalidatesTags: ["Me", "Interest", "Post"],
    }),

    // ── Admin ────────────────────────────────────────────────────────────────
    getAdminDashboard: b.query<AdminDashboardResponse, AdminDashboardParams | void>({
      query: (p) => {
        const params = p ?? {}
        const q = new URLSearchParams()
        if (params.postsPage)        q.set("postsPage",        String(params.postsPage))
        if (params.postsPageSize)    q.set("postsPageSize",    String(params.postsPageSize))
        if (params.interestsPage)    q.set("interestsPage",    String(params.interestsPage))
        if (params.interestsPageSize)q.set("interestsPageSize",String(params.interestsPageSize))
        if (params.usersPage)        q.set("usersPage",        String(params.usersPage))
        if (params.usersPageSize)    q.set("usersPageSize",    String(params.usersPageSize))
        const qs = q.toString()
        return qs ? `/admin/dashboard?${qs}` : `/admin/dashboard`
      },
    }),
    adminUpdatePost: b.mutation<AdminPostCard, { id: number; data: AdminPostUpdateRequest }>({
      query: ({ id, data }) => ({ url: `/admin/posts/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Post"],
    }),
    adminCreateInterest: b.mutation<AdminInterestCard, AdminInterestCreateRequest>({
      query: (body) => ({ url: "/admin/interests", method: "POST", body }),
      invalidatesTags: ["Interest"],
    }),
    adminUpdateInterest: b.mutation<AdminInterestCard, { id: number; data: AdminInterestUpdateRequest }>({
      query: ({ id, data }) => ({ url: `/admin/interests/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Interest"],
    }),
    adminDeleteInterest: b.mutation<void, number>({
      query: (id) => ({ url: `/admin/interests/${id}`, method: "DELETE" }),
      invalidatesTags: ["Interest"],
    }),

    // ── Filters ───────────────────────────────────────────────────────────────
    getFiltersConfig: b.query<FiltersConfig, void>({
      query: () => "/filters/config",
    }),
    listFilterPresets: b.query<FilterPreset[], void>({
      query: () => "/filters/presets",
    }),
    saveFilterPreset: b.mutation<FilterPreset, FilterPresetCreate>({
      query: (body) => ({ url: "/filters/presets", method: "POST", body }),
    }),
    deleteFilterPreset: b.mutation<void, number>({
      query: (id) => ({ url: `/filters/presets/${id}`, method: "DELETE" }),
    }),

    // ── Routes ────────────────────────────────────────────────────────────────
    buildRoute: b.mutation<{ routeId: number; status: string }, {
      dateFrom: string; dateTo: string; groupType: string; transport: string;
      budget: string; interests: string[]; pace: string;
    }>({
      query: (body) => ({ url: "/routes/build", method: "POST", body }),
    }),
    getRouteStatus: b.query<{
      routeId: number; status: string; title: string | null;
      narrative: string | null; totalExperiences: number;
    }, number>({
      query: (id) => `/routes/${id}/status`,
    }),
    getRouteFull: b.query<any, number>({
      query: (id) => `/routes/${id}/full`,
    }),
    getRoutePins: b.query<any[], { routeId: number; segmentId?: number; zoomLevel?: number }>({
      query: ({ routeId, segmentId, zoomLevel }) => {
        const params = new URLSearchParams()
        if (segmentId != null) params.set("segment_id", String(segmentId))
        if (zoomLevel != null) params.set("zoom_level", String(zoomLevel))
        const qs = params.toString()
        return qs ? `/routes/${routeId}/pins?${qs}` : `/routes/${routeId}/pins`
      },
    }),
    bookRoute: b.mutation<{ bookingId: number; status: string }, number>({
      query: (routeId) => ({ url: `/routes/${routeId}/book`, method: "POST" }),
    }),
    refreshRoutePrices: b.mutation<{ status: string }, number>({
      query: (routeId) => ({ url: `/routes/${routeId}/refresh-prices`, method: "POST" }),
    }),
    getRouteByShareToken: b.query<any, string>({
      query: (token) => `/routes/share/${token}`,
    }),

    // ── Trips (road geometry + schedule) ─────────────────────────────────────
    getTripRoad: b.query<{
      geometry: { type: string; coordinates: [number, number][] };
      distance_km: number;
      duration_min: number;
      waypoints: [number, number][];
      transport: string;
    }, { tripId: number; transport?: string }>({
      query: ({ tripId, transport }) => {
        const params = transport ? `?transport=${transport}` : ""
        return `/trips/${tripId}/road${params}`
      },
    }),
    getTripPlace: b.query<{
      id: number; title: string; description: string | null;
      photos: string[]; city: string | null; region: { id: number; name: string } | string | null;
      lat: number | null; lng: number | null;
      address: string | null; phone: string | null; website: string | null; email: string | null;
      season: string | null; needCar: boolean | null; priceLevel: string | null;
      verified: boolean; durationHours: number | null; bestAngle: string | null;
      rating: { avg: number | null; count: number };
      interests: { id: number; name: string; emoji: string }[];
      schedule: { dayOfWeek: number; open: string; close: string }[];
      reviews: { rating: number; comment: string | null; authorName?: string }[];
      nearby: { id: number; title: string; distanceKm: number; photo: string | null }[];
      events: unknown[];
      offers: unknown[];
    }, number>({
      query: (postId) => `/trips/place/${postId}`,
    }),
    getTripPlaceAi: b.query<{
      postId: number; title: string; recommendation: string;
    }, number>({
      query: (postId) => `/trips/place/${postId}/ai`,
    }),
    getTripSchedule: b.query<{
      tripId: number;
      title: string;
      totalDays: number;
      totalKm: number;
      weather: unknown;
      days: {
        dayNumber: number;
        date: string;
        activitiesCount: number;
        totalDurationMin: number;
        activities: {
          time: string;
          name: string;
          durationMin: number;
          distanceToNextKm: number | null;
          durationToNextMin: number | null;
          aiTip: string | null;
        }[];
        recommendations: {
          type: string;
          options: { name: string; distance_km: number }[];
        }[];
      }[];
    }, number>({
      query: (tripId) => `/trips/${tripId}/schedule`,
    }),

    // ── My Routes ────────────────────────────────────────────────────────────
    listMyRoutes: b.query<
      {
        id: number
        title: string | null
        status: string
        totalDays: number | null
        totalExperiences: number
        totalPrice: number | null
        shareToken: string | null
        createdAt: string | null
      }[],
      void
    >({
      query: () => "/users/me/routes",
      providesTags: ["Me"],
    }),

    listUserSavedRoutes: b.query<UserSavedRouteListResponse, PaginationParams | void>({
      query: (p) => {
        const { page = 1, pageSize = 50 } = p ?? {}
        return `/user/routes?page=${page}&pageSize=${pageSize}`
      },
      providesTags: [{ type: "UserSavedRoute", id: "LIST" }],
    }),
    getUserSavedRoute: b.query<UserSavedRouteResponse, number>({
      query: (id) => `/user/routes/${id}`,
      providesTags: (_r, _e, id) => [{ type: "UserSavedRoute", id }],
    }),
    generateIvanAltRoute: b.mutation<IvanAltLocalRouteGenerateResponse, IvanAltLocalRouteGenerateRequest>({
      query: (body) => ({
        url: "/ivan-alt/local-routes/generate",
        method: "POST",
        body,
      }),
      invalidatesTags: (res) => [
        { type: "UserSavedRoute", id: "LIST" },
        ...(res?.savedRouteId != null
          ? [{ type: "UserSavedRoute" as const, id: res.savedRouteId }]
          : []),
      ],
    }),
    createUserSavedRoute: b.mutation<UserSavedRouteResponse, UserSavedRouteCreateRequest>({
      query: (body) => ({ url: "/user/routes", method: "POST", body }),
      invalidatesTags: (_r) => [
        { type: "UserSavedRoute", id: "LIST" },
        ...( _r ? [{ type: "UserSavedRoute" as const, id: _r.id }] : []),
      ],
    }),

    // ── Subscriptions ─────────────────────────────────────────────────────────
    listSubscriptions: b.query<PaginatedFriendsResponse, PaginationParams | void>({
      query: (p) => { const { page = 1, pageSize = 20 } = p ?? {}; return `/subscriptions?page=${page}&pageSize=${pageSize}` },
      providesTags: ["Subscriptions"],
    }),
    subscribe: b.mutation<void, number>({
      query: (userId) => ({ url: `/subscriptions/${userId}`, method: "POST" }),
      invalidatesTags: ["Subscriptions"],
    }),
    unsubscribe: b.mutation<void, number>({
      query: (userId) => ({ url: `/subscriptions/${userId}`, method: "DELETE" }),
      invalidatesTags: ["Subscriptions"],
    }),
    getUserProfile: b.query<{ id: number; phone: string; createdAt: string; followersCount: number; reviews: any[] }, number>({
      query: (userId) => `/users/${userId}/profile`,
    }),
    getSubscriptionFeed: b.query<SubscriptionFeedResponse, { page?: number; pageSize?: number } | void>({
      query: (p) => { const { page = 1, pageSize = 20 } = p ?? {}; return `/user/subscriptions/feed?page=${page}&pageSize=${pageSize}` },
    }),
  }),
})

// Auto-generated hooks
export const {
  usePingQuery,
  useLoginMutation,
  useGetMeQuery,
  useListMyInterestsQuery,
  useListInterestsQuery,
  useCreateInterestMutation,
  useDeleteInterestMutation,
  useBulkCreateInterestsMutation,
  useGenerateInterestsMutation,
  useAddInterestToMeMutation,
  useRemoveInterestFromMeMutation,
  useListAchievementsQuery,
  useCreateAchievementMutation,
  useDeleteAchievementMutation,
  useAddAchievementToMeMutation,
  useRemoveAchievementFromMeMutation,
  useListFriendsQuery,
  useDeleteFriendMutation,
  useSendFriendRequestMutation,
  useListIncomingFriendRequestsQuery,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useCancelFriendRequestMutation,
  useListPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useAddInterestToPostMutation,
  useRemoveInterestFromPostMutation,
  useListReviewsQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useUploadImageMutation,
  useUserCreatePostMutation,
  useListFavoritesQuery,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  useGetAdminDashboardQuery,
  useAdminUpdatePostMutation,
  useAdminCreateInterestMutation,
  useAdminUpdateInterestMutation,
  useAdminDeleteInterestMutation,
  useListCitiesQuery,
  useListFilterCitiesQuery,
  useGetUserFeedQuery,
  useGetNextSwipeCardQuery,
  useRecordSwipeMutation,
  useCompleteOnboardingMutation,
  useGetFiltersConfigQuery,
  useListFilterPresetsQuery,
  useSaveFilterPresetMutation,
  useDeleteFilterPresetMutation,
  useBuildRouteMutation,
  useGetRouteStatusQuery,
  useGetRouteFullQuery,
  useGetRoutePinsQuery,
  useBookRouteMutation,
  useRefreshRoutePricesMutation,
  useGetRouteByShareTokenQuery,
  useGetTripRoadQuery,
  useGetTripScheduleQuery,
  useGetTripPlaceQuery,
  useGetTripPlaceAiQuery,
  useListSubscriptionsQuery,
  useSubscribeMutation,
  useUnsubscribeMutation,
  useGetUserProfileQuery,
  useGetSubscriptionFeedQuery,
  useListMyRoutesQuery,
  useListUserSavedRoutesQuery,
  useGetUserSavedRouteQuery,
  useGenerateIvanAltRouteMutation,
  useCreateUserSavedRouteMutation,
} = kraevedApi
