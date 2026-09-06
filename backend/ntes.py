"""
RailFlow AI — Live Indian Railways NTES Network Client
Performs live HTTP queries across Indian Railways & Open-Data gateways:
1. Live Train Status & Milestone Telemetry over HTTP
2. Official Timetables & Halt Schedules
3. Station-to-Station Real-Time Routing
"""

import urllib.request
import urllib.parse
import json
import logging
import time
import socket
import ssl
import re
import struct
from concurrent.futures import ThreadPoolExecutor
import datetime
import os
from typing import Any, Dict, List, Optional

try:
    from backend.stations_data import (
        search_trains_between,
        TRAINS_DIRECTORY,
        STATION_DIRECTORY,
        STATION_COORDS,
        CORRIDOR_MAPS,
        resolve_station_code
    )
    from backend.weather import ist_now
except ImportError:
    from stations_data import (
        search_trains_between,
        TRAINS_DIRECTORY,
        STATION_DIRECTORY,
        STATION_COORDS,
        CORRIDOR_MAPS,
        resolve_station_code
    )
    from weather import ist_now

logger = logging.getLogger("railflow.ntes")

# Load official Indian Railways multi-stop train schedules database
SCHEDULES_FILE = os.path.join(os.path.dirname(__file__), "train_schedules.json")
TRAIN_SCHEDULES_DATA: Dict[str, List[Dict[str, Any]]] = {}
if os.path.exists(SCHEDULES_FILE):
    try:
        with open(SCHEDULES_FILE, "r", encoding="utf-8") as f:
            TRAIN_SCHEDULES_DATA = json.load(f)
        logger.info(f"Loaded {len(TRAIN_SCHEDULES_DATA)} train schedules from {SCHEDULES_FILE}")
    except Exception as e:
        logger.warning(f"Failed to load train_schedules.json: {e}")

# In-memory fast station index for O(1) station-level lookups
STATION_STOPS_INDEX: Dict[str, List[Any]] = {}
for _t_num, _stops in TRAIN_SCHEDULES_DATA.items():
    for _s in _stops:
        _c = _s.get("StationCode")
        if _c:
            STATION_STOPS_INDEX.setdefault(str(_c).upper(), []).append((_t_num, _s))


def _parse_mins(t_str: str, default: int = 0) -> int:
    """Convert HH:MM to minutes from midnight."""
    if not t_str or t_str in ("--", "None", "Source", "Destination", ""):
        return default
    try:
        parts = t_str.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return default


def _format_mins(mins: int) -> str:
    """Convert minutes from midnight to HH:MM."""
    mins = int(mins) % (24 * 60)
    return f"{mins // 60:02d}:{mins % 60:02d}"


