"use client";

import { useRef, useState } from 'react';
import styles from './OtpInput.module.css';

/**
 * OtpInput — 4 или 6 цифр
 * @param {number} length — кол-во ячеек (default 4)
 * @param {(code: string) => void} onChange — вызывается при каждом изменении
 */
export default function OtpInput({ length = 4, onChange, error }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const refs = Array.from({ length }, () => useRef(null));

  function handleChange(i, val) {
    if (!/^\d*$/.test(val)) return;
    const next = [...values];
    next[i] = val.slice(-1);
    setValues(next);
    onChange?.(next.join(''));
    if (val && i < length - 1) refs[i + 1].current?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const next = [...values];
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setValues(next);
    onChange?.(next.join(''));
    refs[Math.min(text.length, length - 1)].current?.focus();
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {values.map((v, i) => (
          <input
            key={i}
            ref={refs[i]}
            className={`${styles.box} ${v ? styles.filled : ''} ${error ? styles.boxError : ''}`}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
          />
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
