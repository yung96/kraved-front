"use client"

import { BookmarkIcon, HomeIcon, MapIcon, UserIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { href: "/", icon: HomeIcon, label: "Лента" },
  { href: "/route/create", icon: MapIcon, label: "Маршрут" },
  { href: "/saved", icon: BookmarkIcon, label: "Сохранённое" },
  { href: "/profile", icon: UserIcon, label: "Профиль" },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 pb-safe">
      <div className="max-w-md mx-auto flex">
        {items.map(({ href, icon: Icon, label }) => {
          const active = path === href
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-0.5 py-3">
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.5}
                className={active ? "text-zinc-900" : "text-zinc-400"}
              />
              <span className={`text-[10px] font-medium ${active ? "text-zinc-900" : "text-zinc-400"}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
