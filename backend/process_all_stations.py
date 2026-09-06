import urllib.request
import json
import os

URL = "https://raw.githubusercontent.com/datameet/railways/master/stations.json"
print("Downloading 8,990 official Indian Railways stations...")

req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=30) as resp:
    data = json.loads(resp.read().decode('utf-8'))

features = data.get('features', [])
print(f"Loaded {len(features)} station features.")

station_directory = {}
station_coords = {}

for f in features:
    props = f.get('properties', {})
    code = str(props.get('code', '')).strip().upper()
    name = str(props.get('name', '')).strip()
    geom = f.get('geometry', {})
    coords = geom.get('coordinates', [0, 0]) if geom else [0, 0]
    
    if code and name:
        station_directory[code] = name
        # coordinates in geojson are [lon, lat]
        if len(coords) >= 2 and (coords[0] != 0 or coords[1] != 0):
            station_coords[code] = {
                'name': name,
                'lat': round(float(coords[1]), 5),
                'lon': round(float(coords[0]), 5)
            }

print(f"Total stations in directory: {len(station_directory)}")
print(f"Total stations with coordinates: {len(station_coords)}")

# Save to backend
backend_dir = os.path.dirname(__file__)
with open(os.path.join(backend_dir, "all_stations_directory.json"), "w", encoding="utf-8") as f:
    json.dump(station_directory, f, indent=2)

with open(os.path.join(backend_dir, "all_station_coords.json"), "w", encoding="utf-8") as f:
    json.dump(station_coords, f, indent=2)

# Save to frontend
frontend_data_dir = os.path.join(backend_dir, "..", "frontend", "src", "data")
if os.path.exists(frontend_data_dir):
    with open(os.path.join(frontend_data_dir, "allStationsDirectory.json"), "w", encoding="utf-8") as f:
        json.dump(station_directory, f, indent=2)
    with open(os.path.join(frontend_data_dir, "allStationCoords.json"), "w", encoding="utf-8") as f:
        json.dump(station_coords, f, indent=2)

print("Saved all 8,990 stations to backend and frontend.")
