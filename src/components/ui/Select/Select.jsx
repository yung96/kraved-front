"use client";

import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

/**
 * Select
 * @param {string} label
 * @param {string} error
 * @param {{ value: string, label: string }[]} options
 */
export default function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className={`${styles.wrap} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={`${styles.row} ${error ? styles.rowError : ''}`}>
        <select className={styles.select} {...props}>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className={styles.arrow} />
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
