"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  useEffect(() => {
    if (auth.isLoggedIn()) {
      router.replace("/")
    } else {
      router.replace("/?login=1")
    }
  }, [router])
  return null
}
