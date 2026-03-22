"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  User,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Wine,
  Utensils,
  Sun,
  Leaf,
  Landmark,
  Camera,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark/BrandMark";
import AppImage from "@/components/ui/AppImage/AppImage";
import PlaceCard from "@/components/PlaceCard/PlaceCard";
import { useListPostsQuery, useListInterestsQuery } from "@/store/kraevedApi";
import { listRoutes } from "@/lib/routeStore";
import { imgSrc } from "@/lib/api";
import BottomBar from "@/components/ui/BottomBar/BottomBar";
import styles from "./city.module.css";

// ── Category icon + color mapping ──────────────────────────────────────────

const CATEGORY_MAP = {
  bars:          { color: "#22EA36",  Icon: Wine },
  districts:     { color: "#22EA36",  Icon: Wine },
  restaurants:   { color: "#206915",  Icon: Utensils },
  entertainment: { color: "#F5A623",  Icon: Sun },
  cafes:         { color: "#4CAF50",  Icon: Leaf },
  attractions:   { color: "#9E9E9E",  Icon: Landmark },
  photo:         { color: "#FF5722",  Icon: Camera },
  instaplaces:   { color: "#FF5722",  Icon: Camera },
};

function getCategoryStyle(name = "", emoji) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(k)) return v;
  }
  return { color: "#206915", Icon: Utensils };
}

// ── City description ────────────────────────────────────────────────────────

const CITY_DESC =
  "Красивый южный город с развитой инфраструктурой, мягким климатом и богатой культурой. Отличная гастрономия, парки и современная архитектура.";

// ── Main page ────────────────────────────────────────────────────────────────

export default function CityPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fff" }} />}>
      <CityPageInner />
    </Suspense>
  );
}

