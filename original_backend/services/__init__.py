"""
External services for NFT generation.

Note: google_maps.py is deprecated. Use SerpAPI services instead.
"""
from .ai import transform_to_flag_style
from .ipfs import upload_image, upload_metadata, generate_metadata
from .serpapi import (
    discover_locations,
    geocode_location,
    discover_locations_for_municipality,
    search_images,
    get_image_bytes,
)

__all__ = [
    "transform_to_flag_style",
    "upload_image",
    "upload_metadata",
    "generate_metadata",
    "discover_locations",
    "geocode_location",
    "discover_locations_for_municipality",
    "search_images",
    "get_image_bytes",
]
