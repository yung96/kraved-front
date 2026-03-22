import { NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ""
const BASE_URL           = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"
const MODEL              = process.env.OPENROUTER_MODEL ?? "gpt-4o-mini"

const SYSTEM_PROMPT = `Ты — эксперт по туризму Краснодарского края.
Создай подробный маршрут в формате JSON массива шагов.

Типы шагов:
- "depart": начало поездки. Поля: from, vehicle (car/bus/bike/walk), to, duration ("2ч 30м")
- "transit": перемещение. Поля: from, to, vehicle, duration, distance ("45 км")
- "arrive": прибытие. Поля: title (название места)
- "tour": достопримечательность/активность. Поля: title, description (2-3 предложения), highlights (массив 3-5 строк), duration
- "walk": пешая тропа. Поля: title, description, length ("3.5 км"), duration, difficulty ("easy"|"medium"|"hard")
- "rest": привал/обед. Поля: title, description
- "end": завершение. Поля: title (итог поездки 1-2 предложения)

Правила:
- Минимум 6 шагов, максимум 15
- Начинай с "depart", заканчивай "end"
- Используй реальные места Краснодарского края
- Отвечай ТОЛЬКО валидным JSON массивом. Без markdown, без \`\`\`json, без пояснений.`

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY не настроен" },
      { status: 500 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const prompt = (body.prompt ?? "").trim()

  if (!prompt) {
    return NextResponse.json({ error: "prompt обязателен" }, { status: 400 })
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.75,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text }, { status: res.status })
  }

  const json = await res.json()
  const content: string = json.choices?.[0]?.message?.content ?? ""

  // Strip markdown code fences if model wraps despite instructions
  const cleaned = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()

  try {
    const steps = JSON.parse(cleaned)
    if (!Array.isArray(steps)) throw new Error("not array")
    return NextResponse.json({ steps })
  } catch {
    return NextResponse.json(
      { error: "Не удалось разобрать ответ AI", raw: content },
      { status: 422 },
    )
  }
}
