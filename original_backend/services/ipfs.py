"""
IPFS Service using Pinata.

Handles uploading images and metadata to IPFS via Pinata.
"""
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional
import httpx
from config import settings


class IPFSError(Exception):
    """Raised when IPFS operations fail."""
    pass


PINATA_API_URL = "https://api.pinata.cloud"


def _get_pinata_headers() -> Dict[str, str]:
    """Get authentication headers for Pinata API."""
    if settings.pinata_jwt:
        return {
            "Authorization": f"Bearer {settings.pinata_jwt}",
        }
    elif settings.pinata_api_key and settings.pinata_api_secret:
        return {
            "pinata_api_key": settings.pinata_api_key,
            "pinata_secret_api_key": settings.pinata_api_secret,
        }
    else:
        raise IPFSError(
            "Pinata credentials not configured. "
            "Set PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET environment variables."
        )


async def upload_image(
    image_bytes: bytes,
    name: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Upload an image to IPFS via Pinata.

    Args:
        image_bytes: Image data as bytes
        name: Name for the file (will be sanitized)
        metadata: Optional Pinata metadata

    Returns:
        str: IPFS hash (CID) of the uploaded image

    Raises:
        IPFSError: If upload fails
    """
    url = f"{PINATA_API_URL}/pinning/pinFileToIPFS"

    headers = _get_pinata_headers()

    # Sanitize filename
    safe_name = "".join(c for c in name if c.isalnum() or c in "._- ")[:100]
    if not safe_name.endswith((".png", ".jpg", ".jpeg", ".gif")):
        safe_name = f"{safe_name}.png"

    # Prepare multipart form data
    files = {
        "file": (safe_name, image_bytes, "image/png"),
    }

    # Pinata metadata
    pinata_metadata = {
        "name": safe_name,
        "keyvalues": metadata or {},
    }

    data = {
        "pinataMetadata": json.dumps(pinata_metadata),
        "pinataOptions": json.dumps({"cidVersion": 1}),
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, files=files, data=data)
            response.raise_for_status()

            result = response.json()
            ipfs_hash = result.get("IpfsHash")

            if not ipfs_hash:
                raise IPFSError("No IPFS hash returned from Pinata")

            return ipfs_hash

    except httpx.HTTPStatusError as e:
        error_detail = ""
        try:
            error_detail = e.response.json().get("error", {}).get("message", "")
        except Exception:
            pass
        raise IPFSError(f"Pinata HTTP error: {e.response.status_code} - {error_detail}")
    except httpx.RequestError as e:
        raise IPFSError(f"Network error uploading to Pinata: {str(e)}")


async def upload_metadata(
    metadata: Dict[str, Any],
    name: str,
) -> str:
    """
    Upload JSON metadata to IPFS via Pinata.

    Args:
        metadata: Metadata dictionary (will be converted to JSON)
        name: Name for the metadata file

    Returns:
        str: IPFS hash (CID) of the uploaded metadata

    Raises:
        IPFSError: If upload fails
    """
    url = f"{PINATA_API_URL}/pinning/pinJSONToIPFS"

    headers = _get_pinata_headers()
    headers["Content-Type"] = "application/json"

    # Sanitize name
    safe_name = "".join(c for c in name if c.isalnum() or c in "._- ")[:100]

    payload = {
        "pinataContent": metadata,
        "pinataMetadata": {
            "name": f"{safe_name}_metadata.json",
        },
        "pinataOptions": {
            "cidVersion": 1,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()

            result = response.json()
            ipfs_hash = result.get("IpfsHash")

            if not ipfs_hash:
                raise IPFSError("No IPFS hash returned from Pinata")

            return ipfs_hash

    except httpx.HTTPStatusError as e:
        raise IPFSError(f"Pinata HTTP error: {e.response.status_code}")
    except httpx.RequestError as e:
        raise IPFSError(f"Network error: {str(e)}")


def generate_metadata(
    flag_name: str,
    location_type: str,
    category: str,
    nfts_required: int,
    coordinates: str,
    image_ipfs_hash: str,
    country_name: str,
    region_name: str,
    municipality_name: str,
    flag_id: Optional[int] = None,
    external_url_base: Optional[str] = None,
    telegram_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate NFT metadata following OpenSea/ERC-721 standards.

    Args:
        flag_name: Name of the flag
        location_type: Type of location (e.g., "Town Hall")
        category: Flag category (Standard, Plus, Premium)
        nfts_required: Number of NFTs required
        coordinates: Lat,Lon coordinates string
        image_ipfs_hash: IPFS hash of the image
        country_name: Name of the country
        region_name: Name of the region
        municipality_name: Name of the municipality
        flag_id: Database ID of the flag (optional)
        external_url_base: Base URL for external link (defaults to config)
        telegram_url: Telegram community group URL (defaults to config)

    Returns:
        Dict containing ERC-721 compatible metadata
    """
    # Use config defaults if not provided
    if external_url_base is None:
        external_url_base = settings.project_website_url
    if telegram_url is None:
        telegram_url = settings.telegram_group_url

    metadata = {
        "name": flag_name,
        "description": (
            f"Official municipal flag representing the {location_type} of {municipality_name}. "
            f"This NFT is part of the Municipal Flag NFT Game collection. "
            f"Join our community: {telegram_url}"
        ),
        "image": f"ipfs://{image_ipfs_hash}",
        "external_url": f"{external_url_base}/flags/{flag_id}" if flag_id else external_url_base,
        "attributes": [
            {
                "trait_type": "Country",
                "value": country_name,
            },
            {
                "trait_type": "Region",
                "value": region_name,
            },
            {
                "trait_type": "Municipality",
                "value": municipality_name,
            },
            {
                "trait_type": "Location Type",
                "value": location_type,
            },
            {
                "trait_type": "Category",
                "value": category,
            },
            {
                "display_type": "number",
                "trait_type": "NFTs Required",
                "value": nfts_required,
            },
            {
                "trait_type": "Coordinates",
                "value": coordinates,
            },
        ],
        "properties": {
            "category": category,
            "nfts_required": nfts_required,
            "created_at": datetime.utcnow().isoformat(),
            "community": {
                "telegram": telegram_url,
            },
        },
    }

    return metadata


def calculate_content_hash(data: Any) -> str:
    """
    Calculate SHA-256 hash of content.

    Args:
        data: Data to hash (will be JSON serialized if dict)

    Returns:
        str: Hex-encoded SHA-256 hash
    """
    if isinstance(data, dict):
        # Sort keys for consistent hashing
        content = json.dumps(data, sort_keys=True, separators=(",", ":")).encode("utf-8")
    elif isinstance(data, str):
        content = data.encode("utf-8")
    elif isinstance(data, bytes):
        content = data
    else:
        content = str(data).encode("utf-8")

    return hashlib.sha256(content).hexdigest()


def get_ipfs_url(ipfs_hash: str) -> str:
    """
    Get the full IPFS gateway URL for a hash.

    Args:
        ipfs_hash: IPFS CID

    Returns:
        str: Full gateway URL
    """
    gateway = settings.react_app_ipfs_gateway or "https://gateway.pinata.cloud/ipfs"
    return f"{gateway}/{ipfs_hash}"


async def test_pinata_connection() -> Dict[str, Any]:
    """
    Test the connection to Pinata API.

    Returns:
        Dict with connection status and account info
    """
    url = f"{PINATA_API_URL}/data/testAuthentication"

    try:
        headers = _get_pinata_headers()
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            return {
                "status": "connected",
                "message": response.json().get("message", "OK"),
            }

    except IPFSError as e:
        return {
            "status": "error",
            "message": str(e),
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Connection failed: {str(e)}",
        }
