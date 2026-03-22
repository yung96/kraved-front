import { NextRequest, NextResponse } from "next/server"

const RASP_KEY = process.env.YANDEX_RASP_API_KEY ?? ""

// Яндекс.Расписания station codes — Краснодарский край и соседние
const CITY_CODES: Record<string, string> = {
  "краснодар":       "c39",
  "сочи":            "c239",
  "геленджик":       "c21003",
  "анапа":           "c1107",
  "новороссийск":    "c21093",
  "горячий ключ":    "c21041",
  "туапсе":          "c21039",
  "армавир":         "c1338",
  "майкоп":          "c21047",
  "адлер":           "c970",
  "абинск":          "c21053",
  "белореченск":     "c1322",
  "апшеронск":       "c21059",
  "тимашёвск":       "c21067",
  "тимашевск":       "c21067",
  "ейск":            "c21073",
  "лабинск":         "c21079",
  "кропоткин":       "c21083",
  "ростов":          "c39",   // fallback
  "ростов-на-дону":  "c39",
  "москва":          "c213",
  "ставрополь":      "c36",
}

function findCode(name: string): string | null {
  const n = name.toLowerCase().replace(/ё/g, "е").trim()
  if (CITY_CODES[n]) return CITY_CODES[n]
  for (const [key, code] of Object.entries(CITY_CODES)) {
    if (n.includes(key) || key.includes(n)) return code
  }
  return null
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? (m > 0 ? `${h}ч ${m}м` : `${h}ч`) : `${m}м`
}

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from")?.trim() ?? ""
  const to   = req.nextUrl.searchParams.get("to")?.trim()   ?? ""
  const date = req.nextUrl.searchParams.get("date")         ?? new Date().toISOString().slice(0, 10)

  if (!from || !to) return NextResponse.json({ error: "from и to обязательны" }, { status: 400 })
  if (!RASP_KEY)    return NextResponse.json({ error: "YANDEX_RASP_API_KEY not set" }, { status: 500 })

  const fromCode = findCode(from)
  const toCode   = findCode(to)

  if (!fromCode || !toCode) {
    return NextResponse.json({ error: "Город не найден в справочнике", from, to }, { status: 404 })
  }

  const url =
    `https://api.rasp.yandex.net/v3.0/search/` +
    `?from=${fromCode}&to=${toCode}&date=${date}` +
    `&transport_types=bus,suburban,train` +
    `&apikey=${RASP_KEY}&lang=ru_RU&limit=5&format=json`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text }, { status: res.status })
  }

  const data = await res.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segments = (data.segments ?? []).slice(0, 5).map((s: any) => ({
    departure: (s.departure ?? "").slice(11, 16),
    arrival:   (s.arrival   ?? "").slice(11, 16),
    carrier:   s.thread?.short_title ?? s.thread?.title ?? "—",
    transport: s.thread?.transport_type ?? "bus",
    duration:  s.duration ? fmtDuration(s.duration) : "—",
  }))

  return NextResponse.json({ segments, from_name: from, to_name: to })
}
