"""
Database Reset & Seed with Pinata IPFS Integration
===================================================

This script:
1. Drops all existing database tables
2. Recreates fresh tables
3. Generates flag images (if needed)
4. Uploads images to Pinata IPFS
5. Fetches IPFS hashes from Pinata
6. Seeds database with proper IPFS hashes

Run this AFTER:
- Stopping the backend server (Ctrl+C)
- Adding Pinata credentials to .env file

Usage:
    cd backend
    python reset_and_seed_from_metadata.py
"""
import os
import sys
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
load_dotenv()

from database import Base, engine, SessionLocal
from models import Country, Region, Municipality, Flag, User, FlagOwnership, FlagInterest, FlagCategory, NFTStatus

# Paths
BACKEND_DIR = Path(__file__).parent
ROOT_DIR = BACKEND_DIR.parent
AI_GENERATOR_DIR = ROOT_DIR / "ai-generator"
OUTPUT_DIR = AI_GENERATOR_DIR / "output"
METADATA_DIR = AI_GENERATOR_DIR / "metadata"

# Pinata credentials
PINATA_JWT = os.getenv("PINATA_JWT", "")
PINATA_API_KEY = os.getenv("PINATA_API_KEY", "")
PINATA_API_SECRET = os.getenv("PINATA_API_SECRET", "")

# Municipality data (same as ai-generator/run_all.py)
MUNICIPALITIES_DATA = [
    {
        "country": {"name": "Spain", "code": "ESP"},
        "region": {"name": "Catalonia"},
        "municipalities": [
            {"name": "Barcelona", "latitude": 41.3851, "longitude": 2.1734},
            {"name": "Girona", "latitude": 41.9794, "longitude": 2.8214},
        ]
    },
    {
        "country": {"name": "France", "code": "FRA"},
        "region": {"name": "Provence"},
        "municipalities": [
            {"name": "Marseille", "latitude": 43.2965, "longitude": 5.3698},
            {"name": "Nice", "latitude": 43.7102, "longitude": 7.2620},
        ]
    },
    {
        "country": {"name": "Germany", "code": "DEU"},
        "region": {"name": "Bavaria"},
        "municipalities": [
            {"name": "Munich", "latitude": 48.1351, "longitude": 11.5820},
            {"name": "Nuremberg", "latitude": 49.4521, "longitude": 11.0767},
        ]
    },
    {
        "country": {"name": "Italy", "code": "ITA"},
        "region": {"name": "Tuscany"},
        "municipalities": [
            {"name": "Florence", "latitude": 43.7696, "longitude": 11.2558},
            {"name": "Siena", "latitude": 43.3188, "longitude": 11.3308},
        ]
    }
]

LOCATION_TYPES = [
    "Town Hall", "Fire Station", "Bakery", "Church",
    "Market Square", "Fountain", "Bridge", "Park"
]

CATEGORY_ASSIGNMENT = {
    "Town Hall": 2,      # Premium
    "Fire Station": 1,   # Plus
    "Bakery": 0,         # Standard
    "Church": 1,         # Plus
    "Market Square": 0,  # Standard
    "Fountain": 0,       # Standard
    "Bridge": 1,         # Plus
    "Park": 0            # Standard
}

CATEGORY_NAMES = ["standard", "plus", "premium"]


class PinataUploader:
    """Pinata IPFS uploader."""
    def __init__(self):
        self.base_url = "https://api.pinata.cloud"

        if not PINATA_JWT and not (PINATA_API_KEY and PINATA_API_SECRET):
            raise ValueError("Missing Pinata credentials in .env")

    def _headers(self, for_upload=False):
        if PINATA_JWT:
            headers = {"Authorization": f"Bearer {PINATA_JWT}"}
        else:
            headers = {
                "pinata_api_key": PINATA_API_KEY,
                "pinata_secret_api_key": PINATA_API_SECRET
            }
        if not for_upload:
            headers["Content-Type"] = "application/json"
        return headers

    def test_auth(self):
        try:
            r = requests.get(f"{self.base_url}/data/testAuthentication", headers=self._headers())
            return r.status_code == 200
        except:
            return False

    def upload_file(self, file_path):
        try:
            with open(file_path, 'rb') as f:
                r = requests.post(
                    f"{self.base_url}/pinning/pinFileToIPFS",
                    files={'file': (file_path.name, f)},
                    headers=self._headers(for_upload=True)
                )
                if r.status_code == 200:
                    return r.json()["IpfsHash"]
        except Exception as e:
            print(f"    Upload error: {e}")
        return None

    def upload_json(self, data, name):
        try:
            r = requests.post(
                f"{self.base_url}/pinning/pinJSONToIPFS",
                json={"pinataContent": data, "pinataMetadata": {"name": name}},
                headers=self._headers()
            )
            if r.status_code == 200:
                return r.json()["IpfsHash"]
        except Exception as e:
            print(f"    Upload error: {e}")
        return None


