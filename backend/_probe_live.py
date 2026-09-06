from fastapi.testclient import TestClient
import main

c = TestClient(main.app)
for code in ("BZA", "BPL", "NDLS"):
    j = c.get(f"/api/station-live/{code}").json()
    lt = j.get("liveTrains", [])
    print(f"== {code}: {len(lt)} live trains ==")
    for t in lt[:6]:
        print({k: t.get(k) for k in ("number", "name", "platform", "assignedPlatform", "speed", "status", "isLiveNTES", "dataSource", "predictionSource")})
    print()