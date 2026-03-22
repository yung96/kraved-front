import styles from './Badge.module.css';

/**
 * Badge / Chip
 * @param {'default'|'season'|'tag'} variant
 * @param {'spring'|'summer'|'autumn'|'winter'} season — только для variant="season"
 */
const SEASONS = {
  spring: { emoji: '🌸', label: 'Весна' },
  summer: { emoji: '☀️', label: 'Лето'  },
  autumn: { emoji: '🍂', label: 'Осень' },
  winter: { emoji: '❄️', label: 'Зима'  },
};

export default function Badge({ variant = 'default', season, children = null, className = '' }) {
  const cls = [styles.badge, styles[variant], season ? styles[season] : '', className]
    .filter(Boolean).join(' ');

  if (variant === 'season' && season) {
    const s = SEASONS[season];
    return (
      <span className={cls}>
        <span>{s.emoji}</span>
        <span>{s.label}</span>
      </span>
    );
  }

  return <span className={cls}>{children}</span>;
}
