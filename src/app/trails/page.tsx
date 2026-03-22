"use client"

import BottomBar from "@/components/ui/BottomBar/BottomBar"
import Button from "@/components/ui/Button/Button"
import PageShell from "@/components/ui/PageShell/PageShell"
import TrailMap from "@/components/TrailMap"
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL, TRAILS, type Trail } from "@/lib/trails"
import { Clock, Map, Mountain, Route, X } from "lucide-react"
import { useState } from "react"
import styles from "./trails.module.css"

const SEASONS_MAP: Record<string, string> = {
  spring: "🌸 Весна",
  summer: "☀️ Лето",
  autumn: "🍂 Осень",
  winter: "❄️ Зима",
}

// ─── Trail Card ───────────────────────────────────────────────────────────────

function TrailCard({ trail, active, onSelect }: {
  trail: Trail
  active: boolean
  onSelect: (t: Trail) => void
}) {
  return (
    <button
      className={`${styles.trailCard} ${active ? styles.trailCardActive : ""}`}
      onClick={() => onSelect(trail)}
    >
      <div className={styles.trailCardTop}>
        <div>
          <p className={styles.trailCardName}>{trail.name}</p>
          <p className={styles.trailCardRegion}>{trail.region}</p>
        </div>
        <span
          className={styles.diffBadge}
          style={active ? { background: "rgba(255,255,255,0.2)", color: "#fff" } : undefined}
          data-diff={trail.difficulty}
        >
          {DIFFICULTY_LABEL[trail.difficulty]}
        </span>
      </div>
      <div className={styles.trailCardStats}>
        <span className={styles.trailStat}><Route size={11} /> {trail.distance} км</span>
        <span className={styles.trailStat}><Clock size={11} /> {trail.duration} д.</span>
        <span className={styles.trailStat}>
          <Mountain size={11} />
          {trail.season.length === 4 ? "Весь год" : trail.season.map(s => SEASONS_MAP[s]?.split(" ")[1]).join(", ")}
        </span>
      </div>
    </button>
  )
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function TrailSheet({ trail, onClose }: { trail: Trail; onClose: () => void }) {
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <div>
            <p className={styles.sheetTitle}>{trail.name}</p>
            <p className={styles.sheetRegion}>{trail.region}</p>
          </div>
          <button className={styles.sheetCloseBtn} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className={styles.sheetBody}>
          {/* Stats */}
          <div className={styles.sheetStats}>
            <div className={styles.sheetStat}>
              <Route size={15} color="var(--color-text-secondary)" />
              <span className={styles.sheetStatValue}>{trail.distance} км</span>
              <span className={styles.sheetStatLabel}>Расстояние</span>
            </div>
            <div className={styles.sheetStat}>
              <Clock size={15} color="var(--color-text-secondary)" />
              <span className={styles.sheetStatValue}>{trail.duration} д.</span>
              <span className={styles.sheetStatLabel}>В пути</span>
            </div>
            <div className={styles.sheetStat}>
              <Mountain size={15} color="var(--color-text-secondary)" />
              <span className={styles.sheetStatValue}>{DIFFICULTY_LABEL[trail.difficulty]}</span>
              <span className={styles.sheetStatLabel}>Сложность</span>
            </div>
          </div>

          {/* Description */}
          <p className={styles.sheetDesc}>{trail.description}</p>

          {/* Tags */}
          <div className={styles.sheetTags}>
            {trail.tags.map(tag => (
              <span key={tag} className={styles.sheetTag}>#{tag}</span>
            ))}
          </div>

          {/* Seasons */}
          <div className={styles.sheetSeasons}>
            {["spring", "summer", "autumn", "winter"].map(s => (
              <span
                key={s}
                className={`${styles.sheetSeason} ${trail.season.includes(s) ? styles.sheetSeasonActive : ""}`}
              >
                {SEASONS_MAP[s]}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.sheetFooter}>
          <Button variant="primary" size="lg" style={{ width: "100%" }}>
            Добавить в маршрут →
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrailsPage() {
  const [selected, setSelected] = useState<Trail | null>(null)
  const [view, setView]         = useState<"list" | "map">("list")

  function handleSelect(trail: Trail) {
    setSelected(trail)
    setView("map")
  }

  return (
    <PageShell withBottomBar>
      <div className={styles.page}>

        <header className={styles.header}>
          <h1 className={styles.headerTitle}>Тропы и маршруты</h1>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${view === "list" ? styles.toggleBtnActive : ""}`}
              onClick={() => setView("list")}
            >
              <Route size={13} /> Список
            </button>
            <button
              className={`${styles.toggleBtn} ${view === "map" ? styles.toggleBtnActive : ""}`}
              onClick={() => setView("map")}
            >
              <Map size={13} /> Карта
            </button>
          </div>
        </header>

        {view === "map" ? (
          <div className={styles.mapWrap}>
            <TrailMap trails={TRAILS} selected={selected} onSelect={setSelected} />
          </div>
        ) : (
          <div className={styles.list}>
            <p className={styles.listLabel}>{TRAILS.length} маршрутов · Краснодарский край</p>
            {TRAILS.map(trail => (
              <TrailCard
                key={trail.id}
                trail={trail}
                active={selected?.id === trail.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}

        {selected && <TrailSheet trail={selected} onClose={() => setSelected(null)} />}

      </div>
      <BottomBar />
    </PageShell>
  )
}
