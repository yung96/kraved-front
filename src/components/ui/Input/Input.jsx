"use client";

import styles from './Input.module.css';

/**
 * Input
 * @param {string} label
 * @param {string} error
 * @param {React.ReactNode} prefix  — слева (напр. "+7")
 * @param {React.ReactNode} suffix  — справа (напр. иконка)
 */
export default function Input({
  label,
  error,
  prefix,
  suffix,
  className = '',
  ...props
}) {
  return (
    <div className={`${styles.wrap} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={`${styles.row} ${error ? styles.rowError : ''}`}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <input className={styles.input} {...props} />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
