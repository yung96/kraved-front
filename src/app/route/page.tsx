"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RoutePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/route/create")
  }, [router])
  return null
}
