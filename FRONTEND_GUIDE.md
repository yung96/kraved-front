# Краевед — гайд для фронтенда

Бек: `http://localhost:18000` (dev) или Docker `:18000`
Swagger: `http://localhost:18000/api/docs`

---

## Авторизация

```
POST /api/auth
Body: {"phone": "+79001111111"}
Response: {"access_token": "eyJ..."}
```

Все защищённые ручки — `Authorization: Bearer <token>`

---

## Построение маршрута (главный флоу)

### 1. Получить конфиг фильтров (для UI)

```
GET /api/filters/config
```

Без auth. Возвращает все опции для селектов:
- `groupTypes` — solo, couple, family, friends, elderly, workation
- `transportTypes` — car, public, none
- `budgetLevels` — low, mid, high
- `paceOptions` — relaxed, balanced, intensive
- `interests` — gastro, wine, eco, nature, culture, relax, active, workation
- `seasons` — spring, summer, autumn, winter

### 2. Отправить фильтры → получить routeId

```
POST /api/routes/build
Auth: Bearer
Body: {
  "dateFrom": "2026-04-15",
  "dateTo": "2026-04-17",
  "groupType": "couple",
  "transport": "car",
  "budget": "mid",
  "interests": ["wine", "gastro"],
  "pace": "balanced"
}
Response: {"routeId": 79, "status": "draft"}
```

Бек запускает пайплайн в фоне (7 шагов, ~1-3 сек).

### 3. Поллить статус

```
GET /api/routes/{routeId}/status
Response: {
  "routeId": 79,
  "status": "ready",        // или scoring/flights/distances/enriching/events/weather/narrating
  "title": "Маршрут couple",
  "narrative": "...",
  "totalExperiences": 5
}
```

Фронт дёргает каждые 1-2 секунды, показывает прогресс-бар по статусу.
Статусы по порядку: `draft → scoring → flights → distances → enriching → events → weather → narrating → ready`
Если `stale` — ошибка, показать "Попробуйте ещё раз".

### 4. Забрать готовый маршрут

```
GET /api/routes/{routeId}/full
```

Возвращает всё для рендера страницы:

```json
{
  "id": 79,
  "title": "Маршрут couple",
  "narrative": "Маршрут для couple, 5 точек, 279.6 км...",
  "coverUrl": null,
  "totalDays": null,
  "totalPrice": null,
  "totalPriceStatus": "fresh",
  "totalExperiences": 5,
  "totalHotels": 0,
  "totalTransports": 0,
  "shareToken": null,
  "status": "ready",
  "cityCount": 1,
  "params": {
    "interests": ["wine", "gastro"],
    "weather": {"temperature": 9.7, "weather": "Переменная облачность"},
    "weatherPerDay": [{"date": "2026-04-15", "tempC": 9.7, "weather": "..."}],
    "events": [{"title": "Фестиваль молодого вина", "dateFrom": "2026-04-15"}],
    "offers": [{"title": "Скидка 20% на дегустацию", "discount": 20}],
    "total_km": 279.6
  },
  "segments": [
    {
      "id": 1,
      "title": "Маршрут couple",
      "narrative": null,
      "dateFrom": null,
      "dateTo": null,
      "photos": null,
      "legs": [],
      "transfers": [],
      "stays": [
        {"id": 5, "type": "stay", "details": {"recommendation_type": "stay", "options": [...]}}
      ],
      "carRentals": [],
      "days": []
    }
  ]
}
```

---

## Рендер страницы маршрута

Порядок блоков:

```
1. Шапка (title, счётчики, coverUrl)
2. Полоса городов (segments → title + dateFrom/dateTo)
3. Карта (GET /api/routes/{id}/pins)

for each segment:
  4. Заголовок города (segment.title, segment.narrative)
  5. Перелёты (segment.legs[])
  6. Трансферы (segment.transfers[])
  7. Отели (segment.stays[])
  8. Аренда авто (segment.carRentals[])
  9. Дни (segment.days[])
     → experiences внутри каждого дня (day.experiences[])

10. Футер (totalPrice, кнопки Share/Book)
```

---

## Карточки по типам

### leg (перелёт/переезд)
```
details.from        — "MOW"
details.to          — "KRR"
details.transport   — "plane" / "drive" / "train"
details.duration_min
details.stops       — пересадки
details.departure_at
details.carrier
price               — цена
priceStatus         — fresh/stale/expired
providerUrl         — ссылка на покупку
```

