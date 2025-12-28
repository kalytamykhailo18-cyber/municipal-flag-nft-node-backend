"""
Admin API Router.
"""
import re
import random
import httpx
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import (
    Country, Region, Municipality, Flag, User,
    FlagInterest, FlagOwnership, Auction, AuctionStatus, OwnershipType, FlagCategory
)
from schemas import (
    AdminStatsResponse, MessageResponse, UserResponse,
    DemoUserCreate, DemoUserResponse, DemoOwnershipCreate, DemoOwnershipResponse,
    CoordinateNFTCreate, CoordinateNFTResponse,
    ImagePreviewResponse, ImagePreviewItem
)
from config import settings
from decimal import Decimal

router = APIRouter(tags=["Admin"])


def verify_admin(x_admin_key: Optional[str] = Header(None)):
    """Verify admin API key for protected endpoints."""
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing admin API key"
        )
    return True


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Get overall statistics for the admin panel."""
    total_countries = db.query(func.count(Country.id)).scalar()
    total_regions = db.query(func.count(Region.id)).scalar()
    total_municipalities = db.query(func.count(Municipality.id)).scalar()
    total_flags = db.query(func.count(Flag.id)).scalar()
    total_users = db.query(func.count(User.id)).scalar()
    total_interests = db.query(func.count(FlagInterest.id)).scalar()
    total_ownerships = db.query(func.count(FlagOwnership.id)).scalar()
    total_auctions = db.query(func.count(Auction.id)).scalar()
    active_auctions = db.query(func.count(Auction.id)).filter(
        Auction.status == AuctionStatus.ACTIVE
    ).scalar()
    completed_pairs = db.query(func.count(Flag.id)).filter(
        Flag.is_pair_complete == True
    ).scalar()

    return AdminStatsResponse(
        total_countries=total_countries or 0,
        total_regions=total_regions or 0,
        total_municipalities=total_municipalities or 0,
        total_flags=total_flags or 0,
        total_users=total_users or 0,
        total_interests=total_interests or 0,
        total_ownerships=total_ownerships or 0,
        total_auctions=total_auctions or 0,
        active_auctions=active_auctions or 0,
        completed_pairs=completed_pairs or 0
    )


@router.post("/seed", response_model=MessageResponse)
def seed_demo_data(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Seed the database with demo data (only if empty)."""
    # Check if data already exists
    existing_countries = db.query(Country).count()
    if existing_countries > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database already has data. Cannot seed."
        )

    # Import seed function
    from seed_data import seed_database
    seed_database(db)

    return MessageResponse(message="Demo data seeded successfully")


