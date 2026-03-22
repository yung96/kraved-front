"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppImage from "@/components/ui/AppImage/AppImage";
import PageShell from "@/components/ui/PageShell/PageShell";
import BottomBar from "@/components/ui/BottomBar/BottomBar";
import { useListPostsQuery, useListInterestsQuery } from "@/store/kraevedApi";
import { imgSrc } from "@/lib/api";
import { listRoutes } from "@/lib/routeStore";
import styles from "./explore.module.css";

const TIPS = [
  {
    emoji: "🌤",
    title: "Лучшее время",
    desc: "Май–сентябрь: виноград зреет, море тёплое",
  },
  {
    emoji: "🚆",
    title: "Как добраться",
    desc: "Поезд до Краснодара, потом авто или автобус",
  },
  {
    emoji: "🎒",
    title: "Что взять",
    desc: "Удобная обувь, солнцезащитный крем, наличные",
  },
];

export default function ExplorePage() {
  const router = useRouter();
  const [activeInterest, setActiveInterest] = useState(null);
  const [routes, setRoutes] = useState([]);

  const { data: postsData, isLoading: postsLoading } = useListPostsQuery({ page: 1, pageSize: 20 });
  const { data: interestsData, isLoading: interestsLoading } = useListInterestsQuery();

  useEffect(() => {
    setRoutes(listRoutes());
  }, []);

  const allPosts = postsData?.items ?? [];
  const interests = interestsData?.items ?? [];

  const filteredPosts = activeInterest
    ? allPosts.filter((p) =>
        p.interests?.some((i) => i.id === activeInterest)
      )
    : allPosts;

  const placesToShow = filteredPosts.slice(0, 6);

  return (
    <PageShell withBottomBar>
      {/* ── Hero with photo collage ── */}
      <section className={styles.hero}>
        {/* Collage of 3 staggered photos */}
        <div className={styles.collage}>
          {allPosts.slice(0, 3).map((post, i) => (
            <div
              key={post.id}
              className={`${styles.collageCard} ${styles[`collageCard${i}`]}`}
            >
              <AppImage
                src={imgSrc(post.photos?.[0] || post.photo || '')}
                alt={post.title || ''}
                fill
                unoptimized
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))}
          {/* Fallback gradient cards if no posts */}
          {allPosts.length === 0 && [0, 1, 2].map((i) => (
            <div key={i} className={`${styles.collageCard} ${styles.collageCardFallback} ${styles[`collageCard${i}`]}`} />
          ))}
        </div>

        {/* Headline */}
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Открывай лучшее<br />в Краснодарском крае</h1>
          <div className={styles.heroStats}>
            <span>20+ мест</span>
            <span className={styles.heroDot}>·</span>
            <span>AI-маршруты</span>
            <span className={styles.heroDot}>·</span>
            <span>Живые традиции</span>
          </div>
        </div>

        {/* Search bar (decorative) */}
        <div className={styles.heroSearch}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span className={styles.heroSearchPlaceholder}>Поиск мест и маршрутов…</span>
        </div>
      </section>

      {/* ── Category chips ───────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.chipsScroll}>
          <button
            className={`${styles.chip} ${activeInterest === null ? styles.chipActive : ""}`}
            onClick={() => setActiveInterest(null)}
          >
            Все
          </button>
          {!interestsLoading &&
            interests.map((interest) => (
              <button
                key={interest.id}
                className={`${styles.chip} ${activeInterest === interest.id ? styles.chipActive : ""}`}
                onClick={() =>
                  setActiveInterest(activeInterest === interest.id ? null : interest.id)
                }
              >
                {interest.name}
              </button>
            ))}
          {interestsLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.chipSkeleton} />
            ))}
        </div>
      </section>

      {/* ── Hot places ───────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.rowHeader}>
          <span className={styles.rowTitle}>Горячие места</span>
          {placesToShow.length > 0 && (
            <span className={styles.rowBadge}>{placesToShow.length}</span>
          )}
          <button className={styles.seeAll} onClick={() => router.push("/")}>
            Все →
          </button>
        </div>
        <div className={styles.hScroll}>
          {postsLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.placeCardSkeleton} />
            ))}
          {!postsLoading && placesToShow.length === 0 && (
            <p className={styles.emptyNote}>Нет мест по этой теме</p>
          )}
          {!postsLoading &&
            placesToShow.map((post) => (
              <button
                key={post.id}
                className={styles.placeCard}
                onClick={() => router.push(`/place/${post.id}`)}
              >
                <div className={styles.placePhoto}>
                  <AppImage
                    src={imgSrc(post.photo)}
                    alt={post.title ?? ""}
                    fill
                    sizes="140px"
                    className={styles.placeImg}
                  />
                </div>
                <span className={styles.placeName}>{post.title}</span>
              </button>
            ))}
        </div>
      </section>

      {/* ── Day routes ───────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.rowHeader}>
          <span className={styles.rowTitle}>Маршруты дня</span>
          {routes.length > 0 && (
            <span className={styles.rowBadge}>{routes.length}</span>
          )}
          <button className={styles.seeAll} onClick={() => router.push("/route/create")}>
            Все →
          </button>
        </div>
        <div className={styles.hScroll}>
          {routes.length === 0 &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.routeCardSkeleton} />
            ))}
          {routes.map((route) => (
            <button
              key={route.id}
              className={styles.routeCard}
              onClick={() => router.push(`/route/${route.id}`)}
            >
              <div className={styles.routePhoto}>
                {route.places?.[0]?.photo ? (
                  <AppImage
                    src={imgSrc(route.places[0].photo)}
                    alt={route.title}
                    fill
                    sizes="220px"
                    className={styles.routeImg}
                  />
                ) : (
                  <div className={styles.routeImgFallback} />
                )}
              </div>
              <div className={styles.routeBody}>
                <span className={styles.routeTitle}>{route.title}</span>
                <span className={styles.routeMeta}>
                  {route.days} {route.days === 1 ? "день" : route.days < 5 ? "дня" : "дней"} · {route.groupLabel}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Tips ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.rowHeader}>
          <span className={styles.rowTitle}>Советы путешественнику</span>
        </div>
        <div className={styles.hScroll}>
          {TIPS.map((tip) => (
            <div key={tip.title} className={styles.tipCard}>
              <span className={styles.tipEmoji}>{tip.emoji}</span>
              <span className={styles.tipTitle}>{tip.title}</span>
              <span className={styles.tipDesc}>{tip.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.bottomSpacer} />
      <BottomBar />
    </PageShell>
  );
}
