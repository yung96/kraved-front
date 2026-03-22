import { NextRequest, NextResponse } from "next/server"

const OWM_KEY = process.env.OPENWEATHERMAP_API_KEY ?? ""

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim()
  if (!city) return NextResponse.json({ error: "city required" }, { status: 400 })
  if (!OWM_KEY) return NextResponse.json({ error: "OPENWEATHERMAP_API_KEY not set" }, { status: 500 })

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather` +
    `?q=${encodeURIComponent(city)},RU` +
    `&appid=${OWM_KEY}&units=metric&lang=ru`,
    { next: { revalidate: 1800 } },
  )

  if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 })

  const d = await res.json()
  return NextResponse.json({
    temp:        Math.round(d.main.temp),
    feels_like:  Math.round(d.main.feels_like),
    description: d.weather[0]?.description ?? "",
    icon:        d.weather[0]?.icon ?? "",
    humidity:    d.main.humidity,
    wind:        Math.round(d.wind?.speed ?? 0),
  })
}
