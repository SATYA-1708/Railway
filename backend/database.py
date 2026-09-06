"""
RailFlow AI — Database Engine and ORM Models
Supports PostgreSQL in production / Docker and SQLite for zero-config local operations.
"""

import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

SQLITE_PATH = os.path.join(DATA_DIR, "railflow.db")
DEFAULT_DB_URL = f"sqlite:///{SQLITE_PATH}"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# SQLite concurrency configuration
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class TrainSnapshot(Base):
    __tablename__ = "train_snapshots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    train_number = Column(String(16), index=True, nullable=False)
    train_name = Column(String(128), default="")
    source_station = Column(String(16), default="")
    destination_station = Column(String(16), default="")
    scheduled_arrival = Column(String(16), default="")
    actual_arrival = Column(String(16), default="")
    delay_min = Column(Float, default=0.0)
    weather_code = Column(Integer, default=0)
    visibility_km = Column(Float, default=10.0)
    temperature_c = Column(Float, default=28.0)
    speed_kmh = Column(Float, default=0.0)
    distance_km = Column(Float, default=0.0)
    stops_remaining = Column(Integer, default=0)
    is_night = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)
    raw_payload = Column(Text, nullable=True)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phone_number = Column(String(32), index=True, nullable=False)
    train_number = Column(String(16), index=True, nullable=False)
    alert_types = Column(String(128), default="DELAY,PLATFORM,WEATHER")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertHistory(Base):
    __tablename__ = "alert_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phone_number = Column(String(32), index=True, nullable=False)
    train_number = Column(String(16), index=True, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(32), default="SENT")
    sent_at = Column(DateTime, default=datetime.utcnow)


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), default="station_master")
    station_code = Column(String(16), default="BZA")
    division = Column(String(64), default="Vijayawada (SCR)")
    full_name = Column(String(128), default="")
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


init_db()
