"""
RailFlow AI — Offline simulation mode (dataSource: SIMULATED)

When the live NTES feed is unreachable (no internet / service down) the backend
does not fail: it builds the exact same response schema from the real static
roster (all_real_trains.json) + live Open-Meteo weather, clearly flagged as
SIMULATED. Minute-level seeded noise makes repeated refreshes visibly change,
mirroring NTES's ~10-minute telemetry cadence.
"""

import json
import os
import datetime

import numpy as np

try:
    from backend import eta_model
    from backend.stations_data import STATION_COORDS
    from backend.weather import fetch_live_weather, ist_now
    from backend.rtis_gateway import rtis_gateway
except ImportError:
    import eta_model
    from stations_data import STATION_COORDS
    from weather import fetch_live_weather, ist_now
    try:
        from rtis_gateway import rtis_gateway
    except ImportError:
        rtis_gateway = None

HERE = os.path.dirname(os.path.abspath(__file__))
ROSTER_PATH = os.path.join(HERE, "all_real_trains.json")

_roster_cache = None


def _roster():
    global _roster_cache
    if _roster_cache is None:
        with open(ROSTER_PATH, "r", encoding="utf-8") as f:
            _roster_cache = json.load(f)
    return _roster_cache


def _find_record(number):
    roster = _roster()
    rec = roster.get(number)
    if rec:
        return rec
    for prefix in ("0", "1", "2"):
        rec = roster.get(prefix + number)
        if rec:
            return rec
    if len(str(number)) > 5 or str(number) in ("999999", "000000"):
        return None
    return {
        "number": number,
        "name": f"Express #{number}",
        "from_code": "NDLS",
        "to_code": "BZA",
        "zone": "Indian Railways"
    }


_STATION_POOL = [
    ("NDLS", "New Delhi"), ("CNB", "Kanpur Central"), ("PRYJ", "Prayagraj Jn"),
    ("BSB", "Varanasi Jn"), ("GAYA", "Gaya Jn"), ("PNBE", "Patna Jn"),
    ("HWH", "Howrah Jn"), ("MMCT", "Mumbai Central"), ("BRC", "Vadodara Jn"),
    ("ST", "Surat"), ("ADI", "Ahmedabad Jn"), ("AII", "Ajmer Jn"),
    ("JP", "Jaipur Jn"), ("KOTA", "Kota Jn"), ("BPL", "Bhopal Jn"),
    ("NGP", "Nagpur Jn"), ("BZA", "Vijayawada Jn"), ("RJY", "Rajahmundry Jn"),
    ("TDD", "Tadepalligudem"), ("VSKP", "Visakhapatnam Jn"), ("HYB", "Hyderabad"),
    ("SC", "Secunderabad Jn"), ("MAS", "Chennai Central"), ("SBC", "Bengaluru City"),
    ("PUNE", "Pune Jn"), ("LKO", "Lucknow Jn"), ("AGC", "Agra Cantt"),
    ("GZB", "Ghaziabad"), ("NZM", "Hazrat Nizamuddin"), ("DDU", "DDU Jn"),
    ("AJJ", "Arakkonam"), ("RJY", "Rajahmundry"), ("EE", "Eluru"),
]


def _station_for(coord_key):
    coord = STATION_COORDS.get(coord_key)
    if coord:
        return (coord_key, coord["name"])
    return (coord_key, coord_key)


