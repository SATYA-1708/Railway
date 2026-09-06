import urllib.request
import json

# Test fetching real Indian Railways train data from open GitHub repository
url = "https://raw.githubusercontent.com/datameet/railways/master/trains.json"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        features = data.get('features', [])
        print(f"SUCCESS: Loaded {len(features)} REAL Indian Railways trains from official Open Data repository!")
        # Sample inspect first 3
        for item in features[:3]:
            props = item.get('properties', {})
            print(f"- #{props.get('number')}: {props.get('name')} ({props.get('from_station_name')} -> {props.get('to_station_name')})")
except Exception as e:
    print("Failed to fetch:", e)
