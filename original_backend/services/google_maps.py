"""
Google Maps / Street View Service.

Fetches Street View images from coordinates for NFT generation.
"""
import httpx
from typing import Optional, Tuple
from config import settings


class StreetViewError(Exception):
    """Raised when Street View image cannot be fetched."""
    pass


async def get_street_view_image(
    latitude: float,
    longitude: float,
    heading: Optional[int] = None,
    pitch: int = 0,
) -> bytes:
    """
    Fetch a Street View image for the given coordinates.

    Args:
        latitude: Latitude of the location (-90 to 90)
        longitude: Longitude of the location (-180 to 180)
        heading: Camera heading (0-360, None = auto)
        pitch: Camera pitch (-90 to 90, 0 = level)

    Returns:
        bytes: The image data as bytes (JPEG format)

    Raises:
        StreetViewError: If image cannot be fetched
        ValueError: If coordinates are invalid
    """
    # Validate coordinates
    if not -90 <= latitude <= 90:
        raise ValueError(f"Invalid latitude: {latitude}. Must be between -90 and 90.")
    if not -180 <= longitude <= 180:
        raise ValueError(f"Invalid longitude: {longitude}. Must be between -180 and 180.")

    # Check API key
    if not settings.google_maps_api_key:
        raise StreetViewError("Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY environment variable.")

    # Build request parameters
    params = {
        "size": settings.street_view_image_size,
        "location": f"{latitude},{longitude}",
        "fov": settings.street_view_fov,
        "pitch": pitch,
        "key": settings.google_maps_api_key,
    }

    if heading is not None:
        params["heading"] = heading

    # Street View Static API endpoint
    url = "https://maps.googleapis.com/maps/api/streetview"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # First, check if Street View imagery is available at this location
            metadata_url = f"{url}/metadata"
            metadata_response = await client.get(metadata_url, params=params)
            metadata_response.raise_for_status()

            metadata = metadata_response.json()
            if metadata.get("status") != "OK":
                raise StreetViewError(
                    f"No Street View imagery available at coordinates ({latitude}, {longitude}). "
                    f"Status: {metadata.get('status', 'Unknown')}"
                )

            # Fetch the actual image
            image_response = await client.get(url, params=params)
            image_response.raise_for_status()

            # Verify we got an image (not an error page)
            content_type = image_response.headers.get("content-type", "")
            if "image" not in content_type:
                raise StreetViewError(
                    f"Unexpected response type: {content_type}. "
                    "Street View may not be available at this location."
                )

            return image_response.content

    except httpx.HTTPStatusError as e:
        raise StreetViewError(f"HTTP error fetching Street View: {e.response.status_code}")
    except httpx.RequestError as e:
        raise StreetViewError(f"Network error fetching Street View: {str(e)}")


async def check_street_view_availability(latitude: float, longitude: float) -> Tuple[bool, dict]:
    """
    Check if Street View imagery is available at the given coordinates.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location

    Returns:
        Tuple[bool, dict]: (is_available, metadata)
    """
    if not settings.google_maps_api_key:
        return False, {"error": "Google Maps API key not configured"}

    params = {
        "location": f"{latitude},{longitude}",
        "key": settings.google_maps_api_key,
    }

    url = "https://maps.googleapis.com/maps/api/streetview/metadata"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            metadata = response.json()

            is_available = metadata.get("status") == "OK"
            return is_available, metadata

    except Exception as e:
        return False, {"error": str(e)}


def get_panorama_headings(count: int = 4) -> list:
    """
    Generate evenly spaced heading angles for panoramic captures.

    Args:
        count: Number of images to capture

    Returns:
        List of heading angles (0-360)
    """
    return [int(360 / count * i) for i in range(count)]