def _build_timeline(origin, intermediates, dest, base_delay, scheduled_next, dt_txt, rng):
    timeline = []
    stations = [origin] + intermediates + [dest]
    n = len(stations)
    total_km = rng.integers(700, 1900)

    for idx, (code, name) in enumerate(stations):
        std = eta_model.add_minutes_to_time(scheduled_next, idx * rng.integers(15, 45))
        sta = eta_model.format_minutes(eta_model.minutes_of_day(std) - rng.integers(2, 5))
        km = int(total_km * idx / max(1, n - 1))
        halt = 0 if idx in (0, n - 1) else int(rng.integers(2, 15))
        if idx == 0:
            timeline.append({
                "code": code, "name": name, "scheduled": std, "sta": "--", "std": std,
                "actArr": "--", "actDep": std, "etaArr": "--", "etaDep": std,
                "actual": std, "predicted": std, "delayMin": 0, "status": "DEPARTED",
                "platform": 1, "km": km, "haltMins": halt, "day": 1,
            })
        elif idx == 1:
            dyn = eta_model.format_minutes(eta_model.minutes_of_day(sta) + base_delay)
            timeline.append({
                "code": code, "name": name, "scheduled": sta, "sta": sta, "std": std,
                "actArr": "--", "actDep": "--", "etaArr": dyn, "etaDep": dyn,
                "actual": "--", "predicted": dyn, "delayMin": base_delay, "status": "NEXT",
                "platform": int(rng.integers(1, 5)), "km": km, "haltMins": halt,
                "day": 1 if km < total_km * 0.55 else 2,
            })
        else:
            delay = max(0, base_delay - int(rng.integers(0, max(1, int(base_delay * 0.3 + 1))))) if base_delay > 0 else 0
            dyn = eta_model.format_minutes(eta_model.minutes_of_day(sta) + delay)
            timeline.append({
                "code": code, "name": name, "scheduled": sta, "sta": sta, "std": std,
                "actArr": "--", "actDep": "--", "etaArr": dyn, "etaDep": dyn,
                "actual": "--", "predicted": dyn, "delayMin": delay, "status": "UPCOMING",
                "platform": int(rng.integers(1, 5)), "km": km, "haltMins": halt,
                "day": 1 if km < total_km * 0.55 else (2 if km < total_km * 0.9 else 3),
            })
    return timeline


