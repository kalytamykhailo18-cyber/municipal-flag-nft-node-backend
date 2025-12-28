"""
Quick Database Reset Script
Run this AFTER stopping the backend server (Ctrl+C)
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from database import Base, engine, SessionLocal
from models import Country, Region, Municipality, Flag, User, FlagOwnership, FlagInterest

def reset_database():
    """Drop all tables and recreate them fresh."""
    print("=" * 60)
    print("  DATABASE RESET")
    print("=" * 60)

    print("\nStep 1: Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("  All tables dropped")

    print("\nStep 2: Creating fresh tables...")
    Base.metadata.create_all(bind=engine)
    print("  All tables created")

    print("\nStep 3: Verifying...")
    db = SessionLocal()
    try:
        countries = db.query(Country).count()
        flags = db.query(Flag).count()
        ownerships = db.query(FlagOwnership).count()
        print(f"  Countries: {countries}")
        print(f"  Flags: {flags}")
        print(f"  Ownerships: {ownerships}")
    finally:
        db.close()

    print("\n" + "=" * 60)
    print("  DATABASE RESET COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Run: python seed_data.py")
    print("  2. Start backend: python main.py")
    print()

if __name__ == "__main__":
    reset_database()
