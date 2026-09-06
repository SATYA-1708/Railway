"""
Comprehensive Automated Verification Suite for RailFlow AI
Smart India Hackathon 2026 (Problem Statement 26028: Dynamic Forecast of ETA for Coaching Trains)
Tests all core phases and PS 26028 requirements.
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_system():
    print("=" * 75)
    print(">>> STARTING RAILFLOW AI SIH 2026 PS 26028 VERIFICATION SUITE <<<")
    print("=" * 75)

    # 1. Root & Health
    r = requests.get(f"{BASE_URL}/")
    assert r.status_code == 200, f"Root failed: {r.status_code}"
    print("[PASS] 1. Root Health Check: ONLINE")

    # 2. Live NTES + Quantile Regressors + Multi-Station ML Trajectory
    r = requests.get(f"{BASE_URL}/api/live-ntes-train/20805")
    assert r.status_code == 200, f"Live train failed: {r.status_code}"
    data = r.json()
    assert "quantileConfidence" in data, "Missing quantileConfidence in live train payload"
    assert "featureAttributions" in data, "Missing featureAttributions in live train payload"
    assert "routeTimeline" in data, "Missing routeTimeline"
    assert "operationalImpact" in data, "Missing operationalImpact"
    assert "activeCautionOrders" in data, "Missing activeCautionOrders"
    assert "corridorTelemetry" in data, "Missing corridorTelemetry"
    
    # Verify multi-station dynamic trajectory
    timeline = data.get("routeTimeline", [])
    assert len(timeline) > 2, "Timeline has fewer than 2 stations"
    last_stn = timeline[-1]
    assert "predicted" in last_stn, "Destination station missing ML predicted time"
    assert "quantileInterval" in last_stn, "Destination station missing quantileInterval"
    
    print(f"[PASS] 2. Live Train #{data.get('number')} ETA: {data.get('dynamicEta')} | Quantile Window: {data.get('expectedRange')}")
    print(f"       Destination Dynamic ETA: {last_stn.get('name')} -> {last_stn.get('predicted')} (Delay: +{last_stn.get('delayMin')}m, Quantile: {last_stn.get('quantileInterval')})")
    print(f"       Top Factors: {[a['factor'] for a in data.get('featureAttributions', [])]}")

    # 3. Model Card
    r = requests.get(f"{BASE_URL}/api/model/card")
    assert r.status_code == 200, f"Model card failed: {r.status_code}"
    card = r.json()
    print(f"[PASS] 3. Model Card: {card.get('library')} | MAE: +- {card.get('valMaeMin')}m (vs Baseline {card.get('valBaselineMaeMin')}m, +{card.get('heldOutImprovementPct')}%) | Coverage: {card.get('coveragePctP10P90')}%")

    # 4. Continuous Retraining
    r = requests.post(f"{BASE_URL}/api/model/retrain")
    assert r.status_code == 200, f"Retrain failed: {r.status_code}"
    retrain_res = r.json()
    print(f"[PASS] 4. Online Retraining (14 Features): {retrain_res.get('message')}")

    # 5. Scalability Batch Benchmark (500 Trains)
    r = requests.post(f"{BASE_URL}/api/batch-predict", json={"trainCount": 500})
    assert r.status_code == 200, f"Batch predict failed: {r.status_code}"
    batch = r.json()
    print(f"[PASS] 5. Scalability Batch Benchmark: {batch.get('latencyMs')}ms total | Throughput: {batch.get('throughputTrainsPerSecond')} trains/sec")

    # 6. Downstream Track Congestion Radar
    r = requests.get(f"{BASE_URL}/api/corridor/density?station_code=BZA")
    assert r.status_code == 200, f"Corridor density failed: {r.status_code}"
    corridor = r.json()
    assert "congestionIndex" in corridor
    assert "precedingTrain" in corridor
    print(f"[PASS] 6. Downstream Corridor Congestion: Density Level '{corridor.get('corridorDensityLevel')}' (Index: {corridor.get('congestionIndex')}) | Preceding Headway: {corridor.get('precedingTrainHeadwayMin')}m | Signal Aspect: {corridor.get('signalAspectForecast')}")

    # 7. Temporary Speed Restrictions (TSR) & Caution Orders
    r = requests.get(f"{BASE_URL}/api/tsr/active")
    assert r.status_code == 200, f"TSR active failed: {r.status_code}"
    tsr_data = r.json()
    assert tsr_data.get("count", 0) > 0, "Expected active TSR caution orders"
    print(f"[PASS] 7. RDSO Caution Orders (TSR): {tsr_data.get('count')} active speed restrictions (Total section delay penalty: +{tsr_data.get('totalSectionDelayImpactMin')}m)")

    # 8. Operational Stakeholder Impact Evaluator
    r = requests.get(f"{BASE_URL}/api/operational-impacts/20805")
    assert r.status_code == 200, f"Operational impacts failed: {r.status_code}"
    ops = r.json().get("operationalImpact", {})
    assert "crewDutyStatus" in ops
    assert "rakeCleaningTurnaround" in ops
    assert "connectingTrainRisk" in ops
    print(f"[PASS] 8. Operational Stakeholder Impact: Crew HOER -> {ops['crewDutyStatus']['title']} ({ops['crewDutyStatus']['status']}) | Pit-line -> {ops['rakeCleaningTurnaround']['title']}")

    # 9. Event-Driven Reactive Recalculation
    r = requests.post(f"{BASE_URL}/api/event/delay-spike", json={"trainNumber": "20805", "delaySpikeDeltaMin": 15.0, "reason": "Signal Failure at Outer Home"})
    assert r.status_code == 200, f"Event delay spike failed: {r.status_code}"
    event_res = r.json()
    print(f"[PASS] 9. Event-Driven Reactive Pipeline: {event_res.get('message')} (Revised Next ETA: {event_res.get('revisedDynamicEta')})")

    # 10. JWT Auth & RBAC
    r = requests.post(f"{BASE_URL}/api/auth/token", json={"username": "sm_bza", "password": "railway123"})
    assert r.status_code == 200, f"Auth failed: {r.status_code}"
    auth_data = r.json()
    token = auth_data["access_token"]
    print(f"[PASS] 10. JWT Auth Login: {auth_data['user']['fullName']} (Role: {auth_data['user']['role']})")

    # 11. Protected Staff Dashboard
    r = requests.get(f"{BASE_URL}/api/staff/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, f"Staff dashboard failed: {r.status_code}"
    print(f"[PASS] 11. RBAC Protected Dashboard: Station {r.json().get('station')} Nominal")

    # 12. SMS Alert Subscription
    r = requests.post(f"{BASE_URL}/api/subscribe", json={"phoneNumber": "+919876543210", "trainNumber": "20805", "alertTypes": ["DELAY", "PLATFORM"]})
    assert r.status_code == 200, f"Subscribe failed: {r.status_code}"
    print(f"[PASS] 12. Passenger SMS Gateway: {r.json().get('delivery', {}).get('provider')} (Status: {r.json().get('delivery', {}).get('status')})")

    # 13. Snapshot Collection & Stats
    r = requests.get(f"{BASE_URL}/api/snapshots/stats")
    assert r.status_code == 200, f"Snapshots stats failed: {r.status_code}"
    print(f"[PASS] 13. SQL Database Telemetry Store: {r.json().get('totalSnapshotsStored')} Snapshots persisted")

    # 14. RTIS Locomotive NavIC Telemetry
    r_ingest = requests.post(f"{BASE_URL}/api/rtis/telemetry/ingest", json={
        "train_number": "20805",
        "loco_id": "WAP7-30452-VSKP",
        "latitude": 17.6868,
        "longitude": 83.2185,
        "speed_kmh": 105.0,
        "navic_satellites_locked": 16,
        "gps_fix_quality": "NAVIC_ISRO_MSS"
    })
    assert r_ingest.status_code == 200, f"RTIS ingest failed: {r_ingest.status_code}"
    
    r = requests.get(f"{BASE_URL}/api/rtis/loco-status/20805")
    assert r.status_code == 200, f"RTIS status failed: {r.status_code}"
    rtis_data = r.json()
    assert rtis_data.get("isRtisActive") == True
    print(f"[PASS] 14. ISRO NavIC RTIS Locomotive: Loco {rtis_data.get('locoId')} ({rtis_data.get('satellitesLocked')} Sats Locked)")

    # 15. RDSO Electronic Interlocking Data Logger
    r = requests.get(f"{BASE_URL}/api/interlocking/station/BZA")
    assert r.status_code == 200, f"Interlocking failed: {r.status_code}"
    ei_data = r.json()
    assert "signals" in ei_data
    print(f"[PASS] 15. RDSO Electronic Interlocking: Station {ei_data.get('station_name')} ({ei_data.get('vendor')})")

    print("=" * 75)
    print(">>> ALL 15 VERIFICATION CHECKS PASSED WITH 100% SUCCESS! <<<")
    print("=" * 75)

if __name__ == "__main__":
    time.sleep(1)
    test_system()
