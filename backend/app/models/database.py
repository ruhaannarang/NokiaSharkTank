"""SQLite via SQLAlchemy. PostgreSQL-ready: swap DATABASE_URL."""
import os
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./connectiq.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True)
    latitude = Column(Float)
    longitude = Column(Float)
    score = Column(Float)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class RouteForecast(Base):
    __tablename__ = "route_forecasts"
    id = Column(Integer, primary_key=True)
    origin = Column(String)
    destination = Column(String)
    total_min = Column(Integer)
    poor_min = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)
