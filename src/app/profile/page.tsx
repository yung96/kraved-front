"use client"

import { useRouter } from "next/navigation"
import { Loader2, MapPin } from "lucide-react"
import {
  useGetMeQuery,
  useListFavoritesQuery,
  useListMyInterestsQuery,
  useListSubscriptionsQuery,
  useUnsubscribeMutation,
  useListMyRoutesQuery,
} from "@/store/kraevedApi"
import { auth } from "@/lib/auth"
import { imgSrc } from "@/lib/api"
import { BrandMark } from "@/components/BrandMark/BrandMark"
import AppImage from "@/components/ui/AppImage/AppImage"
import BottomBar from "@/components/ui/BottomBar/BottomBar"
import styles from "./profile.module.css"

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function getInitials(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.slice(-2) || "??"
}

export default function ProfilePage() {
  const router = useRouter()
  const isLoggedIn = auth.isLoggedIn()

  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, { skip: !isLoggedIn })
  const { data: myInterests, isLoading: interestsLoading } = useListMyInterestsQuery(undefined, {
    skip: !isLoggedIn,
  })
  const { data: favoritesData, isLoading: favoritesLoading } = useListFavoritesQuery(undefined, {
    skip: !isLoggedIn,
  })
  const { data: routesData, isLoading: routesLoading } = useListMyRoutesQuery(undefined, {
    skip: !isLoggedIn,
  })
  const { data: subscriptionsData, isLoading: subsLoading } = useListSubscriptionsQuery(undefined, {
    skip: !isLoggedIn,
  })
  const [unsubscribe] = useUnsubscribeMutation()

  function handleLogout() {
    auth.clear()
    router.push("/login")
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.guestPage}>
        <div className={styles.guestContent}>
          <h1 className={styles.guestTitle}>Войдите в аккаунт</h1>
          <p className={styles.guestSub}>Сохраняйте места и стройте маршруты</p>
          <button type="button" className={styles.guestBtn} onClick={() => router.push("/login")}>
            Войти
          </button>
        </div>
      </div>
    )
  }

  if (meLoading || !me) {
    return (
      <div className={styles.loadPage}>
        <Loader2 className={styles.loadSpin} size={32} aria-label="Загрузка" />
      </div>
    )
  }

  const favorites = favoritesData?.items ?? []
  const interests = myInterests ?? []
  const subscriptions = subscriptionsData?.items ?? []
  const routes = routesData ?? []

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <BrandMark className={styles.topBarLogo} />
        <span className={styles.topBarTitle}>Профиль</span>
      </header>

      <div className={styles.content}>
        <div className={styles.userCard}>
          <div className={styles.avatarCircle}>
            <span className={styles.avatarInitials}>{getInitials(me.phone)}</span>
          </div>
          <div className={styles.userMeta}>
            <span className={styles.userPhone}>{me.phone}</span>
            <span className={styles.userDate}>Зарегистрирован: {formatDate(me.created_at)}</span>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Мои интересы</h2>
          {interestsLoading ? (
            <p className={styles.emptyText}>Загрузка…</p>
          ) : interests.length > 0 ? (
            <div className={styles.interestChips}>
              {interests.map((interest) => (
                <span key={interest.id} className={styles.chip}>
                  {interest.emoji ? (
                    <span className={styles.chipEmoji}>{interest.emoji}</span>
                  ) : null}
                  {interest.name}
                </span>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>Нет интересов</p>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionRow}>
            <h2 className={styles.sectionTitle}>Избранные места</h2>
            {favorites.length > 0 && <span className={styles.countBadge}>{favorites.length}</span>}
          </div>
          {favoritesLoading ? (
            <p className={styles.emptyText}>Загрузка…</p>
          ) : favorites.length > 0 ? (
            <div className={styles.placesGrid}>
              {favorites.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className={styles.placeCard}
                  onClick={() => router.push(`/place/${place.id}`)}
                >
                  <div className={styles.placePhoto}>
                    {place.photos?.[0] ? (
                      <AppImage
                        src={imgSrc(place.photos[0])}
                        alt={place.title}
                        fill
                        className={styles.placeImg}
                      />
                    ) : (
                      <div className={styles.placePhotoFallback} aria-hidden>
                        <MapPin size={22} color="#858585" />
                      </div>
                    )}
                  </div>
                  <span className={styles.placeTitle}>{place.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>Нет избранных мест</p>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionRow}>
            <h2 className={styles.sectionTitle}>Мои маршруты</h2>
            {routes.length > 0 && <span className={styles.countBadge}>{routes.length}</span>}
          </div>
          {routesLoading ? (
            <p className={styles.emptyText}>Загрузка…</p>
          ) : routes.length > 0 ? (
            <div className={styles.routesList}>
              {routes.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  className={styles.routeCard}
                  onClick={() => router.push(`/route/${route.id}`)}
                >
                  {route.title != null && route.title !== "" ? (
                    <span className={styles.routeTitle}>{route.title}</span>
                  ) : null}
                  <div className={styles.routeMeta}>
                    {route.totalDays != null && (
                      <span className={styles.routeDays}>
                        {route.totalDays}{" "}
                        {route.totalDays === 1 ? "день" : route.totalDays < 5 ? "дня" : "дней"}
                      </span>
                    )}
                    <span className={styles.routeDate}>
                      {route.totalExperiences} мест · {route.status}
                      {route.totalPrice != null ? ` · ${route.totalPrice}` : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>Нет маршрутов</p>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionRow}>
            <h2 className={styles.sectionTitle}>Мои подписки</h2>
            {subscriptions.length > 0 && (
              <span className={styles.countBadge}>{subscriptions.length}</span>
            )}
          </div>
          {subsLoading ? (
            <p className={styles.emptyText}>Загрузка…</p>
          ) : subscriptions.length > 0 ? (
            <div className={styles.subscriptionsList}>
              {subscriptions.map((sub) => (
                <div key={sub.id} className={styles.subscriptionRow}>
                  <span className={styles.subscriptionPhone}>{sub.phone}</span>
                  <button type="button" className={styles.unsubscribeBtn} onClick={() => unsubscribe(sub.id)}>
                    Отписаться
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>Нет подписок</p>
          )}
        </section>

        <div className={styles.actions}>
          <button type="button" className={styles.onboardingBtn} onClick={() => router.push("/onboarding")}>
            Пройти онбординг
          </button>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
