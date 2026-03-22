"use client"

import { BrandMark } from "@/components/BrandMark/BrandMark"
import { PUBLIC_API_BASE_URL } from "@/lib/api"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"

// ── Step config ────────────────────────────────────────────────────────────────

interface StatusStep {
  status: string
  label: string
}

const STEPS: StatusStep[] = [
  { status: "scoring",   label: "Подбираем места..."          },
  { status: "flights",   label: "Ищем перелёты..."            },
  { status: "distances", label: "Рассчитываем расстояния..."  },
  { status: "enriching", label: "Обогащаем данные..."         },
  { status: "events",    label: "Проверяем события..."        },
  { status: "weather",   label: "Проверяем погоду..."         },
  { status: "narrating", label: "Создаём нарратив..."         },
  { status: "ready",     label: "Готово!"                     },
]

const STATUS_ORDER: string[] = ["draft", "scoring", "flights", "distances", "enriching", "events", "weather", "narrating", "ready"]

function stepIndex(status: string): number {
  return STATUS_ORDER.indexOf(status)
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepCircle({ state }: { state: "pending" | "active" | "done" }) {
  const base: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
  }

  if (state === "done") {
    return (
      <div style={{ ...base, background: "#22EA36" }}>
        <Check size={14} color="#000" strokeWidth={3} />
      </div>
    )
  }

  if (state === "active") {
    return (
      <div style={{ ...base }}>
        {/* pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#22EA36",
          }}
        />
        <div
          style={{
            ...base,
            background: "#22EA36",
            zIndex: 1,
          }}
        />
      </div>
    )
  }

  // pending
  return (
    <div
      style={{
        ...base,
        background: "#E6E6E6",
      }}
    />
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function GeneratingPage() {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<string>("draft")

  useEffect(() => {
    const routeId = localStorage.getItem("route_building_id")

    if (!routeId) {
      // Simulation fallback (demo mode)
      let idx = 0
      const advance = () => {
        if (idx >= STEPS.length) return
        setCurrentStatus(STEPS[idx].status)
        idx++
        if (idx < STEPS.length) {
          setTimeout(advance, 1500)
        } else {
          setTimeout(() => router.push("/route/demo"), 500)
        }
      }
      setTimeout(advance, 600)
      return
    }

    // Real polling
    const token = localStorage.getItem("token")

    const poll = async () => {
      try {
        const res = await fetch(`${PUBLIC_API_BASE_URL}/routes/${routeId}/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error("Failed to fetch status")
        const data = await res.json()
        setCurrentStatus(data.status)

        if (data.status === "ready") {
          setTimeout(() => router.push(`/route/${routeId}`), 800)
          return
        }
        if (data.status === "stale") {
          // Error state - go back
          router.push("/route/create")
          return
        }
        setTimeout(poll, 1500)
      } catch {
        setTimeout(poll, 2000)
      }
    }

    poll()
  }, [router])

  const currentIndex = stepIndex(currentStatus)

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-base, Inter, sans-serif)",
        padding: "32px 24px",
      }}
    >
      {/* Logo */}
      <BrandMark
        style={{
          position: "absolute",
          top: 28,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 20,
          fontWeight: 800,
          color: "#000",
          letterSpacing: "-0.5px",
          userSelect: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        {/* Heading */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#000",
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            Создаём ваш маршрут
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 15,
              color: "#858585",
              margin: "8px 0 0",
            }}
          >
            Это займёт несколько секунд
          </p>
        </div>

        {/* Steps list */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {STEPS.map((step, i) => {
            const stepIdx = stepIndex(step.status)
            const state: "pending" | "active" | "done" =
              stepIdx < currentIndex
                ? "done"
                : stepIdx === currentIndex
                ? "active"
                : "pending"

            const isLast = i === STEPS.length - 1

            return (
              <div key={step.status} style={{ display: "flex", gap: 0 }}>
                {/* Left column: circle + connector */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginRight: 16,
                    flexShrink: 0,
                  }}
                >
                  <StepCircle state={state} />
                  {!isLast && (
                    <motion.div
                      animate={{
                        background:
                          stepIdx < currentIndex
                            ? "#22EA36"
                            : "#E6E6E6",
                      }}
                      transition={{ duration: 0.4 }}
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 28,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <div
                  style={{
                    paddingTop: 4,
                    paddingBottom: isLast ? 0 : 24,
                    flex: 1,
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={state}
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: 1 }}
                      style={{
                        fontSize: 15,
                        fontWeight: state === "active" ? 600 : 400,
                        color:
                          state === "done"
                            ? "#000"
                            : state === "active"
                            ? "#000"
                            : "#858585",
                        lineHeight: 1.4,
                        display: "block",
                      }}
                    >
                      {step.label}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
