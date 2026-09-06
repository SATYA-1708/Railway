import urllib.request
import json

# Check schedules dataset
url = "https://raw.githubusercontent.com/datameet/railways/master/schedules.json"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        print(f"SUCCESS: Loaded {len(data)} real schedule entries!")
        if len(data) > 0:
            print("Sample entry:", data[0])
except Exception as e:
    print("Schedules load status:", e)
