import AuthProvider from "@/components/AuthProvider"
import StoreProvider from "@/components/StoreProvider"
import LayoutTransition from "@/components/ui/LayoutTransition/LayoutTransition"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Краевед",
  description: "Открывайте нестандартные места Краснодарского края",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>
        <NuqsAdapter>
          <StoreProvider>
            <AuthProvider>
              <LayoutTransition>
                {children}
              </LayoutTransition>
              <Toaster position="top-center" />
            </AuthProvider>
          </StoreProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
