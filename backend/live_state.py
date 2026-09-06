"""
RailFlow AI — Live fleet state cache.

Every time `resolve_live_train` resolves a train (live NTES or offline
simulation) it publishes the resulting payload here in-memory. The RTIS
telemetry fusion and the electronic-interlocking station status derive
their "live" view from this cache, so nothing is frozen seed data: what you
see is the most recently captured telemetry for that fleet member.
"""

import threading
from typing import Dict, Any, List, Optional

_lock = threading.Lock()
_LIVE_STATE: Dict[str, Dict[str, Any]] = {}


def update(number: str, payload: Dict[str, Any]) -> None:
    """Publish the latest resolved telemetry payload for a train."""
    with _lock:
        _LIVE_STATE[str(number).strip()] = payload


def get(number: str) -> Optional[Dict[str, Any]]:
    """Return the latest cached payload for a train (or None)."""
    with _lock:
        return _LIVE_STATE.get(str(number).strip())


def all() -> List[Dict[str, Any]]:
    """Return all currently cached fleet states."""
    with _lock:
        return list(_LIVE_STATE.values())


def count() -> int:
    with _lock:
        return len(_LIVE_STATE)


def clear() -> None:
    with _lock:
        _LIVE_STATE.clear()