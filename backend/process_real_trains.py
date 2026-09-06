import urllib.request
import json
import os

url = "https://raw.githubusercontent.com/datameet/railways/master/trains.json"
print("Downloading 5,208 real Indian Railways trains from official Open Data repository...")

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=30) as response:
    content = response.read().decode('utf-8')
    data = json.loads(content)

features = data.get('features', [])
print(f"Downloaded {len(features)} trains.")

real_trains_map = {}

for f in features:
    props = f.get('properties', {})
    train_num = str(props.get('number', '')).strip()
    train_name = props.get('name', '').strip()
    from_stn = props.get('from_station_name', '').strip()
    to_stn = props.get('to_station_name', '').strip()
    from_code = props.get('from_station_code', '').strip()
    to_code = props.get('to_station_code', '').strip()
    train_type = props.get('type', '').strip()
    zone = props.get('zone', '').strip()

    dep = (props.get('departure') or '08:00:00')[:5]
    arr = (props.get('arrival') or '16:00:00')[:5]
    try:
        dur_h = int(props.get('duration_h') or 0)
    except Exception:
        dur_h = 0
    try:
        dur_m = int(props.get('duration_m') or 0)
    except Exception:
        dur_m = 0
    dur_str = f"{dur_h}h {str(dur_m).zfill(2)}m" if (dur_h > 0 or dur_m > 0) else "8h 00m"
    try:
        dist = int(props.get('distance') or 0)
    except Exception:
        dist = 0

    if train_num and train_name:
        # Clean 4-digit to 5-digit if needed
        real_trains_map[train_num] = {
            'number': train_num,
            'name': train_name,
            'from': f"{from_stn} ({from_code})" if from_code else from_stn,
            'to': f"{to_stn} ({to_code})" if to_code else to_stn,
            'from_code': from_code,
            'to_code': to_code,
            'from_name': from_stn,
            'to_name': to_stn,
            'departure': dep,
            'arrival': arr,
            'duration': dur_str,
            'distance': dist,
            'type': train_type or 'Express',
            'zone': zone or 'Indian Railways'
        }
        # Map 4-digit numbers to leading-zero/1/2 variants only when the
        # variant keys are not already genuinely present (never overwrite a
        # real 5-digit train with an alias).
        if len(train_num) == 4:
            for prefix in ('0', '1', '2'):
                alias = prefix + train_num
                if alias not in real_trains_map:
                    real_trains_map[alias] = real_trains_map[train_num]

print(f"Total mapped real train keys: {len(real_trains_map)}")

# Save as compact JSON for backend and frontend
output_path = os.path.join(os.path.dirname(__file__), 'all_real_trains.json')
with open(output_path, 'w', encoding='utf-8') as out:
    json.dump(real_trains_map, out, indent=2)

print(f"Saved real train database to {output_path}")
