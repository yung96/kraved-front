"use client";

import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import styles from './Toast.module.css';

/* ── Context ── */
const ToastCtx = createContext(null);

const ICONS = {
  success: <CheckCircle size={18} />,
  error:   <XCircle    size={18} />,
  info:    <AlertCircle size={18} />,
};

/* ── Provider — оборачивает приложение ── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className={styles.container}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            <span className={styles.icon}>{ICONS[t.type]}</span>
            <span className={styles.msg}>{t.message}</span>
            <button className={styles.close} onClick={() => remove(t.id)} aria-label="Закрыть">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ── Hook ── */
export function useToast() {
  return useContext(ToastCtx);
}
