import urllib.request
import json
import os
import sys

URL = "https://raw.githubusercontent.com/datameet/railways/master/schedules.json"
OUTPUT_SCHEDULES_JSON = os.path.join(os.path.dirname(__file__), "train_schedules.json")

print("Downloading official Indian Railways schedules (78 MB)...")
req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    raw = resp.read().decode('utf-8')

print("Parsing JSON...")
all_stops = json.loads(raw)
print(f"Total schedule records parsed: {len(all_stops)}")

train_schedules = {}

for s in all_stops:
    t_num = str(s.get("train_number", "")).strip()
    if not t_num:
        continue
    
    if t_num not in train_schedules:
        train_schedules[t_num] = []
        
    train_schedules[t_num].append(s)

print(f"Grouped into {len(train_schedules)} unique train numbers.")

formatted_schedules = {}

for t_num, stops in train_schedules.items():
    stops_sorted = sorted(stops, key=lambda x: x.get("id", 0))
    
    clean_stops = []
    for i, st in enumerate(stops_sorted):
        arr = st.get("arrival")
        dep = st.get("departure")
        
        arr_str = "--" if (not arr or arr == "None") else arr[:5]
        dep_str = "--" if (not dep or dep == "None") else dep[:5]
        
        code = str(st.get("station_code", "")).strip().upper()
        name = str(st.get("station_name", "")).strip()
        day = int(st.get("day") or 1)
        
        clean_stops.append({
            "StationCode": code,
            "StationName": name,
            "STA": arr_str,
            "STD": dep_str,
            "day": day,
            "ISD": (i == 0)
        })
        
    formatted_schedules[t_num] = clean_stops
    if len(t_num) == 4:
        for prefix in ('0', '1', '2'):
            alias = prefix + t_num
            if alias not in formatted_schedules:
                formatted_schedules[alias] = clean_stops

print(f"Saving formatted schedules to {OUTPUT_SCHEDULES_JSON}...")
with open(OUTPUT_SCHEDULES_JSON, "w", encoding="utf-8") as f:
    json.dump(formatted_schedules, f, separators=(',', ':'))

size_mb = os.path.getsize(OUTPUT_SCHEDULES_JSON) / (1024 * 1024)
print(f"Done! Saved {len(formatted_schedules)} train schedules ({size_mb:.2f} MB).")

if "12057" in formatted_schedules:
    print("\nSample 12057 Stops:")
    for st in formatted_schedules["12057"]:
        print(f"  {st['StationCode']} ({st['StationName']}) - Arr: {st['STA']} | Dep: {st['STD']} (Day {st['day']})")