def generate_placeholder_image(municipality, location_type, category, width=1024, height=1024):
    """Generate a placeholder flag image using PIL."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("ERROR: Pillow not installed. Run: pip install Pillow")
        sys.exit(1)

    # Category colors
    category_colors = {
        0: [(70, 130, 180), (135, 206, 235)],    # Standard - Steel Blue
        1: [(218, 165, 32), (255, 215, 0)],      # Plus - Gold
        2: [(128, 0, 128), (186, 85, 211)],      # Premium - Purple
    }

    colors = category_colors.get(category, category_colors[0])
    bg_color = colors[0]
    accent_color = colors[1]

    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Border
    draw.rectangle([20, 20, width - 20, height - 20], outline=accent_color, width=10)

    # Center shield
    cx, cy = width // 2, height // 2
    shield_points = [
        (cx - 150, cy - 180), (cx + 150, cy - 180),
        (cx + 150, cy + 50), (cx, cy + 180), (cx - 150, cy + 50),
    ]
    draw.polygon(shield_points, fill=accent_color, outline=(255, 255, 255), width=5)

    # Location icon (simplified)
    icon_color = bg_color
    if location_type == "Town Hall":
        draw.rectangle([cx-80, cy-80, cx+80, cy+60], fill=icon_color)
        draw.polygon([(cx-100, cy-80), (cx, cy-150), (cx+100, cy-80)], fill=icon_color)
    elif location_type == "Church":
        draw.rectangle([cx-15, cy-100, cx+15, cy+80], fill=icon_color)
        draw.rectangle([cx-60, cy-50, cx+60, cy-20], fill=icon_color)
    elif location_type == "Fire Station":
        draw.ellipse([cx-50, cy-80, cx+50, cy+60], fill=(255, 100, 50))
    elif location_type == "Bridge":
        draw.arc([cx-100, cy-50, cx+100, cy+100], 0, 180, fill=icon_color, width=20)
    elif location_type == "Fountain":
        draw.ellipse([cx-60, cy-40, cx+60, cy+60], fill=(100, 149, 237))
    elif location_type == "Park":
        draw.ellipse([cx-50, cy-100, cx+50, cy], fill=(34, 139, 34))
        draw.rectangle([cx-15, cy, cx+15, cy+80], fill=(139, 69, 19))
    elif location_type == "Market Square":
        for i in range(-2, 3):
            for j in range(-2, 3):
                if (i + j) % 2 == 0:
                    draw.rectangle([cx+i*30-10, cy+j*30-10, cx+i*30+10, cy+j*30+10], fill=icon_color)
    else:
        draw.ellipse([cx-50, cy-50, cx+50, cy+50], fill=icon_color)

    # Text
    try:
        font_large = ImageFont.truetype("arial.ttf", 36)
        font_small = ImageFont.truetype("arial.ttf", 24)
    except:
        font_large = ImageFont.load_default()
        font_small = font_large

    # Municipality name
    text = municipality.upper()
    bbox = draw.textbbox((0, 0), text, font=font_large)
    draw.text(((width - (bbox[2] - bbox[0])) // 2, 50), text, fill=(255, 255, 255), font=font_large)

    # Location type
    text2 = location_type.upper()
    bbox2 = draw.textbbox((0, 0), text2, font=font_small)
    draw.text(((width - (bbox2[2] - bbox2[0])) // 2, height - 80), text2, fill=(255, 255, 255), font=font_small)

    # Category badge
    cat_text = ["STANDARD", "PLUS", "PREMIUM"][category]
    draw.rectangle([width - 150, 30, width - 30, 70], fill=accent_color)
    draw.text((width - 140, 38), cat_text, fill=(0, 0, 0), font=font_small)

    return img


def reset_database():
    """Drop all tables and recreate them fresh."""
    print("=" * 60)
    print("  DATABASE RESET & SEED WITH PINATA IPFS")
    print("=" * 60)

    print("\nStep 1: Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("  All tables dropped")

    print("\nStep 2: Creating fresh tables...")
    Base.metadata.create_all(bind=engine)
    print("  All tables created")


def generate_and_upload_to_ipfs():
    """Generate flag images and upload to Pinata IPFS."""
    print("\nStep 3: Generating images and uploading to Pinata IPFS...")

    # Check Pinata credentials
    if not PINATA_JWT and not PINATA_API_KEY:
        print("  ERROR: No Pinata credentials found in .env")
        print("  Please add PINATA_JWT or PINATA_API_KEY to .env file")
        return []

    # Test Pinata authentication
    try:
        uploader = PinataUploader()
        if not uploader.test_auth():
            print("  ERROR: Pinata authentication failed!")
            print("  Please check your Pinata credentials in .env")
            return []
        print("  Pinata authenticated successfully")
    except Exception as e:
        print(f"  ERROR: {e}")
        return []

    # Create output directories
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)

    all_flags = []
    flag_id = 0

    for country_data in MUNICIPALITIES_DATA:
        country = country_data["country"]
        region = country_data["region"]

        for municipality in country_data["municipalities"]:
            base_lat = municipality["latitude"]
            base_lon = municipality["longitude"]

            for i, location_type in enumerate(LOCATION_TYPES):
                flag_id += 1
                category = CATEGORY_ASSIGNMENT.get(location_type, 0)

                # Offset coordinates slightly for each location
                lat = round(base_lat + (i * 0.003), 6)
                lon = round(base_lon + (i * 0.003), 6)

                filename = f"{country['code']}_{municipality['name'].lower()}_{flag_id:03d}.png"
                output_path = OUTPUT_DIR / filename

                print(f"  [{flag_id}] {municipality['name']} - {location_type}...", end=" ", flush=True)

                # Generate image if it doesn't exist
                if not output_path.exists():
                    img = generate_placeholder_image(municipality["name"], location_type, category)
                    img.save(output_path, format='PNG')
                    print("Generated...", end=" ", flush=True)
                else:
                    print("Exists...", end=" ", flush=True)

                # Upload image to IPFS
                image_hash = uploader.upload_file(output_path)
                if not image_hash:
                    print("FAILED")
                    continue

                print(f"Uploaded -> {image_hash[:12]}...", end=" ", flush=True)

                # Create metadata
                metadata = {
                    "name": f"Flag of {municipality['name']} - {location_type}",
                    "description": f"{location_type} flag of {municipality['name']}, {region['name']}, {country['name']}. Part of the Municipal Flag NFT collection.",
                    "image": f"ipfs://{image_hash}",
                    "external_url": f"https://municipalflagnft.demo/{flag_id}",
                    "attributes": [
                        {"trait_type": "Country", "value": country["name"]},
                        {"trait_type": "Country Code", "value": country["code"]},
                        {"trait_type": "Region", "value": region["name"]},
                        {"trait_type": "Municipality", "value": municipality["name"]},
                        {"trait_type": "Location Type", "value": location_type},
                        {"trait_type": "Category", "value": CATEGORY_NAMES[category].title()},
                        {"trait_type": "Latitude", "value": lat},
                        {"trait_type": "Longitude", "value": lon},
                        {"display_type": "number", "trait_type": "Flag ID", "value": flag_id}
                    ]
                }

                # Upload metadata to IPFS
                metadata_hash = uploader.upload_json(metadata, f"flag_{flag_id}_metadata.json")
                if metadata_hash:
                    print(f"Metadata -> {metadata_hash[:12]}...")
                else:
                    print("Metadata FAILED")

                # Save metadata to file with IPFS hashes
                metadata["image_ipfs_hash"] = image_hash
                metadata["metadata_ipfs_hash"] = metadata_hash

                metadata_path = METADATA_DIR / f"{flag_id}.json"
                with open(metadata_path, 'w') as f:
                    json.dump(metadata, f, indent=2)

                # Store flag info
                flag_info = {
                    "id": flag_id,
                    "country": country["name"],
                    "country_code": country["code"],
                    "region": region["name"],
                    "municipality": municipality["name"],
                    "location_type": location_type,
                    "category": CATEGORY_NAMES[category],
                    "latitude": lat,
                    "longitude": lon,
                    "image_ipfs_hash": image_hash,
                    "metadata_ipfs_hash": metadata_hash,
                }
                all_flags.append(flag_info)

    print(f"\n  Processed {len(all_flags)} flags with IPFS hashes")
    return all_flags


def seed_database(flags_data):
    """Seed database with flag data including IPFS hashes."""
    print("\nStep 4: Seeding database...")

    if not flags_data:
        print("  ERROR: No flag data to seed")
        return

    db = SessionLocal()
    try:
        # Track created entities
        countries_map = {}
        regions_map = {}
        municipalities_map = {}

        for meta in flags_data:
            # Create or get country
            country_key = meta["country_code"]
            if country_key not in countries_map:
                country = Country(
                    code=meta["country_code"],
                    name=meta["country"]
                )
                db.add(country)
                db.flush()  # Get ID
                countries_map[country_key] = country
            else:
                country = countries_map[country_key]

            # Create or get region
            region_key = (country.id, meta["region"])
            if region_key not in regions_map:
                region = Region(
                    name=meta["region"],
                    country_id=country.id
                )
                db.add(region)
                db.flush()
                regions_map[region_key] = region
            else:
                region = regions_map[region_key]

            # Create or get municipality
            muni_key = (region.id, meta["municipality"])
            if muni_key not in municipalities_map:
                municipality = Municipality(
                    name=meta["municipality"],
                    region_id=region.id,
                    latitude=meta["latitude"],
                    longitude=meta["longitude"]
                )
                db.add(municipality)
                db.flush()
                municipalities_map[muni_key] = municipality
            else:
                municipality = municipalities_map[muni_key]

            # Create flag with IPFS hashes
            flag_name = f"{meta['latitude']:.6f}, {meta['longitude']:.6f}"

            # Convert category string to Enum
            category_map = {
                "standard": FlagCategory.STANDARD,
                "plus": FlagCategory.PLUS,
                "premium": FlagCategory.PREMIUM
            }
            category_enum = category_map.get(meta["category"], FlagCategory.STANDARD)

            # Calculate nfts_required to match smart contract logic
            # Town Hall flags (every 8th starting from 1) require 3 NFTs
            flag_id = meta["id"]
            if flag_id % 8 == 1:
                nfts_required = 3  # Premium Town Hall flags require 3 NFTs
            else:
                nfts_required = 1  # All other flags require 1 NFT

            flag = Flag(
                id=meta["id"],
                municipality_id=municipality.id,
                name=flag_name,
                location_type=meta["location_type"],
                category=category_enum,
                nfts_required=nfts_required,
                image_ipfs_hash=meta["image_ipfs_hash"],
                metadata_ipfs_hash=meta["metadata_ipfs_hash"],
                first_nft_status=NFTStatus.AVAILABLE,
                second_nft_status=NFTStatus.AVAILABLE
            )
            db.add(flag)

        db.commit()

        # Verify
        countries_count = db.query(Country).count()
        regions_count = db.query(Region).count()
        municipalities_count = db.query(Municipality).count()
        flags_count = db.query(Flag).count()

        print(f"  Countries: {countries_count}")
        print(f"  Regions: {regions_count}")
        print(f"  Municipalities: {municipalities_count}")
        print(f"  Flags: {flags_count}")

        # Check flags with IPFS
        flags_with_ipfs = db.query(Flag).filter(Flag.image_ipfs_hash.isnot(None)).count()
        print(f"  Flags with IPFS: {flags_with_ipfs}")

    except Exception as e:
        db.rollback()
        print(f"  ERROR: Failed to seed database: {e}")
        raise
    finally:
        db.close()


def main():
    """Main execution."""
    # Reset database
    reset_database()

    # Generate images and upload to IPFS
    flags_data = generate_and_upload_to_ipfs()

    # Seed database
    if flags_data:
        seed_database(flags_data)

    # Done
    print("\n" + "=" * 60)
    print("  DATABASE RESET COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Start backend: python main.py")
    print("  2. Open frontend and test")
    print()


if __name__ == "__main__":
    main()