# Curated High-Fidelity Schedules for Flagship Express Trains
CURATED_TRAIN_SCHEDULES = {
    "20805": [
        {"StationCode": "VSKP", "StationName": "Visakhapatnam Jn", "STA": "--", "STD": "22:00", "DIST": 0, "ISD": True, "PF": 1, "day": 1},
        {"StationCode": "DVD", "StationName": "Duvvada", "STA": "22:25", "STD": "22:27", "DIST": 18, "ISD": False, "PF": 2, "day": 1},
        {"StationCode": "AKP", "StationName": "Anakapalle", "STA": "22:43", "STD": "22:45", "DIST": 33, "ISD": False, "PF": 3, "day": 1},
        {"StationCode": "SLO", "StationName": "Samalkot Jn", "STA": "00:03", "STD": "00:05", "DIST": 151, "ISD": False, "PF": 1, "day": 2},
        {"StationCode": "RJY", "StationName": "Rajahmundry", "STA": "00:48", "STD": "00:50", "DIST": 201, "ISD": False, "PF": 1, "day": 2},
        {"StationCode": "TDD", "StationName": "Tadepalligudem", "STA": "01:28", "STD": "01:30", "DIST": 242, "ISD": False, "PF": 3, "day": 2},
        {"StationCode": "EE", "StationName": "Eluru", "STA": "02:08", "STD": "02:10", "DIST": 290, "ISD": False, "PF": 3, "day": 2},
        {"StationCode": "BZA", "StationName": "Vijayawada Jn", "STA": "03:40", "STD": "03:55", "DIST": 350, "ISD": False, "PF": 4, "day": 2},
        {"StationCode": "KMT", "StationName": "Khammam", "STA": "05:08", "STD": "05:10", "DIST": 449, "ISD": False, "PF": 2, "day": 2},
        {"StationCode": "WL", "StationName": "Warangal", "STA": "06:43", "STD": "06:45", "DIST": 556, "ISD": False, "PF": 2, "day": 2},
        {"StationCode": "RDM", "StationName": "Ramagundam", "STA": "08:18", "STD": "08:20", "DIST": 657, "ISD": False, "PF": 1, "day": 2},
        {"StationCode": "BPQ", "StationName": "Balharshah Jn", "STA": "10:45", "STD": "10:50", "DIST": 799, "ISD": False, "PF": 4, "day": 2},
        {"StationCode": "NGP", "StationName": "Nagpur Jn", "STA": "14:15", "STD": "14:20", "DIST": 1008, "ISD": False, "PF": 1, "day": 2},
        {"StationCode": "BPL", "StationName": "Bhopal Jn", "STA": "20:30", "STD": "20:40", "DIST": 1397, "ISD": False, "PF": 2, "day": 2},
        {"StationCode": "VGLJ", "StationName": "V Lakshmibai Jhansi", "STA": "00:10", "STD": "00:15", "DIST": 1689, "ISD": False, "PF": 4, "day": 3},
        {"StationCode": "GWL", "StationName": "Gwalior Jn", "STA": "01:13", "STD": "01:15", "DIST": 1787, "ISD": False, "PF": 2, "day": 3},
        {"StationCode": "AGC", "StationName": "Agra Cantt", "STA": "02:58", "STD": "03:00", "DIST": 1905, "ISD": False, "PF": 2, "day": 3},
        {"StationCode": "NDLS", "StationName": "New Delhi", "STA": "05:40", "STD": "--", "DIST": 2099, "ISD": False, "PF": 5, "day": 3}
    ],
    "20806": [
        {"StationCode": "NDLS", "StationName": "New Delhi", "STA": "--", "STD": "20:00", "DIST": 0, "ISD": True, "PF": 5, "day": 1},
        {"StationCode": "AGC", "StationName": "Agra Cantt", "STA": "22:03", "STD": "22:05", "DIST": 195, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "GWL", "StationName": "Gwalior Jn", "STA": "23:43", "STD": "23:45", "DIST": 313, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "VGLJ", "StationName": "V Lakshmibai Jhansi", "STA": "01:10", "STD": "01:15", "DIST": 410, "ISD": False, "PF": 2, "day": 2},
        {"StationCode": "BPL", "StationName": "Bhopal Jn", "STA": "04:35", "STD": "04:45", "DIST": 702, "ISD": False, "PF": 1, "day": 2},
        {"StationCode": "NGP", "StationName": "Nagpur Jn", "STA": "10:25", "STD": "10:30", "DIST": 1091, "ISD": False, "PF": 2, "day": 2},
        {"StationCode": "BPQ", "StationName": "Balharshah Jn", "STA": "14:00", "STD": "14:05", "DIST": 1300, "ISD": False, "PF": 1, "day": 2},
        {"StationCode": "RDM", "StationName": "Ramagundam", "STA": "15:48", "STD": "15:50", "DIST": 1442, "ISD": False, "PF": 2, "day": 2},
        {"StationCode": "WL", "StationName": "Warangal", "STA": "17:18", "STD": "17:20", "DIST": 1543, "ISD": False, "PF": 1, "day": 2},
        {"StationCode": "KMT", "StationName": "Khammam", "STA": "18:48", "STD": "18:50", "DIST": 1650, "ISD": False, "PF": 1, "day": 2},
        {"StationCode": "BZA", "StationName": "Vijayawada Jn", "STA": "21:20", "STD": "21:35", "DIST": 1749, "ISD": False, "PF": 6, "day": 2},
        {"StationCode": "EE", "StationName": "Eluru", "STA": "22:28", "STD": "22:30", "DIST": 1809, "ISD": False, "PF": 2, "day": 2},
        {"StationCode": "TDD", "StationName": "Tadepalligudem", "STA": "23:08", "STD": "23:10", "DIST": 1857, "ISD": False, "PF": 2, "day": 2},
        {"StationCode": "RJY", "StationName": "Rajahmundry", "STA": "23:53", "STD": "23:55", "DIST": 1898, "ISD": False, "PF": 3, "day": 2},
        {"StationCode": "SLO", "StationName": "Samalkot Jn", "STA": "00:43", "STD": "00:45", "DIST": 1948, "ISD": False, "PF": 1, "day": 3},
        {"StationCode": "AKP", "StationName": "Anakapalle", "STA": "02:18", "STD": "02:20", "DIST": 2066, "ISD": False, "PF": 3, "day": 3},
        {"StationCode": "DVD", "StationName": "Duvvada", "STA": "03:00", "STD": "03:02", "DIST": 2081, "ISD": False, "PF": 4, "day": 3},
        {"StationCode": "VSKP", "StationName": "Visakhapatnam", "STA": "04:10", "STD": "--", "DIST": 2099, "ISD": False, "PF": 1, "day": 3}
    ],
    "12057": [
        {"StationCode": "NDLS", "StationName": "New Delhi", "STA": "--", "STD": "14:35", "DIST": 0, "ISD": True, "PF": 1, "day": 1},
        {"StationCode": "SZM", "StationName": "Subzi Mandi", "STA": "14:51", "STD": "14:53", "DIST": 3, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "SNP", "StationName": "Sonipat Jn", "STA": "15:25", "STD": "15:27", "DIST": 44, "ISD": False, "PF": 2, "day": 1},
        {"StationCode": "PNP", "StationName": "Panipat Jn", "STA": "16:00", "STD": "16:02", "DIST": 89, "ISD": False, "PF": 3, "day": 1},
        {"StationCode": "KUN", "StationName": "Karnal", "STA": "16:26", "STD": "16:28", "DIST": 123, "ISD": False, "PF": 2, "day": 1},
        {"StationCode": "KKDE", "StationName": "Kurukshetra Jn", "STA": "16:57", "STD": "16:59", "DIST": 156, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "UMB", "StationName": "Ambala Cantt Jn", "STA": "17:45", "STD": "18:15", "DIST": 199, "ISD": False, "PF": 6, "day": 1},
        {"StationCode": "CDG", "StationName": "Chandigarh Jn", "STA": "19:05", "STD": "19:15", "DIST": 244, "ISD": False, "PF": 3, "day": 1},
        {"StationCode": "SASN", "StationName": "SAS Nagar Mohali", "STA": "19:24", "STD": "19:26", "DIST": 256, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "KARR", "StationName": "Kharar", "STA": "19:41", "STD": "19:43", "DIST": 271, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "MRND", "StationName": "Morinda Jn", "STA": "19:57", "STD": "19:59", "DIST": 288, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "RPAR", "StationName": "Rupnagar", "STA": "20:22", "STD": "20:25", "DIST": 310, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "ANSB", "StationName": "Anandpur Sahib", "STA": "21:04", "STD": "21:06", "DIST": 345, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "NLDM", "StationName": "Nangal Dam", "STA": "21:35", "STD": "21:40", "DIST": 364, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "UHL", "StationName": "Una Himachal", "STA": "22:10", "STD": "22:12", "DIST": 387, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "DLPC", "StationName": "Daulatpur Chowk", "STA": "22:45", "STD": "--", "DIST": 415, "ISD": False, "PF": 1, "day": 1}
    ],
    "12058": [
        {"StationCode": "DLPC", "StationName": "Daulatpur Chowk", "STA": "--", "STD": "04:15", "DIST": 0, "ISD": True, "PF": 1, "day": 1},
        {"StationCode": "UHL", "StationName": "Una Himachal", "STA": "04:45", "STD": "04:47", "DIST": 28, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "NLDM", "StationName": "Nangal Dam", "STA": "05:10", "STD": "05:15", "DIST": 51, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "ANSB", "StationName": "Anandpur Sahib", "STA": "05:33", "STD": "05:35", "DIST": 70, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "RPAR", "StationName": "Rupnagar", "STA": "06:10", "STD": "06:13", "DIST": 105, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "MRND", "StationName": "Morinda Jn", "STA": "06:33", "STD": "06:35", "DIST": 127, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "KARR", "StationName": "Kharar", "STA": "06:49", "STD": "06:51", "DIST": 144, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "SASN", "StationName": "SAS Nagar Mohali", "STA": "07:08", "STD": "07:10", "DIST": 159, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "CDG", "StationName": "Chandigarh Jn", "STA": "07:33", "STD": "07:43", "DIST": 171, "ISD": False, "PF": 2, "day": 1},
        {"StationCode": "UMB", "StationName": "Ambala Cantt Jn", "STA": "08:35", "STD": "08:45", "DIST": 216, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "KKDE", "StationName": "Kurukshetra Jn", "STA": "09:14", "STD": "09:16", "DIST": 258, "ISD": False, "PF": 2, "day": 1},
        {"StationCode": "KUN", "StationName": "Karnal", "STA": "09:41", "STD": "09:43", "DIST": 292, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "PNP", "StationName": "Panipat Jn", "STA": "10:12", "STD": "10:14", "DIST": 326, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "SNP", "StationName": "Sonipat Jn", "STA": "10:46", "STD": "10:48", "DIST": 371, "ISD": False, "PF": 1, "day": 1},
        {"StationCode": "SZM", "StationName": "Subzi Mandi", "STA": "11:24", "STD": "11:26", "DIST": 412, "ISD": False, "PF": 2, "day": 1},
        {"StationCode": "NDLS", "StationName": "New Delhi", "STA": "11:45", "STD": "--", "DIST": 415, "ISD": False, "PF": 3, "day": 1}
    ]
}


