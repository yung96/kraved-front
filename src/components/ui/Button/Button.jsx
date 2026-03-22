"use client";

import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

/**
 * Button
 * @param {'primary'|'secondary'|'ghost'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {boolean} disabled
 * @param {React.ReactNode} icon  — иконка слева
 * @param {string} className
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  className = '',
  ...props
}) {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    (disabled || loading) ? styles.disabled : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} disabled={disabled || loading} {...props}>
      {loading
        ? <Loader2 size={16} className={styles.spin} />
        : icon && <span className={styles.icon}>{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}
