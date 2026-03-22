import styles from './SkeletonCard.module.css';

export default function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.photo} />
      <div className={styles.body}>
        <div className={styles.line} style={{ width: '60%', height: 20 }} />
        <div className={styles.line} style={{ width: '100%', height: 13, marginTop: 10 }} />
        <div className={styles.line} style={{ width: '80%',  height: 13, marginTop: 6 }} />
        <div className={styles.line} style={{ width: '50%',  height: 13, marginTop: 6 }} />
        <div className={styles.btn} />
      </div>
    </div>
  );
}
