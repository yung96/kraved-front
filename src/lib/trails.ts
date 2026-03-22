export interface Trail {
  id: number
  name: string
  region: string
  distance: number   // km
  duration: number   // hours
  difficulty: "easy" | "medium" | "hard"
  description: string
  season: string[]
  lat: number
  lng: number
  gpxUrl?: string
  tags: string[]
}

export const TRAILS: Trail[] = [
  {
    id: 1,
    name: "Тридцатка — легендарный маршрут",
    region: "Адыгея / Сочи",
    distance: 70,
    duration: 6,
    difficulty: "hard",
    description: "Классический маршрут через горные перевалы Кавказа. Альпийские луга, водопады, реликтовые леса. Один из самых известных пешеходных маршрутов России.",
    season: ["summer", "autumn"],
    lat: 43.9959,
    lng: 40.2432,
    tags: ["треккинг", "горы", "палатки", "водопады"],
  },
  {
    id: 2,
    name: "Хребет Маркотх",
    region: "Новороссийск — Геленджик",
    distance: 22,
    duration: 8,
    difficulty: "medium",
    description: "Панорамный маршрут над Чёрным морем. С хребта открывается вид на Новороссийскую бухту, Цемесскую долину и Геленджикскую бухту одновременно.",
    season: ["spring", "autumn"],
    lat: 44.6308,
    lng: 37.8442,
    tags: ["панорама", "море", "однодневный"],
  },
  {
    id: 3,
    name: "Водопады Руфабго",
    region: "Адыгея, Хаджох",
    distance: 4,
    duration: 3,
    difficulty: "easy",
    description: "Цепочка из 7 водопадов в живописном ущелье реки Руфабго. Подходит для семей с детьми. Маршрут хорошо обустроен — мостки, лестницы.",
    season: ["spring", "summer", "autumn"],
    lat: 44.2847,
    lng: 40.1581,
    tags: ["водопады", "семья", "дети", "природа"],
  },
  {
    id: 4,
    name: "Гора Фишт",
    region: "Адыгея",
    distance: 34,
    duration: 2,
    difficulty: "hard",
    description: "Восхождение на одну из самых красивых гор Кавказа. Снежники держатся до июля. Маршрут через плато Лагонаки с его уникальной флорой.",
    season: ["summer"],
    lat: 43.9556,
    lng: 40.0817,
    tags: ["восхождение", "снег", "Лагонаки", "эко"],
  },
  {
    id: 5,
    name: "Дольменный маршрут Геленджика",
    region: "Геленджик",
    distance: 8,
    duration: 4,
    difficulty: "easy",
    description: "Загадочные дольмены бронзового века среди леса. Маршрут соединяет несколько групп мегалитов. Отлично для любителей истории и мистики.",
    season: ["spring", "summer", "autumn", "winter"],
    lat: 44.5603,
    lng: 38.0767,
    tags: ["история", "дольмены", "культура", "круглый год"],
  },
  {
    id: 6,
    name: "Лагонакское нагорье",
    region: "Адыгея",
    distance: 15,
    duration: 6,
    difficulty: "medium",
    description: "Плато с альпийскими лугами, карстовыми воронками и пещерами. Весной покрыто ковром диких цветов. ЮНЕСКО-охраняемая территория.",
    season: ["spring", "summer"],
    lat: 44.0814,
    lng: 40.0333,
    tags: ["ЮНЕСКО", "эко", "альпика", "пещеры"],
  },
]

export const DIFFICULTY_LABEL: Record<Trail["difficulty"], string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
}

export const DIFFICULTY_COLOR: Record<Trail["difficulty"], { bg: string; color: string }> = {
  easy:   { bg: "#dcfce7", color: "#15803d" },
  medium: { bg: "#fef9c3", color: "#b45309" },
  hard:   { bg: "#fee2e2", color: "#dc2626" },
}
