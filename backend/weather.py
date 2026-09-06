"""
RailFlow AI — Live weather ingestion + IST time helpers.

Both main.py and simulator.py depend on these; kept in a standalone module so
there is no circular import.
"""

import datetime
import json
import logging
import os
import urllib.request
from typing import Any, Dict

logger = logging.getLogger("RailFlowAI")

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))


def ist_now() -> datetime.datetime:
    return datetime.datetime.now(IST)


_weather_cache: Dict[str, Any] = {}

def fetch_live_weather(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch live meteorological data from Open-Meteo (official public API) with 5-min caching."""
    cache_key = f"{round(lat, 2)},{round(lon, 2)}"
    now_ts = datetime.datetime.now().timestamp()
    if cache_key in _weather_cache:
        cached_entry, cached_ts = _weather_cache[cache_key]
        if now_ts - cached_ts < 300:
            return cached_entry

    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code,visibility,wind_speed_10m&timezone=auto"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "RailFlowAI-Backend/2.0"})
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode("utf-8"))
            curr = data.get("current", {})
            raw_vis = curr.get("visibility", 10000)
            vis_km = round(raw_vis / 1000, 1)
            temp_c = round(curr.get("temperature_2m", 28))
            code = curr.get("weather_code", 0)

            if code in [45, 48] or vis_km < 2.0:
                cond = "Dense Fog / Low Visibility"
                fog_delay = 14 if vis_km < 1.0 else 8
            elif code in [51, 53, 55, 61, 63, 65, 80, 81]:
                cond = "Monsoon Rain / Wet Rail"
                fog_delay = 4
            elif code in [1, 2, 3]:
                cond = "Partly Cloudy"
                fog_delay = 0
            else:
                cond = "Clear Sky"
                fog_delay = 0

            result = {
                "condition": cond,
                "visibilityKm": vis_km,
                "temperatureC": temp_c,
                "fogImpact": fog_delay,
                "fogDelayMin": fog_delay,
                "isFog": fog_delay > 0,
                "weatherCode": code,
            }
            _weather_cache[cache_key] = (result, now_ts)
            return result
    except Exception as e:
        logger.warning(f"Weather fetch failed: {e}")
        return {
            "condition": "Clear Sky",
            "visibilityKm": 10.0,
            "temperatureC": 28,
            "fogImpact": 0,
            "fogDelayMin": 0,
            "isFog": False,
            "weatherCode": 0,
        }