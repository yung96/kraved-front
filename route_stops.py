import math
import time
import json
import requests

# ── Конфиг ────────────────────────────────────────────────────────────────────
INTERVAL_KM = 200
RADIUS_M    = 500
DGIS_KEY    = "fddb841f-0ccb-4b48-9bc0-59f3322d911d"
DADATA_KEY  = "352f2e9933aa04f1d5a72b39ce9b6487a4d740db"
USER_PREFS  = ["кафе", "гостиница", "заправка"]

# ── Входные данные ─────────────────────────────────────────────────────────────
# [[lon, lat], [lon, lat], ...]
COORDS = [
    [39.630501, 47.228536],  # Ростов-на-Дону
    [37.793782, 44.681283],  # Краснодар
]

# ── Haversine ──────────────────────────────────────────────────────────────────
def haversine(lat1, lon1, lat2, lon2):
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# ── Нарезка точек каждые INTERVAL_KM ──────────────────────────────────────────
def find_waypoints(coords, interval_km):
    waypoints = []
    accumulated = 0.0
    total_km = 0.0
    prev_lon, prev_lat = coords[0]

    for lon, lat in coords[1:]:
        d = haversine(prev_lat, prev_lon, lat, lon)
        accumulated += d
        total_km += d
        if accumulated >= interval_km:
            waypoints.append({"total_km": round(total_km, 1), "lat": lat, "lon": lon})
            accumulated = 0.0
        prev_lon, prev_lat = lon, lat

    print(f"Маршрут {round(total_km, 1)} км → {len(waypoints)} точек\n")
    return waypoints

# ── 2GIS ───────────────────────────────────────────────────────────────────────
def dgis_search(query, lat, lon, radius_m=RADIUS_M, limit=5):
    try:
        r = requests.get("https://catalog.api.2gis.com/3.0/items", params={
            "q": query, "location": f"{lon},{lat}",
            "radius": radius_m, "sort_by": "distance",
            "page_size": limit, "key": DGIS_KEY, "lang": "ru"
        }, timeout=5)
        items = r.json().get("result", {}).get("items", [])
        return [{"name": i.get("name"), "address": i.get("address_name")} for i in items]
    except Exception:
        return []

# ── Wikipedia ──────────────────────────────────────────────────────────────────
def wikipedia_nearby(lat, lon, radius_m=10000, limit=3):
    try:
        r = requests.get("https://ru.wikipedia.org/w/api.php", params={
            "action": "query", "list": "geosearch",
            "gscoord": f"{lat}|{lon}", "gsradius": radius_m,
            "gslimit": limit, "format": "json"
        }, timeout=5)
        return [a["title"] for a in r.json().get("query", {}).get("geosearch", [])]
    except Exception:
        return []

def wikipedia_summary(title):
    try:
        r = requests.get(
            f"https://ru.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(title)}",
            timeout=5
        )
        if r.status_code != 200:
            return None
        data = r.json()
        return {
            "text":     data.get("extract", "")[:300],
            "photo":    data.get("thumbnail", {}).get("source"),
            "original": data.get("originalimage", {}).get("source"),
        }
    except Exception:
        return None

# ── DaData ─────────────────────────────────────────────────────────────────────
def dadata_address(lat, lon):
    try:
        r = requests.post(
            "https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address",
            json={"lat": lat, "lon": lon, "radius_meters": 1000, "count": 1},
            headers={"Authorization": f"Token {DADATA_KEY}", "Content-Type": "application/json"},
            timeout=5
        )
        suggestions = r.json().get("suggestions", [])
        return suggestions[0]["value"] if suggestions else None
    except Exception:
        return None

# ── Основной цикл ──────────────────────────────────────────────────────────────
def main():
    waypoints = find_waypoints(COORDS, INTERVAL_KM)
    result = []

    for idx, wp in enumerate(waypoints):
        print(f"[{idx + 1}/{len(waypoints)}] км {wp['total_km']}")

        poi = {}
        for pref in USER_PREFS:
            poi[pref] = dgis_search(pref, wp["lat"], wp["lon"])
            time.sleep(0.3)

        address = dadata_address(wp["lat"], wp["lon"])

        titles = wikipedia_nearby(wp["lat"], wp["lon"])
        wikipedia = []
        for title in titles:
            summary = wikipedia_summary(title)
            wikipedia.append({"title": title, **(summary or {})})

        result.append({
            "stop":      idx + 1,
            "km":        wp["total_km"],
            "coords":    [wp["lon"], wp["lat"]],
            "address":   address,
            "poi":       poi,
            "wikipedia": wikipedia,
        })

        time.sleep(0.5)

    print("\n\n══ РЕЗУЛЬТАТ ══════════════════════════════════════════════════════════")
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