function CityPageInner() {
  const searchParams = useSearchParams();
  const cityName = searchParams.get("city") ?? "Краснодар";

  const { data: postsData } = useListPostsQuery({ pageSize: 50 });
  const { data: interestsData } = useListInterestsQuery();

  const allPosts = useMemo(() => postsData?.items ?? [], [postsData]);
  const allInterests = useMemo(
    () => interestsData?.items ?? interestsData?.interests ?? interestsData ?? [],
    [interestsData]
  );

  // Build interestsMap for PlaceCard
  const interestsMap = useMemo(() => {
    const map = {};
    allInterests.forEach((interest) => {
      if (interest?.id != null) map[interest.id] = interest;
    });
    return map;
  }, [allInterests]);

  const [savedRoutes, setSavedRoutes] = useState([]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [activeCategory, setActiveCategory] = useState(null);
  const [routeOffset, setRouteOffset] = useState(0);

  useEffect(() => {
    try {
      setSavedRoutes(listRoutes() ?? []);
    } catch {
      /* noop */
    }
  }, []);

  // Hero background: first post photo
  const heroPhotoUrl = allPosts[0]?.photos?.[0] ?? null;

  // Filter posts by active category
  const filteredPosts = useMemo(() => {
    if (!activeCategory) return allPosts;
    return allPosts.filter((post) => {
      const interestId = post.interestIds?.[0];
      if (interestId == null) return false;
      const interest = interestsMap[interestId];
      return interest?.id === activeCategory;
    });
  }, [allPosts, activeCategory, interestsMap]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  // Routes carousel: show 3 at a time
  const ROUTES_PER_PAGE = 3;
  const maxRouteOffset = Math.max(0, savedRoutes.length - ROUTES_PER_PAGE);

  function prevRoutes() {
    setRouteOffset((prev) => Math.max(0, prev - 1));
  }
  function nextRoutes() {
    setRouteOffset((prev) => Math.min(maxRouteOffset, prev + 1));
  }

  const visibleRoutes = savedRoutes.slice(routeOffset, routeOffset + ROUTES_PER_PAGE);

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <BrandMark className={styles.logo} />
          <button className={styles.citySelect}>
            {cityName}
            <ChevronDown className={styles.cityChevron} />
          </button>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.headerLink}>Что такое hyde.</button>
          <button className={styles.loginBtn}>
            Вход
            <User className={styles.loginIcon} />
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        {/* Background photo */}
        <div className={styles.heroBg}>
          {heroPhotoUrl ? (
            <AppImage
              src={imgSrc(heroPhotoUrl)}
              alt={cityName}
              fill
              unoptimized
              priority
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className={styles.heroBgFallback} />
          )}
          <div className={styles.heroGradient} />
        </div>

        {/* Top row: description card + stat badges */}
        <div className={styles.heroTop}>
          <div className={styles.heroDescCard}>
            <p className={styles.heroDescText}>{CITY_DESC}</p>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.statBadge}>
              <span className={styles.statLabel}>НАСЕЛЕНИЕ</span>
              <span className={styles.statValue}>1&nbsp;348&nbsp;000</span>
            </div>
            <div className={styles.statBadge}>
              <span className={styles.statLabel}>ДЕНЬ ПРОЖИВАНИЯ</span>
              <span className={styles.statValue}>≈&nbsp;3000₽</span>
            </div>
          </div>
        </div>

        {/* Map button (right side) */}
        <button className={styles.mapBtn} onClick={() => window.location.href = `/map?city=${encodeURIComponent(cityName)}`}>
          <ArrowUpRight className={styles.mapBtnIcon} />
          Открыть карту
        </button>

        {/* Bottom: city name + category tabs */}
        <div className={styles.heroBottom}>
          <h1 className={styles.heroTitle}>{cityName}</h1>

          {allInterests.length > 0 && (
            <div className={styles.categoryTabs}>
              <button
                className={`${styles.categoryTab} ${activeCategory === null ? styles.categoryTabActive : ""}`}
                onClick={() => setActiveCategory(null)}
              >
                <span className={styles.categoryDot} style={{ background: "#206915" }} />
                Все
              </button>

              {allInterests.map((interest) => {
                const { color } = getCategoryStyle(interest.name, interest.emoji);
                const isActive = activeCategory === interest.id;
                return (
                  <button
                    key={interest.id ?? interest.name}
                    className={`${styles.categoryTab} ${isActive ? styles.categoryTabActive : ""}`}
                    onClick={() => setActiveCategory(isActive ? null : interest.id)}
                  >
                    <span className={styles.categoryDot} style={{ background: color }} />
                    {interest.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── "Куда сходить?" ──────────────────────────────────────────────── */}
      <section className={styles.placesSection}>
        <div className={styles.placesSectionInner}>
          <h2 className={styles.sectionTitle}>Куда сходить?</h2>

          {visiblePosts.length > 0 ? (
            <div className={styles.masonryGrid}>
              {visiblePosts.map((post, idx) => (
                <PlaceCard
                  key={post.id ?? idx}
                  place={post}
                  interestsMap={interestsMap}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Места загружаются...</p>
            </div>
          )}

          {filteredPosts.length > visibleCount && (
            <div className={styles.loadMoreWrap}>
              <button
                className={styles.loadMoreBtn}
                onClick={() => setVisibleCount((c) => c + 9)}
              >
                Загрузить ещё
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── "Готовые маршруты" ───────────────────────────────────────────── */}
      <section className={styles.routesSection}>
        <div className={styles.routesSectionInner}>
          <div className={styles.routesHeader}>
            <h2 className={styles.sectionTitle}>Готовые маршруты</h2>

            <div className={styles.routesNav}>
              <button
                className={styles.routesNavBtn}
                onClick={prevRoutes}
                disabled={routeOffset === 0}
                aria-label="Предыдущий"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className={styles.routesNavBtn}
                onClick={nextRoutes}
                disabled={routeOffset >= maxRouteOffset}
                aria-label="Следующий"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {savedRoutes.length > 0 ? (
            <div className={styles.routesGrid}>
              {visibleRoutes.map((route, idx) => {
                // Collect up to 3 thumbnail photos from route.places
                const thumbs = (route.places ?? [])
                  .slice(0, 3)
                  .map((p) => p?.photos?.[0] ?? p?.post?.photos?.[0]);

                return (
                  <Link
                    key={route.id ?? idx}
                    href={`/route/${route.id ?? idx}`}
                    className={styles.routeCard}
                    style={{ textDecoration: "none" }}
                  >
                    <div className={styles.routeCardBody}>
                      <h3 className={styles.routeCardTitle}>
                        {route.title ?? "Маршрут"}
                      </h3>
                      {route.narrative && (
                        <p className={styles.routeCardDesc}>{route.narrative}</p>
                      )}
                    </div>

                    {thumbs.length > 0 && (
                      <div className={styles.routeCardThumbs}>
                        {thumbs.map((url, ti) => (
                          <div key={ti} className={styles.routeCardThumb}>
                            <AppImage
                              src={imgSrc(url)}
                              alt=""
                              fill
                              unoptimized
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.routesEmpty}>
              <p className={styles.routesEmptyText}>Сохранённых маршрутов пока нет</p>
              <Link href="/route/create" className={styles.routesEmptyBtn}>
                Построить первый маршрут
              </Link>
            </div>
          )}
        </div>
      </section>

      <BottomBar />
    </div>
  );
}