### stay (отель)
```
details.name
details.stars
details.rating
details.review_count
details.source      — "Trip.com" / "agoda"
details.nights
details.photo_url
details.check_in / check_out
price
aiComment           — AI-подсказка
```

### transfer
```
details.from / to
details.duration_min
details.provider
price
```

### car_rental
```
details.model
details.class
details.transmission
details.doors
details.photo_url
price               — за ночь
```

### day
```
details.day_number
details.date
details.title
details.photo_url
details.temp_c
details.weather_icon
experiences[]       — вложенные активности
```

### experience
```
details.name
details.description
details.lat / lng
details.post_id     — клик → /place/{post_id}
details.time
details.duration_min
details.photo_url
details.distance_to_next_km
details.duration_to_next_min
details.transport_to_next
details.recommendation_type  — "food"/"stay"/"fuel" (если рекомендация)
details.options[]            — альтернативы (если рекомендация)
```

---

## Рекомендации (recommendation_type)

Если `details.recommendation_type` есть — это не основная точка, а рекомендация. Рисовать отдельной карточкой:

```json
{
  "recommendation_type": "food",
  "options": [
    {"name": "Кафе Променад", "post_id": 42, "distance_km": 0.8, "type": "Кафе"},
    {"name": "Ресторан Грааль", "post_id": 87, "distance_km": 1.2, "type": "Ресторан"},
    {"name": "Столовая №1", "post_id": 103, "distance_km": 2.1, "type": "Кафе"}
  ]
}
```

Фронт рисует карусель из 2-3 опций, юзер может выбрать.

---

## Карта

```
GET /api/routes/{routeId}/pins
GET /api/routes/{routeId}/pins?zoom_level=6           — обзорные пины (города)
GET /api/routes/{routeId}/pins?segment_id=1&zoom_level=14  — детальные (отели, еда)
```

Каждый пин: `{id, label, pinType, lat, lng, icon, color, position, zoomLevel, isVisible, source, notes}`

Добавить свой пин:
```
PUT /api/routes/{routeId}/pins
Auth: Bearer
Body: {"label": "Мой спот", "pinType": "custom", "lat": 44.5, "lng": 38.1, "notes": "Классный вид"}
```

Удалить свой пин:
```
DELETE /api/routes/{routeId}/pins/{pinId}
Auth: Bearer
```

---

## Действия

### Бронировать
```
POST /api/routes/{routeId}/book
Auth: Bearer
Response: {"bookingId": 1, "status": "pending"}
```

### Поделиться
```
Ссылка: /route/{shareToken}
GET /api/routes/share/{shareToken}  — публичный, без auth, возвращает тот же /full формат
```

### Обновить цены
```
POST /api/routes/{routeId}/refresh-prices
Auth: Bearer
Response: {"status": "refreshing"}
```

---

## Пресеты фильтров

Сохранить набор фильтров:
```
POST /api/filters/presets
Auth: Bearer
Body: {"name": "Вино weekend", "groupType": "couple", "interests": ["wine", "gastro"]}
```

Мои пресеты:
```
GET /api/filters/presets
Auth: Bearer
```

Удалить:
```
DELETE /api/filters/presets/{id}
Auth: Bearer
```

---

## Места (посты)

```
GET /api/posts?page=1&pageSize=20         — лента мест
GET /api/posts/{id}                        — карточка места
POST /api/posts/{id}/reviews               — оставить отзыв
GET /api/posts/{id}/reviews?page=1         — отзывы
```

---

## Погода в params

```json
"weather": {
  "temperature": 9.7,
  "windspeed": 3.8,
  "weather": "Переменная облачность",
  "weathercode": 2
},
"weatherPerDay": [
  {"date": "2026-04-15", "tempC": 9.7, "weather": "Переменная облачность", "icon": 2},
  {"date": "2026-04-16", "tempC": 9.7, "weather": "Переменная облачность", "icon": 2},
  {"date": "2026-04-17", "tempC": 9.7, "weather": "Переменная облачность", "icon": 2}
]
```

Иконки погоды по коду: 0=ясно, 1=преим.ясно, 2=перем.облачность, 3=пасмурно, 51=морось, 61=дождь, 71=снег, 95=гроза.

---

## События и акции в params

```json
"events": [
  {"id": 1, "title": "Фестиваль молодого вина", "description": "...", "dateFrom": "2026-04-15", "dateTo": "2026-04-17"}
],
"offers": [
  {"id": 1, "title": "Скидка 20%", "description": "При бронировании через приложение", "discount": 20}
]
```

Показывать блоком "Что происходит на ваши даты" после дней.
