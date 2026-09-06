import urllib.request
import json

# Test fetching real schedule live from public raw repository
train_num = "12951"
url = f"https://raw.githubusercontent.com/datameet/railways/master/trains.json"

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        features = data.get('features', [])
        found = [f for f in features if f.get('properties', {}).get('number') == train_num]
        if found:
            print("Found live train properties:", found[0]['properties'])
        else:
            print(f"Train {train_num} not in dataset")
except Exception as e:
    print("Error:", e)