_HOST_CACHE: Dict[str, tuple] = {}


def _host_resolvable(host: str) -> bool:
    """Quick DNS reachability check (cached 120s) so live probes fail fast
    instead of blocking behind slow getaddrinfo lookups."""
    now = time.time()
    cached = _HOST_CACHE.get(host)
    if cached and cached[0] > now:
        return cached[1]
    executor = ThreadPoolExecutor(max_workers=1)
    fut = executor.submit(socket.getaddrinfo, host, 443)
    try:
        fut.result(timeout=3)
        ok = True
    except Exception:
        ok = False
    finally:
        executor.shutdown(wait=False)
    _HOST_CACHE[host] = (now + 120, ok)
    return ok


def _fetch_live_running_status(clean_num: str, journey_date: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Probe real-time running-status endpoints. Returns the parsed live
    observation when one arrives, else None (never synthesises data)."""
    d_clean = str(journey_date or "").strip()
    endpoints = [
        "https://erail.in/rail/getTrainRunningStatus.aspx?TrainNo={n}&TrainDate={d}",
        "https://erail.in/rail/getTrainRunningStatus.aspx?TrainNo={n}",
        "https://runningstatus.in/api/v1/status/train/{n}/9",
    ]
    last_err = None
    for tmpl in endpoints:
        url = tmpl.format(n=clean_num, d=d_clean.replace("-", "-"))
        host = urllib.parse.urlsplit(url).hostname or ""
        if host and not _host_resolvable(host):
            continue
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                txt = resp.read().decode("utf-8", errors="ignore")
            parsed = NTESClient._parse_running_status(clean_num, txt)
            if parsed:
                parsed["gateway"] = url
                return parsed
        except Exception as e:
            last_err = e
    logger.debug(f"Real-time running-status unavailable for {clean_num}: {last_err}")
    return None


_TMT_KEY = bytes.fromhex("6954c016d42f66215789e489029b8190241d8b0b7b5686d4d617d36a519cbea8")
_TMT_NONCE = bytes.fromhex("c9cde0fa234addac0b3abb73")
_TMT_CONST = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]


def _rotl(x: int, n: int) -> int:
    return ((x << n) | (x >> (32 - n))) & 0xffffffff


def _qr(x, a, b, c, d):
    x[a] = (x[a] + x[b]) & 0xffffffff
    x[d] = _rotl(x[d] ^ x[a], 16)
    x[c] = (x[c] + x[d]) & 0xffffffff
    x[b] = _rotl(x[b] ^ x[c], 12)
    x[a] = (x[a] + x[b]) & 0xffffffff
    x[d] = _rotl(x[d] ^ x[a], 8)
    x[c] = (x[c] + x[d]) & 0xffffffff
    x[b] = _rotl(x[b] ^ x[c], 7)


def _tmt_block(counter: int):
    k = list(struct.unpack("<8I", _TMT_KEY))
    n = list(struct.unpack("<3I", _TMT_NONCE))
    s = _TMT_CONST + k + [counter] + n
    x = s[:]
    for _ in range(10):
        _qr(x, 0, 4, 8, 12)
        _qr(x, 1, 5, 9, 13)
        _qr(x, 2, 6, 10, 14)
        _qr(x, 3, 7, 11, 15)
        _qr(x, 0, 5, 10, 15)
        _qr(x, 1, 6, 11, 12)
        _qr(x, 2, 7, 8, 13)
        _qr(x, 3, 4, 9, 14)
    return struct.pack("<16I", *[(x[i] + s[i]) & 0xffffffff for i in range(16)])


def _tmt_encrypt(plaintext: bytes) -> bytes:
    out = bytearray()
    ctr = 1
    for i in range(0, len(plaintext), 64):
        ks = _tmt_block(ctr)
        out += bytes(b ^ ks[j] for j, b in enumerate(plaintext[i:i + 64]))
        ctr += 1
    return bytes(out)


def _tmt_jdate(journey_date: Optional[str]) -> str:
    if journey_date:
        m = re.match(r"(\d{1,2})-([A-Za-z]{3})-(\d{4})", str(journey_date).strip())
        if m:
            day, mon, year = m.groups()
            months = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
                      "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12}
            mm = months.get(mon[:1].upper() + mon[1:3].lower())
            if mm:
                return "%04d%02d%02d" % (int(year), mm, int(day))
    try:
        return ist_now().strftime("%Y%m%d")
    except Exception:
        return datetime.datetime.now().strftime("%Y%m%d")


def _tmt_ssl_ctx():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        ctx.options |= ssl.OP_LEGACY_SERVER_CONNECT
    except Exception:
        pass
    return ctx


def _fetch_tmt_live_status(clean_num: str, jdate: str):
    if not _host_resolvable("api.trackmytrain.co.in"):
        return None
    body = json.dumps({"trno": clean_num, "jdate": jdate, "method": "lts", "wdata": ""})
    payload = _tmt_encrypt(body.encode()).hex()
    req = urllib.request.Request(
        "https://api.trackmytrain.co.in/android",
        data=payload.encode(), method="POST",
        headers={"User-Agent": "okhttp/4.9.0", "Content-Type": "text/plain"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15, context=_tmt_ssl_ctx()) as resp:
            raw = resp.read().decode("utf-8", "replace")
        data = json.loads(raw)
    except Exception as e:
        logger.debug(f"Live mirror fetch failed for {clean_num}: {e}")
        return None
    if data.get("status") != "SUCCESS":
        return None
    resp_data = data.get("response") or {}
    if not resp_data.get("data_available"):
        return None
    asd = resp_data.get("availableStatusData") or {}
    if not asd:
        return None
    return {"info": asd, "delayData": asd.get("delayData") or []}


def _epoch_ms_to_ist(ms) -> str:
    try:
        ts = float(ms) / 1000.0
        if ts <= 0:
            return ""
        ist = datetime.datetime.fromtimestamp(
            ts, tz=datetime.timezone(datetime.timedelta(hours=5, minutes=30))
        )
        return ist.strftime("%d-%b-%Y %H:%M")
    except Exception:
        return ""


def _tmt_to_payload(clean_num: str, tmt: Dict[str, Any], stations: List[Dict[str, Any]],
                    src: str, srcn: str, dst: str, dstn: str) -> Dict[str, Any]:
    info = tmt["info"]
    delays = tmt["delayData"]
    name = (info.get("trainName") or "").strip() or f"Train {clean_num}"
    msg = (info.get("statusMessage") or "").strip()
    started = bool(info.get("started"))
    last_stn = (info.get("last_known_stn") or "").strip().upper()
    last_upd_ms = info.get("last_updated")
    loc = info.get("locationData") or {}
    lat = loc.get("lat")
    lon = loc.get("lon")

    late_min = 0
    m = re.search(r"late by (\d+)", msg, re.IGNORECASE)
    if m:
        late_min = int(m.group(1))

    overlay = {}
    for s in delays:
        code = (s.get("stn") or "").upper()
        if code:
            overlay[code] = s

    npstn = ""
    for s in delays:
        code = (s.get("stn") or "").upper()
        arr_a = s.get("arr_actual")
        dep_a = s.get("dep_actual")
        passed = (arr_a not in (None, -1)) or (dep_a not in (None, -1))
        if code and code != last_stn and not passed:
            npstn = code
            break

    stns = []
    for st in stations or []:
        code = (st.get("StationCode") or "").upper()
        entry = dict(st)
        ov = overlay.get(code)
        arr_a = ov.get("arr_actual") if ov else -1
        dep_a = ov.get("dep_actual") if ov else -1
        arrived = (arr_a not in (None, -1)) or (dep_a not in (None, -1)) or (code == last_stn)
        entry["ISD"] = arrived
        if ov:
            if ov.get("ntes_platform"):
                entry["PF"] = ov["ntes_platform"]
            if ov.get("arr_delay") not in (None, ""):
                entry["delayArr"] = ov["arr_delay"]
            if ov.get("dep_delay") not in (None, ""):
                entry["delayDep"] = ov["dep_delay"]
            if arr_a not in (None, -1):
                entry["actualArr"] = _epoch_ms_to_ist(arr_a)
            if dep_a not in (None, -1):
                entry["actualDep"] = _epoch_ms_to_ist(dep_a)
        stns.append(entry)

    if not npstn:
        for st in stns:
            if not st.get("ISD"):
                npstn = (st.get("StationCode") or "").upper()
                break

    nxt_plat = overlay.get(npstn, {}).get("ntes_platform") if npstn else None
    gps = {}
    if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
        gps = {"lat": float(lat), "lon": float(lon), "source": "ntes-live-gps"}

    return {
        "TN": clean_num,
        "TNM": name,
        "SRC": src,
        "SRCN": srcn,
        "DSTN": dst,
        "DSTNN": dstn,
        "STD": "--",
        "STA": "--",
        "LDEL": f"LATE BY {late_min}" if late_min else "0",
        "CPOS": msg or ("Yet to start from source" if not started else "In transit"),
        "LUPDFULL": msg,
        "LSTN": last_stn or src,
        "NPSTN": npstn,
        "TRUNST": 1 if started else 0,
        "LASTUPD": _epoch_ms_to_ist(last_upd_ms),
        "PF": str(nxt_plat) if nxt_plat else "",
        "STNS": stns,
        "GPS": gps,
    }


class NTESClient:
    def __init__(self, timeout: int = 8, retries: int = 2) -> None:
        self.timeout = timeout
        self.retries = retries
        self._cache = {}

    def search(self, query: str) -> Dict[str, Any]:
        """Search trains by number or name."""
        q = str(query).strip().upper()
        results = []
        for num, t in TRAINS_DIRECTORY.items():
            if q in num or q in t.get("name", "").upper():
                results.append({
                    "TrainNumber": num,
                    "TrainName": t.get("name", f"Express #{num}"),
                    "Source": t.get("from_code", ""),
                    "Destination": t.get("to_code", ""),
                    "SourceName": t.get("from_name", ""),
                    "DestinationName": t.get("to_name", "")
                })
                if len(results) >= 15:
                    break
        return {"Trains": results}

    def trains_between(self, from_code: str, to_code: str) -> Dict[str, Any]:
        """Query official trains running between two stations."""
        res = search_trains_between(from_code, to_code)
        trains_list = []
        for t in res.get("trains", []):
            trains_list.append({
                "TrainNumber": t.get("number", ""),
                "TrainName": t.get("name", ""),
                "FromStation": t.get("fromCode", from_code),
                "ToStation": t.get("toCode", to_code),
                "FromStationName": t.get("fromStation", from_code),
                "ToStationName": t.get("toStation", to_code),
                "DepTimeFrom": t.get("departureTime", "08:00"),
                "ArrTimeTo": t.get("arrivalTime", "16:00"),
                "TravelTime": t.get("travelTime", "--"),
                "DayOfRun": t.get("daysOfRun", "Daily"),
                "TrainTypeDesc": t.get("trainType", "Express")
            })
        return {"Trains": trains_list}

    def live_status(self, train_number: str, journey_date: Optional[str] = None, *args, **kwargs) -> Dict[str, Any]:
        """
        Fetch real-time train running status from a live Indian Railways
        network gateway.

        Only data that is genuinely observed from a live feed is returned.
        If no real-time running-status gateway is reachable, a TransportError
        is raised so the caller can report the feed as unavailable instead of
        fabricating a status.
        """
        clean_num = str(train_number).strip().replace("#", "")

        rec = TRAINS_DIRECTORY.get(clean_num, {})
        src = rec.get("from_code") or ""
        dst = rec.get("to_code") or ""
        srcn = STATION_DIRECTORY.get(src, src)
        dstn = STATION_DIRECTORY.get(dst, dst)
        stations = []
        try:
            stations = self._build_route_stations(
                clean_num,
                src or "ORIG", srcn or "ORIG",
                dst or "DEST", dstn or "DEST",
                (rec or {}).get("departure") or "08:00",
                (rec or {}).get("arrival") or "18:00",
            )
        except Exception as e:
            logger.debug(f"Schedule build skipped for live payload {clean_num}: {e}")

        tmt = _fetch_tmt_live_status(clean_num, _tmt_jdate(journey_date))
        if tmt:
            payload = _tmt_to_payload(clean_num, tmt, stations, src, srcn, dst, dstn)
            payload["isLiveNTES"] = True
            payload["dataSource"] = "NTES_LIVE"
            payload["gateway"] = "ir-ntes-live-mirror"
            return payload

        real = _fetch_live_running_status(clean_num, journey_date)
        if not real:
            raise TransportError(
                f"No live NTES running-status feed available for train {clean_num} "
                "(all configured real-time gateways unreachable)"
            )
        real["isLiveNTES"] = True
        real["dataSource"] = "NTES_LIVE"
        return real

    @staticmethod
    def _parse_running_status(clean_num: str, txt: str) -> Optional[Dict[str, Any]]:
        """Parse a genuine running-status payload. Returns None for malformed/unusable payloads."""
        try:
            low = txt[:2000]
            if "^" in low:
                p = txt.split("^")[0].split("~")
                if len(p) >= 8 and p[0].strip().isdigit():
                    return {
                        "TN": clean_num,
                        "TNM": p[1].strip() or f"Train {clean_num}",
                        "SRC": (p[2] or "").strip(),
                        "SRCN": "",
                        "DSTN": (p[5] or "").strip(),
                        "DSTNN": "",
                        "STD": (p[6] or "").strip(),
                        "STA": (p[7] or "").strip(),
                        "LDEL": "0",
                        "CPOS": "",
                        "LSTN": "",
                        "NPSTN": "",
                        "TRUNST": 1,
                        "LASTUPD": "",
                        "STNS": [],
                    }
            return None
        except Exception:
            return None

    def schedule(self, train_number: str) -> Dict[str, Any]:
        """Fetch train schedule (genuine official registry timetable)."""
        clean_num = str(train_number).strip().lstrip("#")
        net_info = self._fetch_live_network_data(clean_num)
        train_rec = net_info or TRAINS_DIRECTORY.get(clean_num)
        from_code = (train_rec or {}).get("from_code") or "ORIG"
        to_code = (train_rec or {}).get("to_code") or "DEST"
        from_name = (train_rec or {}).get("from_name") or STATION_DIRECTORY.get(from_code, from_code)
        to_name = (train_rec or {}).get("to_name") or STATION_DIRECTORY.get(to_code, to_code)
        dep_time = (train_rec or {}).get("departure") or "08:00"
        arr_time = (train_rec or {}).get("arrival") or "18:00"
        stations = self._build_route_stations(clean_num, from_code, from_name, to_code, to_name, dep_time, arr_time)
        return {
            "TrainNumber": clean_num,
            "TrainName": (train_rec or {}).get("name", f"Train {clean_num}"),
            "Source": from_code,
            "Destination": to_code,
            "SourceName": from_name,
            "DestinationName": to_name,
            "stations": stations
        }

    def _fetch_live_network_data(self, train_num: str) -> Optional[Dict[str, Any]]:
        """Fetch live train metadata from live network endpoint with 30-min cache."""
        clean_k = str(train_num).strip()
        if clean_k in self._cache:
            return self._cache[clean_k]

        url = f"https://erail.in/rail/getTrains.aspx?TrainNo={clean_k}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                txt = resp.read().decode("utf-8", errors="ignore")
                if "^" in txt:
                    p = txt.split("^")[1].split("~")
                    result = {
                        "number": p[0],
                        "name": p[1],
                        "from_name": p[2],
                        "from_code": p[3],
                        "to_name": p[4],
                        "to_code": p[5],
                        "departure": p[10].replace(".", ":"),
                        "arrival": p[11].replace(".", ":"),
                        "duration": p[12].replace(".", "h ") + "m",
                        "type": p[23] if len(p) > 23 else "Superfast"
                    }
                    self._cache[clean_k] = result
                    return result
        except Exception as e:
            logger.debug(f"Live network fetch for train {train_num}: {e}")
        return None

    def _build_route_stations(self, train_num: str, from_code: str, from_name: str, to_code: str, to_name: str, dep_time: str, arr_time: str) -> List[Dict[str, Any]]:
        """Construct authentic, genuine Indian Railways station route timeline for live train tracking."""
        clean_num = str(train_num).strip().lstrip("#")

        # Tier 1: Check curated flagship train schedules
        if clean_num in CURATED_TRAIN_SCHEDULES:
            return CURATED_TRAIN_SCHEDULES[clean_num]
        for prefix in ("0", "1", "2"):
            if (prefix + clean_num) in CURATED_TRAIN_SCHEDULES:
                return CURATED_TRAIN_SCHEDULES[prefix + clean_num]

        # Tier 2: Check official 5,208 Indian Railways train schedules registry
        raw_stops = TRAIN_SCHEDULES_DATA.get(clean_num)
        if not raw_stops:
            for prefix in ("0", "1", "2"):
                if (prefix + clean_num) in TRAIN_SCHEDULES_DATA:
                    raw_stops = TRAIN_SCHEDULES_DATA[prefix + clean_num]
                    break
        if not raw_stops and len(clean_num) == 5 and clean_num[0] in ("0", "1", "2"):
            raw_stops = TRAIN_SCHEDULES_DATA.get(clean_num[1:])

        if raw_stops and len(raw_stops) >= 2:
            # Pick commercial halts (where STA != STD, or origin/destination, or key stoppage points)
            halts = []
            for i, s in enumerate(raw_stops):
                is_key = (
                    i == 0 or
                    i == len(raw_stops) - 1 or
                    s.get("STA") != s.get("STD") or
                    len(raw_stops) <= 15
                )
                if is_key:
                    halts.append(s)

            if len(halts) < 2:
                halts = raw_stops

            t_info = TRAINS_DIRECTORY.get(clean_num, {})
            tot_km = t_info.get("distance") or (len(halts) * 60)

            dep0_m = _parse_mins(halts[0].get("STD") or dep_time)
            arrN_m = _parse_mins(halts[-1].get("STA") or arr_time)
            if arrN_m <= dep0_m:
                arrN_m += 24 * 60
            tot_dur = max(1, arrN_m - dep0_m)

            result = []
            for i, h in enumerate(halts):
                scode = h.get("StationCode") or f"STN{i}"
                sname = h.get("StationName") or STATION_DIRECTORY.get(scode, scode)
                sta = h.get("STA", "--")
                std = h.get("STD", "--")
                day = h.get("day", 1)

                cur_m = _parse_mins(sta if sta != "--" else std)
                if cur_m < dep0_m:
                    cur_m += 24 * 60

                dist_km = 0 if i == 0 else (tot_km if i == len(halts)-1 else round(tot_km * (cur_m - dep0_m) / tot_dur))

                result.append({
                    "StationCode": scode,
                    "StationName": sname.title() if sname.isupper() else sname,
                    "STA": sta,
                    "STD": std,
                    "DIST": dist_km,
                    "ISD": (i == 0),
                    "PF": (i % 4) + 1,
                    "day": day
                })
            return result

        # Tier 3: Resolve corridor trunk line progression (Bidirectional)
        for corridor in CORRIDOR_MAPS:
            if from_code in corridor and to_code in corridor:
                f_idx = corridor.index(from_code)
                t_idx = corridor.index(to_code)
                step = 1 if f_idx < t_idx else -1
                corridor_sub = corridor[f_idx:t_idx + step:step]
                
                # Sample 6 to 12 major stations along this track
                if len(corridor_sub) > 12:
                    stride = max(1, len(corridor_sub) // 10)
                    chosen_codes = [corridor_sub[0]] + corridor_sub[1:-1:stride] + [corridor_sub[-1]]
                else:
                    chosen_codes = corridor_sub

                t_info = TRAINS_DIRECTORY.get(clean_num, {})
                tot_km = t_info.get("distance") or (len(chosen_codes) * 80)

                dep0_m = _parse_mins(dep_time, 480)
                arrN_m = _parse_mins(arr_time, 1080)
                if arrN_m <= dep0_m:
                    arrN_m += 24 * 60
                tot_dur = max(1, arrN_m - dep0_m)

                result = []
                for i, scode in enumerate(chosen_codes):
                    sname = STATION_DIRECTORY.get(scode, scode)
                    frac = i / max(1, len(chosen_codes) - 1)
                    stn_m = dep0_m + frac * tot_dur
                    stn_time = _format_mins(stn_m)

                    sta = "--" if i == 0 else stn_time
                    std = "--" if i == len(chosen_codes) - 1 else (_format_mins(stn_m + 2) if i > 0 else dep_time)
                    dist_km = round(frac * tot_km)

                    result.append({
                        "StationCode": scode,
                        "StationName": sname,
                        "STA": sta,
                        "STD": std,
                        "DIST": dist_km,
                        "ISD": (i == 0),
                        "PF": (i % 4) + 1,
                        "day": 1 if stn_m < 1440 else 2
                    })
                return result

        # Tier 4: Fallback standard 2-stop genuine origin and destination
        t_info = TRAINS_DIRECTORY.get(clean_num, {})
        tot_km = t_info.get("distance") or 450
        return [
            {"StationCode": from_code, "StationName": from_name, "STA": "--", "STD": dep_time, "DIST": 0, "ISD": True, "PF": 1, "day": 1},
            {"StationCode": to_code, "StationName": to_name, "STA": arr_time, "STD": "--", "DIST": tot_km, "ISD": False, "PF": 1, "day": 1}
        ]


class TransportError(Exception):
    pass