@router.post("/reset", response_model=MessageResponse)
def reset_database(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Reset the database (delete all data). USE WITH CAUTION."""
    # Delete in correct order to respect foreign keys
    db.query(FlagInterest).delete()
    db.query(FlagOwnership).delete()
    from models import Bid, UserConnection
    db.query(Bid).delete()
    db.query(Auction).delete()
    db.query(UserConnection).delete()
    db.query(User).delete()
    db.query(Flag).delete()
    db.query(Municipality).delete()
    db.query(Region).delete()
    db.query(Country).delete()
    db.commit()

    return MessageResponse(message="Database reset successfully")


@router.get("/health")
def health_check():
    """Simple health check endpoint."""
    return {
        "status": "healthy",
        "project": settings.project_name,
        "environment": settings.environment
    }


@router.get("/ipfs-status")
def ipfs_status(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Get IPFS upload status for all flags."""
    total_flags = db.query(func.count(Flag.id)).scalar() or 0
    flags_with_image = db.query(func.count(Flag.id)).filter(
        Flag.image_ipfs_hash.isnot(None)
    ).scalar() or 0
    flags_with_metadata = db.query(func.count(Flag.id)).filter(
        Flag.metadata_ipfs_hash.isnot(None)
    ).scalar() or 0

    return {
        "total_flags": total_flags,
        "flags_with_image_hash": flags_with_image,
        "flags_with_metadata_hash": flags_with_metadata,
        "flags_pending_upload": total_flags - flags_with_image
    }


@router.patch("/flags/{flag_id}/ipfs")
def update_flag_ipfs_hashes(
    flag_id: int,
    image_ipfs_hash: Optional[str] = None,
    metadata_ipfs_hash: Optional[str] = None,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Update IPFS hashes for a specific flag."""
    flag = db.query(Flag).filter(Flag.id == flag_id).first()
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flag with id {flag_id} not found"
        )

    if image_ipfs_hash:
        flag.image_ipfs_hash = image_ipfs_hash
    if metadata_ipfs_hash:
        flag.metadata_ipfs_hash = metadata_ipfs_hash

    db.commit()

    return {
        "flag_id": flag_id,
        "image_ipfs_hash": flag.image_ipfs_hash,
        "metadata_ipfs_hash": flag.metadata_ipfs_hash,
        "message": "IPFS hashes updated successfully"
    }


@router.post("/sync-ipfs-from-pinata", response_model=MessageResponse)
async def sync_ipfs_from_pinata(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """
    Sync IPFS hashes from Pinata to database flags.
    Matches files by pattern: {COUNTRY_CODE}_{municipality}_{flag_number}.png
    """
    if not settings.pinata_jwt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pinata JWT not configured"
        )

    # Fetch all pinned files from Pinata
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.pinata.cloud/data/pinList",
            params={"status": "pinned", "pageLimit": 1000},
            headers={"Authorization": f"Bearer {settings.pinata_jwt}"},
            timeout=30.0
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch from Pinata: {response.text}"
            )
        pinata_data = response.json()

    # Build mapping of flag_id -> ipfs_hash for images and metadata
    # Priority: {COUNTRY}_{city}_{id}.png > flag_{id}.png
    image_map = {}  # {flag_id: ipfs_hash}
    image_map_fallback = {}  # {flag_id: ipfs_hash} for flag_{id}.png pattern
    metadata_map = {}  # {flag_id: ipfs_hash}

    for pin in pinata_data.get("rows", []):
        name = pin.get("metadata", {}).get("name", "")
        ipfs_hash = pin.get("ipfs_pin_hash")

        if not name or not ipfs_hash:
            continue

        # Match PRIMARY image files: {COUNTRY_CODE}_{municipality}_{flag_id}.png
        # e.g., ITA_siena_064.png, ESP_barcelona_001.png - the number is the flag ID
        match = re.match(r"^[A-Z]{3}_[a-z]+_(\d+)\.png$", name)
        if match:
            flag_id = int(match.group(1))
            image_map[flag_id] = ipfs_hash
            continue

        # Match FALLBACK: flag_{id}.png format (lower priority)
        match = re.match(r"^flag_(\d+)\.png$", name)
        if match:
            flag_id = int(match.group(1))
            image_map_fallback[flag_id] = ipfs_hash
            continue

        # Match metadata files: flag_{id}_metadata.json
        match = re.match(r"^flag_(\d+)_metadata\.json$", name)
        if match:
            flag_id = int(match.group(1))
            metadata_map[flag_id] = ipfs_hash

    # Merge fallback into main map (only if not already present)
    for flag_id, ipfs_hash in image_map_fallback.items():
        if flag_id not in image_map:
            image_map[flag_id] = ipfs_hash

    # Get all flags
    flags = db.query(Flag).all()

    updated_count = 0

    for flag in flags:
        # Find matching image and metadata by flag ID
        image_hash = image_map.get(flag.id)
        metadata_hash = metadata_map.get(flag.id)

        updated = False
        if image_hash and flag.image_ipfs_hash != image_hash:
            flag.image_ipfs_hash = image_hash
            updated = True
        if metadata_hash and flag.metadata_ipfs_hash != metadata_hash:
            flag.metadata_ipfs_hash = metadata_hash
            updated = True

        if updated:
            updated_count += 1

    db.commit()

    return MessageResponse(
        message=f"Synced IPFS hashes. Updated {updated_count} flags. "
                f"Found {len(image_map)} images and {len(metadata_map)} metadata files in Pinata."
    )


# =============================================================================
# DEMO USER ENDPOINTS
# =============================================================================

def build_user_response(user: User) -> UserResponse:
    """Build user response."""
    return UserResponse(
        id=user.id,
        wallet_address=user.wallet_address,
        username=user.username,
        reputation_score=user.reputation_score,
        created_at=user.created_at,
        flags_owned=len(user.ownerships),
        followers_count=len(user.followers),
        following_count=len(user.following)
    )


@router.post("/create-demo-user", response_model=DemoUserResponse)
def create_demo_user(
    demo_data: DemoUserCreate = DemoUserCreate(),
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """
    Create a demo user for testing and presentation purposes.

    If a user with the wallet address already exists, returns that user.
    Otherwise creates a new demo user.
    """
    wallet = demo_data.wallet_address.lower()

    # Check if demo user already exists
    existing_user = db.query(User).filter(User.wallet_address == wallet).first()

    if existing_user:
        return DemoUserResponse(
            user=build_user_response(existing_user),
            message="Demo user already exists",
            created=False
        )

    # Create new demo user
    demo_user = User(
        wallet_address=wallet,
        username=demo_data.username,
        reputation_score=demo_data.reputation_score
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)

    return DemoUserResponse(
        user=build_user_response(demo_user),
        message="Demo user created successfully",
        created=True
    )


@router.post("/seed-demo-ownership", response_model=DemoOwnershipResponse)
def seed_demo_ownership(
    ownership_data: DemoOwnershipCreate,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """
    Seed demo user with flag ownerships for testing.

    Assigns ownership of various flags to the specified user.
    This creates FlagOwnership records and updates flag statuses.
    """
    # Verify user exists
    user = db.query(User).filter(User.id == ownership_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {ownership_data.user_id} not found"
        )

    # Map category strings to enums
    category_map = {
        "standard": FlagCategory.STANDARD,
        "plus": FlagCategory.PLUS,
        "premium": FlagCategory.PREMIUM
    }

    categories = [
        category_map.get(cat.lower())
        for cat in ownership_data.include_categories
        if cat.lower() in category_map
    ]

    if not categories:
        categories = [FlagCategory.STANDARD, FlagCategory.PLUS, FlagCategory.PREMIUM]

    # Get flags that aren't already owned by this user
    owned_flag_ids = [o.flag_id for o in user.ownerships]

    # Query available flags
    available_flags = db.query(Flag).filter(
        Flag.category.in_(categories),
        ~Flag.id.in_(owned_flag_ids) if owned_flag_ids else True
    ).limit(ownership_data.flag_count * 2).all()  # Get extra to account for filtering

    if not available_flags:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No available flags found to assign ownership"
        )

    # Assign ownership to flags
    flags_owned = []
    ownerships_created = 0

    for flag in available_flags[:ownership_data.flag_count]:
        # Create first NFT ownership
        first_ownership = FlagOwnership(
            user_id=user.id,
            flag_id=flag.id,
            ownership_type=OwnershipType.FIRST,
            transaction_hash=f"0xDEMO{'0' * 58}{flag.id:04d}"  # Demo transaction hash
        )
        db.add(first_ownership)
        flag.first_nft_status = "claimed"
        ownerships_created += 1

        # 50% chance to also give second NFT (complete pair)
        if random.random() > 0.5:
            second_ownership = FlagOwnership(
                user_id=user.id,
                flag_id=flag.id,
                ownership_type=OwnershipType.SECOND,
                transaction_hash=f"0xDEMO{'1' * 58}{flag.id:04d}"
            )
            db.add(second_ownership)
            flag.second_nft_status = "purchased"
            flag.is_pair_complete = True
            ownerships_created += 1

        flags_owned.append(flag.id)

    db.commit()

    return DemoOwnershipResponse(
        ownerships_created=ownerships_created,
        flags_owned=flags_owned,
        message=f"Successfully assigned ownership of {len(flags_owned)} flags to user {user.username or user.wallet_address}"
    )


@router.get("/demo-user", response_model=DemoUserResponse)
def get_demo_user(
    wallet_address: str = "0xdemo000000000000000000000000000000000001",
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """
    Get the demo user by wallet address.

    Returns the demo user details if exists.
    """
    wallet = wallet_address.lower()
    user = db.query(User).filter(User.wallet_address == wallet).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo user not found. Create one first with POST /admin/create-demo-user"
        )

    return DemoUserResponse(
        user=build_user_response(user),
        message="Demo user retrieved successfully",
        created=False
    )


@router.delete("/demo-user", response_model=MessageResponse)
def delete_demo_user(
    wallet_address: str = "0xdemo000000000000000000000000000000000001",
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """
    Delete the demo user and all associated data.

    This removes:
    - All flag ownerships
    - All flag interests
    - All bids
    - All auctions created by demo user
    - The demo user record
    """
    wallet = wallet_address.lower()
    user = db.query(User).filter(User.wallet_address == wallet).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo user not found"
        )

    # Reset flag statuses for owned flags
    for ownership in user.ownerships:
        flag = ownership.flag
        if ownership.ownership_type == OwnershipType.FIRST:
            flag.first_nft_status = "available"
        else:
            flag.second_nft_status = "available"
        flag.is_pair_complete = False

    # Delete user (cascades to interests, ownerships, bids)
    db.delete(user)
    db.commit()

    return MessageResponse(message=f"Demo user {wallet} deleted successfully")


# =============================================================================
# COORDINATE TO NFT GENERATION
# =============================================================================

@router.post("/nft-from-coordinates", response_model=CoordinateNFTResponse)
async def create_nft_from_coordinates(
    nft_data: CoordinateNFTCreate,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """
    Generate an NFT from geographic coordinates.

    This endpoint orchestrates the full NFT generation pipeline:
    1. Validate coordinates and municipality
    2. Search for location image using SerpAPI Google Images
    3. Use the image directly (no AI transformation needed)
    4. Upload image to IPFS via Pinata
    5. Generate and upload metadata to IPFS
    6. Calculate SHA-256 hash for integrity verification
    7. Create Flag record in database

    Args:
        nft_data: Coordinate and flag configuration

    Returns:
        CoordinateNFTResponse with created flag details
    """
    # Import services (lazy import to avoid circular dependencies)
    from services.serpapi import search_images, get_image_bytes, SerpAPIError
    from services.ipfs import upload_image, upload_metadata, generate_metadata, calculate_content_hash, IPFSError

    # Step 1: Validate municipality exists
    municipality = db.query(Municipality).filter(Municipality.id == nft_data.municipality_id).first()
    if not municipality:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Municipality with id {nft_data.municipality_id} not found"
        )

    # Get region and country for metadata
    region = municipality.region
    country = region.country

    # Step 2: Generate flag name
    coordinates_str = f"{nft_data.latitude:.6f}, {nft_data.longitude:.6f}"
    flag_name = nft_data.custom_name or f"{municipality.name} {nft_data.location_type} ({coordinates_str})"

    # Check if flag with same name already exists
    existing_flag = db.query(Flag).filter(Flag.name == flag_name).first()
    if existing_flag:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Flag with name '{flag_name}' already exists"
        )

    try:
        # Step 3: Search for location image using SerpAPI Google Images
        try:
            # Build search query for the location
            search_query = f"{municipality.name} {nft_data.location_type} {country.name} building landmark"

            # Search for images
            images = await search_images(query=search_query, limit=5)

            if not images:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"No images found for: {search_query}"
                )

            # Download the first available image
            flag_image = None
            for img in images:
                try:
                    image_url = img.get("original") or img.get("url") or img.get("thumbnail")
                    if image_url:
                        flag_image = await get_image_bytes(image_url)
                        if flag_image:
                            break
                except Exception:
                    continue

            if not flag_image:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not download any images from search results"
                )

        except SerpAPIError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SerpAPI image search failed: {str(e)}"
            )

        # Step 4: Image is ready to use (no AI transformation - using SerpAPI image directly)

        # Step 5: Upload image to IPFS
        try:
            image_ipfs_hash = await upload_image(
                image_bytes=flag_image,
                name=f"flag_{municipality.name}_{nft_data.location_type}",
                metadata={
                    "municipality": municipality.name,
                    "location_type": nft_data.location_type,
                    "coordinates": coordinates_str
                }
            )
        except IPFSError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image to IPFS: {str(e)}"
            )

        # Step 6: Generate and upload metadata
        # Determine price based on category
        category_prices = {
            FlagCategory.STANDARD: settings.default_standard_price,
            FlagCategory.PLUS: settings.default_plus_price,
            FlagCategory.PREMIUM: settings.default_premium_price
        }
        price = Decimal(str(category_prices.get(nft_data.category, settings.default_standard_price)))

        # Create flag record first to get ID
        flag = Flag(
            municipality_id=nft_data.municipality_id,
            name=flag_name,
            location_type=nft_data.location_type,
            category=nft_data.category,
            nfts_required=nft_data.nfts_required,
            image_ipfs_hash=image_ipfs_hash,
            price=price
        )
        db.add(flag)
        db.flush()  # Get the ID without committing

        # Generate metadata
        metadata = generate_metadata(
            flag_name=flag_name,
            location_type=nft_data.location_type,
            category=nft_data.category.value,
            nfts_required=nft_data.nfts_required,
            coordinates=coordinates_str,
            image_ipfs_hash=image_ipfs_hash,
            country_name=country.name,
            region_name=region.name,
            municipality_name=municipality.name,
            flag_id=flag.id
        )

        # Calculate SHA-256 hash of metadata for integrity verification
        metadata_hash = calculate_content_hash(metadata)

        try:
            metadata_ipfs_hash = await upload_metadata(
                metadata=metadata,
                name=f"flag_{flag.id}_metadata"
            )
        except IPFSError as e:
            # Rollback the flag creation
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload metadata to IPFS: {str(e)}"
            )

        # Step 7: Update flag with metadata hashes
        flag.metadata_ipfs_hash = metadata_ipfs_hash
        flag.metadata_hash = metadata_hash
        db.commit()
        db.refresh(flag)

        # Step 8: Register flag on blockchain using Hardhat script
        import subprocess
        import os

        contracts_dir = Path(__file__).parent.parent.parent / "contracts"
        env = os.environ.copy()

        # Update the register-flag.js script with the new flag ID
        register_script = contracts_dir / "scripts" / "register-flag.js"
        if register_script.exists():
            # Read and update the FLAG_ID in the script
            script_content = register_script.read_text()
            # Replace FLAG_ID = XX with the new flag ID
            import re
            updated_content = re.sub(
                r'const FLAG_ID = \d+;',
                f'const FLAG_ID = {flag.id};',
                script_content
            )
            # Also update category
            category_map = {"standard": 0, "plus": 1, "premium": 2}
            category_int = category_map.get(nft_data.category.value.lower(), 0)
            updated_content = re.sub(
                r'const CATEGORY = \d+;',
                f'const CATEGORY = {category_int};',
                updated_content
            )
            register_script.write_text(updated_content)

            try:
                # Run the hardhat script
                result = subprocess.run(
                    ["npx", "hardhat", "run", "scripts/register-flag.js", "--network", "amoy"],
                    cwd=str(contracts_dir),
                    capture_output=True,
                    text=True,
                    timeout=120,
                    env=env
                )
                if result.returncode == 0:
                    print(f"Successfully registered flag {flag.id} on blockchain")
                else:
                    print(f"Failed to register flag {flag.id}: {result.stderr}")
            except subprocess.TimeoutExpired:
                print(f"Blockchain registration timed out for flag {flag.id}")
            except Exception as e:
                print(f"Error running blockchain registration: {e}")

        return CoordinateNFTResponse(
            flag_id=flag.id,
            flag_name=flag.name,
            image_ipfs_hash=image_ipfs_hash,
            metadata_ipfs_hash=metadata_ipfs_hash,
            metadata_hash=metadata_hash,
            coordinates=coordinates_str,
            message=f"Successfully created NFT flag '{flag_name}' from coordinates"
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during NFT generation: {str(e)}"
        )


@router.post("/check-image-availability", response_model=MessageResponse)
async def check_image_availability(
    latitude: float,
    longitude: float,
    location_type: str = "landmark",
    _: bool = Depends(verify_admin)
):
    """
    Check if images are available for a location using SerpAPI.

    Useful for validating coordinates before attempting full NFT generation.
    """
    from services.serpapi import search_images, SerpAPIError

    try:
        # Build a generic search query
        search_query = f"{location_type} near {latitude},{longitude}"
        images = await search_images(query=search_query, limit=1)

        if images:
            return MessageResponse(
                message=f"Images available for location ({latitude}, {longitude}). Found {len(images)} result(s)."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No images found for location ({latitude}, {longitude})"
            )
    except SerpAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SerpAPI error: {str(e)}"
        )


# Keep old endpoint name for backwards compatibility
@router.post("/check-street-view", response_model=ImagePreviewResponse)
async def check_street_view_availability(
    latitude: float,
    longitude: float,
    location_type: Optional[str] = None,
    _: bool = Depends(verify_admin)
):
    """
    Check for available images at coordinates and return preview images.
    Uses SerpAPI to search for images based on coordinates.

    Returns up to 5 preview images that can be used for NFT generation.
    """
    from services.serpapi import search_images, SerpAPIError

    try:
        # Build search query - use location_type if provided for better results
        if location_type:
            search_query = f"{location_type} {latitude} {longitude}"
        else:
            search_query = f"landmark building {latitude} {longitude}"

        images = await search_images(query=search_query, limit=5)

        if images:
            # Convert to response format
            image_items = [
                ImagePreviewItem(
                    url=img.get("url", ""),
                    thumbnail=img.get("thumbnail", ""),
                    title=img.get("title", ""),
                    source=img.get("source", "")
                )
                for img in images
                if img.get("url") or img.get("thumbnail")
            ]

            return ImagePreviewResponse(
                message=f"Found {len(image_items)} images at ({latitude}, {longitude})",
                success=True,
                images=image_items
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No images found at ({latitude}, {longitude}). Try using /serpapi/images with a specific search query."
            )
    except SerpAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SerpAPI error: {str(e)}"
        )


# =============================================================================
# SERPAPI LOCATION DISCOVERY ENDPOINTS (ADMIN ONLY)
# =============================================================================

@router.get("/serpapi/test")
async def test_serpapi_connection(
    _: bool = Depends(verify_admin)
):
    """
    Test the SerpAPI connection.

    Returns connection status and a test geocoding result.
    """
    from services.serpapi import test_serpapi_connection as test_connection

    result = await test_connection()
    return result


@router.get("/serpapi/discover")
async def discover_locations(
    query: str,
    latitude: float,
    longitude: float,
    zoom: int = 14,
    limit: int = 10,
    _: bool = Depends(verify_admin)
):
    """
    Discover locations using SerpAPI Google Maps search.

    ADMIN ONLY - Used to find real locations for creating flag NFTs.

    DATA FLOW (following overview/rule.md):
    - INPUT: query (str), latitude (float), longitude (float)
    - OUTPUT: List of locations with title (str), latitude (float), longitude (float)
    - These map directly to Flag.name and Municipality coordinates

    Args:
        query: Search term (e.g., "Town Hall", "Fire Station")
        latitude: Center latitude for search area
        longitude: Center longitude for search area
        zoom: Map zoom level (1-20, higher = more local results)
        limit: Maximum number of results

    Returns:
        List of discovered locations with coordinates
    """
    from services.serpapi import discover_locations as serpapi_discover, SerpAPIError

    try:
        locations = await serpapi_discover(
            query=query,
            latitude=latitude,
            longitude=longitude,
            zoom=zoom,
            limit=limit
        )

        return {
            "query": query,
            "center": {"latitude": latitude, "longitude": longitude},
            "count": len(locations),
            "locations": locations
        }

    except SerpAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/serpapi/geocode")
async def geocode_address(
    address: str,
    _: bool = Depends(verify_admin)
):
    """
    Geocode an address to get GPS coordinates.

    ADMIN ONLY - Used to get coordinates for a city or location.

    DATA FLOW (following overview/rule.md):
    - INPUT: address (str)
    - OUTPUT: latitude (float), longitude (float)
    - Maps directly to Municipality(latitude=Float, longitude=Float)

    Args:
        address: Address or place name (e.g., "Barcelona, Spain")

    Returns:
        GPS coordinates for the address
    """
    from services.serpapi import geocode_location, SerpAPIError

    try:
        result = await geocode_location(address)

        if result:
            return {
                "address": address,
                "latitude": result["latitude"],
                "longitude": result["longitude"],
                "success": True
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not geocode address: {address}"
            )

    except SerpAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/serpapi/discover-municipality")
async def discover_municipality_locations(
    municipality_name: str,
    country_name: str,
    location_types: Optional[str] = None,
    _: bool = Depends(verify_admin)
):
    """
    Discover multiple location types for a municipality.

    ADMIN ONLY - Discovers various landmarks in a municipality for NFT creation.

    DATA FLOW (following overview/rule.md):
    - INPUT: municipality_name (str), country_name (str)
    - OUTPUT: Dictionary of location_type -> list of locations
    - Each location contains: title (str), latitude (float), longitude (float)

    Args:
        municipality_name: Name of the municipality (e.g., "Barcelona")
        country_name: Name of the country (e.g., "Spain")
        location_types: Comma-separated list of types to search
                       (e.g., "Town Hall,Fire Station,Church")
                       Default: standard game types

    Returns:
        Dictionary mapping location type to discovered locations

    Example Response:
        {
            "municipality": "Barcelona",
            "country": "Spain",
            "results": {
                "Town Hall": [{"title": "Ajuntament...", "latitude": 41.38, ...}],
                "Fire Station": [...],
                ...
            }
        }
    """
    from services.serpapi import discover_locations_for_municipality, SerpAPIError

    # Parse location_types if provided
    types_list = None
    if location_types:
        types_list = [t.strip() for t in location_types.split(",")]

    try:
        results = await discover_locations_for_municipality(
            municipality_name=municipality_name,
            country_name=country_name,
            location_types=types_list
        )

        # Count total locations found
        total_found = sum(len(locs) for locs in results.values())

        return {
            "municipality": municipality_name,
            "country": country_name,
            "total_locations_found": total_found,
            "results": results
        }

    except SerpAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/serpapi/place-photos")
async def get_place_photos(
    place_id: str,
    limit: int = 5,
    _: bool = Depends(verify_admin)
):
    """
    Get photos for a place using its Google place_id.

    ADMIN ONLY - Used to get reference images for flag generation.

    Args:
        place_id: Google place ID from discovery results
        limit: Maximum number of photos to return

    Returns:
        List of photo URLs
    """
    from services.serpapi import get_place_photos as fetch_photos, SerpAPIError

    try:
        photos = await fetch_photos(place_id=place_id, limit=limit)

        return {
            "place_id": place_id,
            "count": len(photos),
            "photos": photos
        }

    except SerpAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/serpapi/images")
async def search_images_endpoint(
    query: str,
    limit: int = 5,
    _: bool = Depends(verify_admin)
):
    """
    Search for images using SerpAPI Google Images.

    ADMIN ONLY - Used to find reference images for AI flag generation.

    Args:
        query: Search query (e.g., "Barcelona Town Hall building")
        limit: Maximum number of images to return

    Returns:
        List of images with URLs and metadata
    """
    from services.serpapi import search_images, SerpAPIError

    try:
        images = await search_images(query=query, limit=limit)

        return {
            "query": query,
            "count": len(images),
            "images": images
        }

    except SerpAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/serpapi/generate-flag-from-image")
async def generate_flag_from_serpapi_image(
    image_url: str,
    flag_name: str,
    location_type: str = "Landmark",
    _: bool = Depends(verify_admin)
):
    """
    Download a flag image from a SerpAPI image URL.

    ADMIN ONLY - Downloads the image for use as flag artwork.

    Flow:
    1. Download image from URL (from SerpAPI search results)
    2. Return the image as base64 (ready for IPFS upload)

    Args:
        image_url: URL of the source image (from /serpapi/images results)
        flag_name: Name for the flag
        location_type: Type of location (e.g., "Town Hall", "Church")

    Returns:
        Downloaded image as base64 and metadata
    """
    from services.serpapi import get_image_bytes, SerpAPIError
    import base64

    try:
        # 1. Download the source image
        image_bytes = await get_image_bytes(image_url)

        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not download image from URL"
            )

        # 2. Return as base64 (no AI transformation - using image directly)
        flag_base64 = base64.b64encode(image_bytes).decode("utf-8")

        return {
            "success": True,
            "flag_name": flag_name,
            "location_type": location_type,
            "source_url": image_url,
            "flag_image_base64": flag_base64,
            "image_size_bytes": len(image_bytes),
            "message": "Image downloaded successfully. Use this base64 to upload to IPFS."
        }

    except SerpAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to download image: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image: {str(e)}"
        )
