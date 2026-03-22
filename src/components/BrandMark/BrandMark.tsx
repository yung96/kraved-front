import type { CSSProperties } from "react"
import styles from "./BrandMark.module.css"

type BrandMarkProps = {
  className?: string
  style?: CSSProperties
}

export function BrandMark({ className, style }: BrandMarkProps) {
  return (
    <span className={className} style={style}>
      Краевед<span className={styles.dot}>.</span>
    </span>
  )
}
