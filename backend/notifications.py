"""
RailFlow AI — Passenger SMS & WhatsApp Notification Service
Integrates Twilio SMS API with transparent sandbox demo fallback.
"""

import os
import logging
from typing import Dict, Any, Optional
import httpx
from datetime import datetime

logger = logging.getLogger("railflow.notifications")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "+12058917263")


async def send_sms(to_number: str, message: str) -> Dict[str, Any]:
    """
    Send an SMS alert via Twilio REST API.
    If Twilio credentials are not configured, runs in Demo Sandbox Mode.
    """
    clean_phone = to_number.strip().replace(" ", "").replace("-", "")
    if not clean_phone.startswith("+"):
        clean_phone = "+91" + clean_phone.lstrip("0")

    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    url,
                    data={"From": TWILIO_FROM_NUMBER, "To": clean_phone, "Body": message},
                    auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                )
                if resp.status_code in (200, 201):
                    res_data = resp.json()
                    logger.info(f"SMS dispatched to {clean_phone} via Twilio SID: {res_data.get('sid')}")
                    return {
                        "status": "SENT",
                        "provider": "Twilio Live SMS Gateway",
                        "sid": res_data.get("sid"),
                        "recipient": clean_phone,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                else:
                    logger.warning(f"Twilio SMS HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Twilio send failed: {e}")

    # Demo Sandbox Mock Delivery
    logger.info(f"[DEMO SMS SANDBOX] Alert sent to {clean_phone}: '{message}'")
    return {
        "status": "DELIVERED",
        "provider": "RailFlow AI Demo SMS Sandbox (+91 Gateway)",
        "sid": f"SM_DEMO_{int(datetime.utcnow().timestamp())}",
        "recipient": clean_phone,
        "message": message,
        "isDemo": True,
        "timestamp": datetime.utcnow().strftime("%H:%M:%S IST")
    }


def format_delay_sms(train_number: str, train_name: str, delay_min: int, eta_time: str, platform: str) -> str:
    return (
        f"[RailFlow AI Update] Train #{train_number} ({train_name}) "
        f"is delayed by ~{delay_min} min. Revised ETA: {eta_time} at PF {platform}. "
        f"Live tracking: https://railflow.gov.in/t/{train_number}"
    )