def build_simulated_response(number, journey_date_str=None, is_future_date=False):
    number = str(number)
    rec = _find_record(number)
    if not rec:
        return None

    now = ist_now()
    date_token = "".join(filter(str.isdigit, journey_date_str or now.strftime("%Y-%m-%d")))
    date_int = int(date_token[-6:]) if len(date_token) >= 6 else 20260101
    bucket_seed = int(number) * 1000007 + date_int + (now.minute // 10) * 31 + now.hour * 999
    fine_seed = int(number) * 13 + date_int + now.minute * 7 + now.second // 30

    rng = np.random.default_rng(bucket_seed)
    fine_rng = np.random.default_rng(fine_seed)

    name = rec.get("name") or f"Express {number}"
    is_premium = any(k in name.upper() for k in ("RAJ", "VANDE", "SHATABDI"))
    speed = 124 if is_premium else 98

    # Real weather at the destination corridor
    from_code = (rec.get("from_code") or "NDLS").upper()
    to_code = (rec.get("to_code") or "MMCT").upper()
    coord = STATION_COORDS.get(to_code) or STATION_COORDS.get(from_code)
    weather = {"condition": "Clear Sky", "visibilityKm": 8.0, "temperatureC": 27, "fogImpact": 0, "fogDelayMin": 0, "isFog": False}
    if coord:
        weather.update(fetch_live_weather(coord["lat"], coord["lon"]))

    season_delay = int(weather.get("fogDelayMin", 0))
    base_delay = abs(round(rng.normal(14, 12)) + season_delay + round(fine_rng.uniform(-4, 4)))
    base_delay = max(0, int(round(base_delay)))
    weather_delay = float(season_delay)
    total_delay = base_delay  # persistence baseline

    sched_next = eta_model.format_minutes((19 * 60 + 15 + int(rng.integers(0, 6)) * 7) % (24 * 60))

    origin = _station_for(from_code)
    dest = _station_for(to_code)
    pool = [s for s in _STATION_POOL if s[0] not in (from_code, to_code)]
    indices = rng.choice(len(pool), size=min(9, len(pool)), replace=False)
    intermediates = [pool[int(i)] for i in indices]

    timeline = _build_timeline(origin, intermediates, dest, base_delay, sched_next, journey_date_str or "today", rng)
    total_dist = timeline[-1]["km"] if timeline else 1000

    last_passed_km = timeline[0]["km"]
    remaining_stops = sum(1 for s in timeline if s["status"] in ("NEXT", "UPCOMING"))
    fields = {
        "baseDelayMin": base_delay,
        "currentSpeed": speed,
        "remainingStops": remaining_stops,
        "totalStops": len(timeline),
        "remainingDistanceKm": max(0, total_dist - last_passed_km),
        "weatherDelayMin": weather_delay,
        "isNight": 1 if 0 <= now.hour < 6 or now.hour >= 21 else 0,
        "isPremium": 1 if is_premium else 0,
        "elapsedRatio": min(1.0, max(0.0, last_passed_km / max(1, total_dist))),
    }
    prediction = eta_model.predict_delay(fields)
    use_predicted = prediction["predictedDelayMin"] if prediction["predictedDelayMin"] > 0 else base_delay
    use_predicted = int(round(use_predicted))

    next_stn = timeline[1] if len(timeline) > 1 else timeline[0]
    dyn_eta = next_stn["predicted"]

    origin_name = f"{origin[1]} ({origin[0]})"
    dest_name = f"{dest[1]} ({dest[0]})"

    delay_reasons = []
    if total_delay > 8:
        delay_reasons.append({
            "type": "delay_reason", "severity": "warning",
            "title": f"Why is your train late by ~{total_delay} mins?",
            "plainText": "The delay accumulated on the section ahead due to traffic density and weather. RailFlow's model predicts a gradual recovery over the remaining schedule.",
            "description": f"Next stop {next_stn['name']} expected {dyn_eta}."
        })
    delay_reasons.append({
        "type": "on_time", "severity": "success" if total_delay <= 8 else "warning",
        "title": "AI Recovery Forecast",
        "plainText": f"Prediction engine sees a recovery of about {base_delay - use_predicted} min by the next station.",
        "description": f"Persistence baseline {base_delay} min -> model forecast {use_predicted} min."
    })

    return {
        "success": True,
        "isLiveNTES": False,
        "dataSource": "SIMULATED",
        "isYetToStart": False,
        "journeyDate": journey_date_str or now.strftime("%d-%b-%Y"),
        "number": number,
        "name": name,
        "type": "Rajdhani / Vande Bharat" if is_premium else "Superfast Express",
        "priority": 1 if is_premium else 2,
        "from": origin_name,
        "to": dest_name,
        "zone": rec.get("zone") or "Indian Railways (Offline Roster)",
        "totalDistanceKm": total_dist,
        "scheduledDeparture": timeline[0]["scheduled"] if timeline else "17:00",
        "scheduledArrival": timeline[-1]["scheduled"] if timeline else "08:30",
        "currentSpeed": speed,
        "maxSpeed": 130 if is_premium else 110,
        "baseDelayMin": total_delay,
        "status": "Delayed" if total_delay > 5 else "Running",
        "livePositionSummary": f"Running on corridor (offline simulation, refreshed {now.strftime('%H:%M')})",
        "lastStation": origin[1],
        "originStation": origin[1],
        "nextStation": next_stn["name"],
        "scheduledNextArrival": sched_next,
        "dynamicEta": dyn_eta,
        "expectedRange": eta_model.format_minutes(eta_model.minutes_of_day(dyn_eta) - 3) + " – " + eta_model.format_minutes(eta_model.minutes_of_day(dyn_eta) + 4),
        "assignedPlatform": int(rng.integers(1, 5)),
        "precedingTrainAhead": {
            "name": "Preceding Section Rake", "distanceKm": int(rng.integers(8, 22)), "speedKm": int(rng.integers(42, 62))
        } if total_delay > 8 else None,
        "weather": {**weather, "stationName": coord["name"] if coord else origin[1]},
        "rtisTelemetry": rtis_gateway.get_loco_telemetry(number) if rtis_gateway else {"isRtisActive": False, "telemetryMode": "SIMULATED_OFFLINE"},
        "routeTimeline": timeline,
        "delayReasons": delay_reasons,
        "predictionEngine": {
            **prediction,
            "underlyingData": "SIMULATED",
        },
        "networkTelemetry": {
            "dataSource": "SIMULATED — live NTES feed unreachable, using real static roster + live Open-Meteo weather",
            "timestamp": now.strftime("%H:%M:%S IST"),
            "status": "200 OK — Offline Simulation Active",
        },
    }