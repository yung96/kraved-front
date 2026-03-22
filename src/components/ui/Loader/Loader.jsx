import styles from './Loader.module.css';

/**
 * Loader / Spinner
 * @param {'sm'|'md'|'lg'} size
 * @param {'dark'|'light'} color
 */
export default function Loader({ size = 'md', color = 'dark', className = '' }) {
  return (
    <div
      className={[styles.spinner, styles[size], styles[color], className].filter(Boolean).join(' ')}
      role="status"
      aria-label="Загрузка"
    />
  );
}
