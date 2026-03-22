"use client"

import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

// Light fade-slide transition — feels native, no visual glitches
const variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

export default function LayoutTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ isolation: "isolate" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
