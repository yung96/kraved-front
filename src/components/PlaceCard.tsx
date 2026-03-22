"use client"

import { BrandMark } from "@/components/BrandMark/BrandMark"
import { imgSrc, type Post } from "@/lib/api"
import { auth } from "@/lib/auth"
import { motion } from "framer-motion"
import { Bookmark, Heart, MapPin, Star, Utensils } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

const SEASON_BADGE: Record<string, string> = {
  spring: "Весна",
  summer: "Лето",
  autumn: "Осень",
  winter: "Зима",
}

export default function PlaceCard({
  place,
  interestsMap = {},
}: {
  place: Post
  interestsMap?: Record<number, { name: string; emoji?: string }>
}) {
  const [liked, setLiked]   = useState(false)
  const [saved, setSaved]   = useState(false)

  const firstInterest = place.interestIds?.[0] != null
    ? interestsMap[place.interestIds[0]]
    : null

  const seasonLabel = SEASON_BADGE[place.season] ?? null

  function handleLike() {
    setLiked(v => !v)
    toast(liked ? "Убрали из понравившихся" : "Добавили в понравившиеся")
  }

  function handleSave() {
    if (!auth.isLoggedIn()) { toast.error("Войдите, чтобы сохранять"); return }
    setSaved(v => !v)
    toast(saved ? "Убрали из сохранённых" : "Сохранено")
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
        marginBottom: 8,
      }}
    >
      {/* Image */}
      <Link
        href={`/place/${place.id}`}
        style={{
          display: "block",
          position: "relative",
          width: "100%",
          aspectRatio: "4/5",
          background: "#F6F6F6",
          overflow: "hidden",
        }}
      >
        <Image
          src={imgSrc(place.photos?.[0])}
          alt={place.title}
          fill
          style={{ objectFit: "cover" }}
          unoptimized
        />
      </Link>

      {/* Rating badge */}
      {place.averageRating && (
        <div style={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 10px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          fontWeight: 600,
          fontSize: 13,
          zIndex: 2,
        }}>
          <Star size={14} fill="#f59e0b" color="#f59e0b" />
          {place.averageRating.toFixed(1)}
        </div>
      )}

      {/* Info panel */}
      <div style={{
        position: "absolute",
        bottom: 8,
        left: 8,
        right: 8,
        background: "#fff",
        borderRadius: 20,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href={`/place/${place.id}`}
            style={{
              fontWeight: 500,
              fontSize: 24,
              letterSpacing: "-0.96px",
              color: "#000",
              textDecoration: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
          >
            {place.title}
          </Link>

          <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 8 }}>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleLike}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}
            >
              <Heart
                size={20}
                color={liked ? "#ef4444" : "#858585"}
                fill={liked ? "#ef4444" : "none"}
                strokeWidth={liked ? 0 : 1.5}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleSave}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}
            >
              <Bookmark
                size={20}
                color={saved ? "#000" : "#858585"}
                fill={saved ? "#000" : "none"}
                strokeWidth={saved ? 0 : 1.5}
              />
            </motion.button>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "8px 12px 8px 8px",
            borderRadius: 16,
            background: "#F6F6F6",
            border: "1px solid #E6E6E6",
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 8,
              background: "#206915",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {firstInterest?.emoji ? (
                <span style={{ fontSize: 12 }}>{firstInterest.emoji}</span>
              ) : (
                <Utensils size={12} color="#fff" />
              )}
            </div>
            <span style={{
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: "-0.24px",
              textTransform: "uppercase" as const,
              color: "#000",
            }}>
              {firstInterest?.name || "Место"}
            </span>
            {seasonLabel && (
              <>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#E6E6E6" }} />
                <span style={{
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: "-0.24px",
                  textTransform: "uppercase" as const,
                  color: "#858585",
                }}>
                  {seasonLabel}
                </span>
              </>
            )}
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "8px 12px",
            borderRadius: 16,
            background: "#F6F6F6",
            border: "1px solid #E6E6E6",
          }}>
            <BrandMark
              style={{
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: "-0.24px",
                textTransform: "uppercase" as const,
                color: "#000",
              }}
            />
          </div>
        </div>
      </div>
    </motion.article>
  )
}
