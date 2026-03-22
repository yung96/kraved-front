"use client";

import AppImage from '@/components/ui/AppImage/AppImage';
import { useRouter } from 'next/navigation';
import { MapPin, Star, Utensils } from 'lucide-react';
import { imgSrc } from '@/lib/api';
import { motion } from 'framer-motion';
import { BrandMark } from '@/components/BrandMark/BrandMark';
import styles from './PlaceCard.module.css';

const SEASON_LABEL = {
  spring: 'Весна',
  summer: 'Лето',
  autumn: 'Осень',
  winter: 'Зима',
};

const SIZE_CLASSES = [styles.cardSmall, styles.cardMedium, styles.cardLarge];

export default function PlaceCard({ place, interestsMap = {}, index = 0 }) {
  const router = useRouter();

  const photo = place?.photos?.[0];
  const sizeClass = SIZE_CLASSES[index % 3];

  // First interest for category tag
  const firstInterest = place?.interestIds?.[0] != null
    ? interestsMap[place.interestIds[0]]
    : null;

  const seasonLabel = SEASON_LABEL[place?.season] ?? null;

  return (
    <motion.article
      className={`${styles.card} ${sizeClass}`}
      onClick={() => router.push(`/place/${place?.id}`)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Photo */}
      <div className={styles.photoWrap}>
        {photo ? (
          <AppImage
            src={imgSrc(photo)}
            alt={place?.title || ''}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 33vw"
            style={{ objectFit: 'cover' }}
            priority={index < 3}
          />
        ) : (
          <div className={styles.noPhoto}>
            <MapPin size={32} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Rating badge */}
      {place?.averageRating && (
        <div className={styles.ratingBadge}>
          <Star size={14} className={styles.ratingIcon} fill="#f59e0b" />
          {place.averageRating.toFixed(1)}
        </div>
      )}

      {/* Info panel */}
      <div className={styles.info}>
        <h2 className={styles.title}>{place?.title}</h2>

        {place?.description && (
          <p className={styles.description}>{place.description}</p>
        )}

        <div className={styles.tags}>
          {/* Category tag with icon */}
          <div className={`${styles.tag} ${styles.tagWithIcon}`}>
            <div className={styles.tagIcon}>
              {firstInterest?.emoji ? (
                <span style={{ fontSize: 12 }}>{firstInterest.emoji}</span>
              ) : (
                <Utensils className={styles.tagIconInner} />
              )}
            </div>
            <span className={styles.tagText}>
              {firstInterest?.name || 'Место'}
            </span>
            {seasonLabel && (
              <>
                <span className={styles.tagDot} />
                <span className={styles.tagSecondary}>{seasonLabel}</span>
              </>
            )}
          </div>

          {/* Style tag */}
          <div className={styles.tag}>
            <BrandMark className={styles.tagText} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
