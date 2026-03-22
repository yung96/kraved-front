# Краевед — Plan

## Источники троп и маршрутов

### Готовые карты с тропами

**Wikiloc**
Самая большая база пользовательских троп в мире. По Краснодарскому краю сотни маршрутов с GPX, фото, высотным профилем. Бесплатно для просмотра.

**AllTrails**
Американская платформа, но по России тоже есть маршруты. Хорошие карточки троп с оценками и фото.

**Nakarte.me**
Российский инструмент. Показывает туристические тропы на базе OpenStreetMap. Можно скачать GPX любого района Краснодарского края бесплатно.

**OpenStreetMap (Overpass API)**
В OSM все пешие тропы уже размечены волонтёрами. По Краснодарскому краю покрытие хорошее — горные маршруты, треккинговые тропы, лесные дорожки.

### MVP стек (реализовано)

```
Overpass API (OSM) → JSON с геометрией троп
     ↓
src/lib/overpass.ts → fetch + parse
     ↓
Leaflet polylines → рендер на карте
     ↓
Карточка тропы (seed data) → distance / difficulty / duration
```

Связка реализуется за 2-3 часа и выглядит убедительно на демо.

---

## Screens (статус)

| Экран          | Статус     |
|----------------|------------|
| Login          | ✅ RTK Query |
| Onboarding     | ✅ Swipe + interests |
| Feed           | ✅ SSR + RTK |
| Place detail   | ✅ Reviews  |
| Route AI       | ✅ Form + narrative |
| Trails / Map   | ✅ Leaflet + Overpass |
| Profile        | ✅          |
| Saved          | ✅ RTK Query |

## API Coverage (RTK Query)

- Auth, Users/Me
- Posts CRUD + Reviews CRUD
- Interests (list / bulk / generate / add to me)
- Achievements
- Friends + Friend Requests
- Favorites (add / remove / list)
- Upload
- Admin dashboard
