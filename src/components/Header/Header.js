"use client";

import { Heart, Plus } from 'lucide-react'
import styles from "./Header.module.css"

const stories = [
  { id: 1, username: "Ваша история", isOwn: true, image: "/stories/user1.jpg" },
  { id: 2, username: "astazia_karina", isOwn: false, image: "/stories/user2.jpg" },
  { id: 3, username: "makkartni_time", isOwn: false, image: "/stories/user3.jpg" },
  { id: 4, username: "kocka_opi", isOwn: false, image: "/stories/user4.jpg" },
  { id: 5, username: "travel_world", isOwn: false, image: "/stories/user5.jpg" },
  { id: 6, username: "photo_daily", isOwn: false, image: "/stories/user6.jpg" },
  { id: 7, username: "photo_daily", isOwn: false, image: "/stories/user6.jpg" },

  { id: 8, username: "photo_daily", isOwn: false, image: "/stories/user6.jpg" },

];

export default function Header() {
  return (
    <header className={styles.header}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.iconButton} aria-label="Создать">
          <Plus />
        </button>

        <h1 className={styles.logo}>...</h1>

        <button className={styles.iconButton} aria-label="Нравится">
          <Heart />
        </button>
      </div>

      {/* Stories */}
      <div className={styles.storiesContainer}>
        <div className={styles.storiesScroll}>
          {stories.map((story) => (
            <div key={story.id} className={styles.storyItem}>
              <div className={`${styles.storyRing} ${story.isOwn ? styles.storyRingOwn : ""}`}>
                <div className={styles.storyImageWrapper}>
                  <div className={styles.storyImagePlaceholder}>
                    {story.isOwn ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" stroke="#888" strokeWidth="1.5"/>
                        <path d="M5 19C5 16.2386 7.23858 14 10 14H14C16.7614 14 19 16.2386 19 19V20H5V19Z" stroke="#888" strokeWidth="1.5"/>
                      </svg>
                    ) : (
                      <span className={styles.storyInitial}>{story.username[0].toUpperCase()}</span>
                    )}
                  </div>
                </div>
                {story.isOwn && (
                  <div className={styles.addStoryBadge}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 2.5V9.5M2.5 6H9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <span className={styles.storyUsername}>{story.username}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
