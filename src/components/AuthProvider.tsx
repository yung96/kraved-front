"use client"

import { createContext, useContext, useState, useCallback } from "react"
import AuthModal from "@/components/AuthModal/AuthModal"

interface AuthContextType {
  openLogin: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType>({
  openLogin: () => {},
  isLoggedIn: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false)
  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("token")

  const openLogin = useCallback(() => setModalOpen(true), [])

  return (
    <AuthContext.Provider value={{ openLogin, isLoggedIn }}>
      {children}
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AuthContext.Provider>
  )
}
