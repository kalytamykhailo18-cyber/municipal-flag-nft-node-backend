"""
SerpAPI Location Discovery Service.

ADMIN ONLY - Used to discover real locations (municipalities, landmarks) for flag generation.
This service queries Google Maps via SerpAPI to find locations with coordinates.

DATA FLOW (following overview/rule.md):
- SerpAPI returns: latitude (float), longitude (float), title (str), place_id (str)
- These map to Database: Municipality(latitude=Float, longitude=Float), Flag(name=str)
- No type conversion needed between SerpAPI and Database for these fields
"""
import httpx
from typing import Dict, Any, List, Optional
from config import settings


class SerpAPIError(Exception):
    """Raised when SerpAPI operations fail."""
    pass


SERPAPI_BASE_URL = "https://serpapi.com/search.json"


async def discover_locations(
    query: str,
    latitude: float,
    longitude: float,
    zoom: int = 14,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Discover locations using SerpAPI Google Maps search.

    ADMIN ONLY - This function is used by administrators to discover
    real locations for creating flag NFTs.

    Args:
        query: Search query (e.g., "Town Hall", "Fire Station", "Bakery")
        latitude: Center latitude for search
        longitude: Center longitude for search
        zoom: Map zoom level (1-20, higher = more local)
        limit: Maximum number of results to return

    Returns:
        List of location dictionaries with:
        - title: str - Location name
        - latitude: float - GPS latitude
        - longitude: float - GPS longitude
        - place_id: str - Google place ID
        - address: str - Full address (optional)
        - type: str - Location type from query

    DATA TYPE MAPPING (SerpAPI -> Database):
    - title (str) -> Flag.name (String)
    - latitude (float) -> Municipality.latitude (Float)
    - longitude (float) -> Municipality.longitude (Float)
    - place_id (str) -> stored for reference

    Raises:
        SerpAPIError: If API call fails or key not configured
    """
    # Validate API key
    if not settings.serpapi_api_key:
        raise SerpAPIError(
            "SerpAPI key not configured. "
            "Set SERPAPI_API_KEY environment variable."
        )

    # Validate coordinates
    if not -90 <= latitude <= 90:
        raise ValueError(f"Invalid latitude: {latitude}. Must be between -90 and 90.")
    if not -180 <= longitude <= 180:
        raise ValueError(f"Invalid longitude: {longitude}. Must be between -180 and 180.")

    # Build request parameters for Google Maps search
    params = {
        "engine": "google_maps",
        "q": query,
        "ll": f"@{latitude},{longitude},{zoom}z",
        "api_key": settings.serpapi_api_key,
        "type": "search",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(SERPAPI_BASE_URL, params=params)
            response.raise_for_status()

            data = response.json()

            # Check for API errors
            if "error" in data:
                raise SerpAPIError(f"SerpAPI error: {data['error']}")

            # Extract local results
            local_results = data.get("local_results", [])

            if not local_results:
                # Try place_results as fallback
                local_results = data.get("place_results", [])

            if not local_results:
                return []

            # Process and normalize results
            locations = []
            for result in local_results[:limit]:
                # Extract GPS coordinates
                gps = result.get("gps_coordinates", {})
                lat = gps.get("latitude")
                lon = gps.get("longitude")

                if lat is None or lon is None:
                    continue  # Skip results without coordinates

                location = {
                    "title": result.get("title", "Unknown Location"),
                    "latitude": float(lat),  # Ensure float type
                    "longitude": float(lon),  # Ensure float type
                    "place_id": result.get("place_id", ""),
                    "address": result.get("address", ""),
                    "type": query,  # Store the search query as type
                    "rating": result.get("rating"),
                    "reviews": result.get("reviews"),
                    "thumbnail": result.get("thumbnail"),
                }
                locations.append(location)

            return locations

    except httpx.HTTPStatusError as e:
        raise SerpAPIError(f"HTTP error from SerpAPI: {e.response.status_code}")
    except httpx.RequestError as e:
        raise SerpAPIError(f"Network error connecting to SerpAPI: {str(e)}")


async def discover_locations_for_municipality(
    municipality_name: str,
    country_name: str,
    location_types: Optional[List[str]] = None,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Discover multiple location types for a municipality.

    ADMIN ONLY - Discovers various landmarks and buildings in a municipality.

    Args:
        municipality_name: Name of the municipality (e.g., "Barcelona")
        country_name: Name of the country (e.g., "Spain")
        location_types: List of location types to search for.
                       Defaults to standard flag types.

    Returns:
        Dictionary mapping location_type to list of discovered locations

    Example:
        results = await discover_locations_for_municipality(
            "Barcelona", "Spain",
            ["Town Hall", "Fire Station", "Church"]
        )
        # Returns:
        # {
        #     "Town Hall": [{"title": "Ajuntament de Barcelona", "latitude": 41.382, ...}],
        #     "Fire Station": [...],
        #     "Church": [...]
        # }
    """
    # Default location types matching the game's flag categories
    if location_types is None:
        location_types = [
            "Town Hall",      # Premium - requires 3 NFTs
            "Fire Station",   # Standard
            "Bakery",         # Standard
            "Church",         # Plus
            "Market Square",  # Standard
            "Fountain",       # Standard
            "Bridge",         # Plus/Standard
            "Park",           # Standard
        ]

    # First, geocode the municipality to get center coordinates
    center = await geocode_location(f"{municipality_name}, {country_name}")

    if not center:
        raise SerpAPIError(
            f"Could not geocode municipality: {municipality_name}, {country_name}"
        )

    # Discover each location type
    results = {}
    for location_type in location_types:
        query = f"{location_type} {municipality_name}"
        try:
            locations = await discover_locations(
                query=query,
                latitude=center["latitude"],
                longitude=center["longitude"],
                zoom=14,
                limit=3,  # Get top 3 for each type
            )
            results[location_type] = locations
        except SerpAPIError as e:
            # Log error but continue with other types
            results[location_type] = []
            print(f"Warning: Failed to discover {location_type}: {e}")

    return results


async def geocode_location(address: str) -> Optional[Dict[str, float]]:
    """
    Geocode an address to get coordinates using SerpAPI.

    Args:
        address: Address or place name to geocode

    Returns:
        Dictionary with latitude and longitude, or None if not found

    DATA TYPE MAPPING:
    - Returns: {"latitude": float, "longitude": float}
    - Maps directly to Database: Municipality(latitude, longitude)
    """
    if not settings.serpapi_api_key:
        raise SerpAPIError("SerpAPI key not configured")

    params = {
        "engine": "google_maps",
        "q": address,
        "api_key": settings.serpapi_api_key,
        "type": "search",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(SERPAPI_BASE_URL, params=params)
            response.raise_for_status()

            data = response.json()

            # Try to get coordinates from various response fields
            # 1. Check place_results
            place = data.get("place_results", {})
            gps = place.get("gps_coordinates", {})
            if gps.get("latitude") and gps.get("longitude"):
                return {
                    "latitude": float(gps["latitude"]),
                    "longitude": float(gps["longitude"]),
                }

            # 2. Check first local_result
            local = data.get("local_results", [])
            if local:
                gps = local[0].get("gps_coordinates", {})
                if gps.get("latitude") and gps.get("longitude"):
                    return {
                        "latitude": float(gps["latitude"]),
                        "longitude": float(gps["longitude"]),
                    }

            # 3. Check search_information for map center
            search_info = data.get("search_information", {})
            if "local_map" in search_info:
                local_map = search_info["local_map"]
                gps = local_map.get("gps_coordinates", {})
                if gps.get("latitude") and gps.get("longitude"):
                    return {
                        "latitude": float(gps["latitude"]),
                        "longitude": float(gps["longitude"]),
                    }

            return None

    except Exception as e:
        print(f"Geocoding error: {e}")
        return None


async def get_place_photos(place_id: str, limit: int = 5) -> List[str]:
    """
    Get photos for a place using SerpAPI.

    ADMIN ONLY - Used to get reference images for flag generation.

    Args:
        place_id: Google place ID
        limit: Maximum number of photos to return

    Returns:
        List of photo URLs
    """
    if not settings.serpapi_api_key:
        raise SerpAPIError("SerpAPI key not configured")

    if not place_id:
        return []

    params = {
        "engine": "google_maps_photos",
        "data_id": place_id,
        "api_key": settings.serpapi_api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(SERPAPI_BASE_URL, params=params)
            response.raise_for_status()

            data = response.json()
            photos = data.get("photos", [])

            # Extract photo URLs
            urls = []
            for photo in photos[:limit]:
                if "image" in photo:
                    urls.append(photo["image"])
                elif "thumbnail" in photo:
                    urls.append(photo["thumbnail"])

            return urls

    except Exception as e:
        print(f"Error fetching photos: {e}")
        return []


async def search_images(
    query: str,
    limit: int = 5,
) -> List[Dict[str, str]]:
    """
    Search for images using SerpAPI Google Images.

    ADMIN ONLY - Used to find reference images for AI flag generation.

    Args:
        query: Search query (e.g., "Barcelona Town Hall building")
        limit: Maximum number of images to return

    Returns:
        List of image dictionaries with:
        - url: str - Full resolution image URL
        - thumbnail: str - Thumbnail URL
        - title: str - Image title/description
        - source: str - Source website
    """
    if not settings.serpapi_api_key:
        raise SerpAPIError("SerpAPI key not configured")

    params = {
        "engine": "google_images",
        "q": query,
        "api_key": settings.serpapi_api_key,
        "safe": "active",  # Safe search
        "ijn": "0",  # First page
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(SERPAPI_BASE_URL, params=params)
            response.raise_for_status()

            data = response.json()
            images_results = data.get("images_results", [])

            images = []
            for img in images_results[:limit]:
                images.append({
                    "url": img.get("original", ""),
                    "thumbnail": img.get("thumbnail", ""),
                    "title": img.get("title", ""),
                    "source": img.get("source", ""),
                    "width": img.get("original_width"),
                    "height": img.get("original_height"),
                })

            return images

    except httpx.HTTPStatusError as e:
        raise SerpAPIError(f"HTTP error from SerpAPI: {e.response.status_code}")
    except httpx.RequestError as e:
        raise SerpAPIError(f"Network error: {str(e)}")


async def get_image_bytes(url: str) -> bytes:
    """
    Download an image from URL and return as bytes.

    Used to fetch images from SerpAPI results for AI processing.

    Args:
        url: Image URL to download

    Returns:
        Image content as bytes
    """
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content
    except Exception as e:
        raise SerpAPIError(f"Failed to download image: {str(e)}")


async def test_serpapi_connection() -> Dict[str, Any]:
    """
    Test the connection to SerpAPI.

    Returns:
        Dict with connection status
    """
    if not settings.serpapi_api_key:
        return {
            "status": "error",
            "message": "SerpAPI key not configured",
        }

    try:
        # Make a simple test query
        result = await geocode_location("New York, USA")

        if result:
            return {
                "status": "connected",
                "message": "SerpAPI connection successful",
                "test_result": result,
            }
        else:
            return {
                "status": "error",
                "message": "SerpAPI returned no results for test query",
            }

    except SerpAPIError as e:
        return {
            "status": "error",
            "message": str(e),
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Unexpected error: {str(e)}",
        }
