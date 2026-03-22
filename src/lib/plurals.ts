/** Склонение для «N мест(о/а/ )». */
export function ruPlacesCount(n: number): string {
  const abs = Math.abs(n) % 100
  const d = abs % 10
  if (abs > 10 && abs < 20) return `${n} мест`
  if (d === 1) return `${n} место`
  if (d >= 2 && d <= 4) return `${n} места`
  return `${n} мест`
}
