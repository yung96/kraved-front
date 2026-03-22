import styles from './PageShell.module.css';

/**
 * PageShell — мобильная обёртка для всех страниц
 * Центрирует контент, ограничивает ширину, добавляет отступ снизу для BottomBar
 */
export default function PageShell({ children, withBottomBar = false, className = '' }) {
  return (
    <div className={styles.outer}>
      <div className={`${styles.inner} ${withBottomBar ? styles.withBar : ''} ${className}`}>
        {children}
      </div>
    </div>
  );
}
