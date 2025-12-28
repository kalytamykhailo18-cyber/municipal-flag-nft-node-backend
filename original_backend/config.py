"""
Centralized configuration loader for the backend.
Reads settings from environment variables or .env file.
"""
import os
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List


# Find the .env file - check backend dir first, then parent (for local dev)
BACKEND_DIR = Path(__file__).parent
ROOT_DIR = BACKEND_DIR.parent

# Priority: backend/.env > root/.env > environment variables
if (BACKEND_DIR / ".env").exists():
    ENV_FILE = BACKEND_DIR / ".env"
elif (ROOT_DIR / ".env").exists():
    ENV_FILE = ROOT_DIR / ".env"
else:
    ENV_FILE = None  # Will rely on environment variables (Railway)


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # General
    project_name: str = "Municipal Flag NFT Game"
    environment: str = "development"
    debug: bool = True

    # Backend
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_reload: bool = True

    # Database
    database_url: str = "sqlite:///./nft_game.db"

    # Admin
    admin_api_key: str = "change-this-key"

    # CORS - includes Railway and AWS frontend domains for production
    # Allow all Railway/AWS subdomains and localhost for development
    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:5173,https://nft-municipal-flag-game-frontend-production.up.railway.app,https://*.up.railway.app,https://*.cloudfront.net,https://*.amazonaws.com"

    # Blockchain
    contract_address: str = ""
    polygon_amoy_rpc_url: str = "https://rpc-amoy.polygon.technology"
    deployer_private_key: str = ""

    # IPFS / Pinata
    pinata_api_key: str = ""
    pinata_api_secret: str = ""
    pinata_jwt: str = ""

    # AI Generation
    sd_use_cloud_api: bool = True
    replicate_api_token: str = ""
    stability_api_key: str = ""
    sd_image_width: int = 512
    sd_image_height: int = 512

    # Google Maps / Street View
    google_maps_api_key: str = ""
    street_view_image_size: str = "640x640"
    street_view_fov: int = 90  # Field of view (1-120)

    # SerpAPI for location discovery
    serpapi_api_key: str = ""

    # Game Configuration
    flags_per_municipality: int = 8
    default_standard_price: float = 0.01
    default_plus_price: float = 0.02
    default_premium_price: float = 0.05
    plus_discount_percent: int = 50
    premium_discount_percent: int = 75

    # Demo Settings
    demo_countries_count: int = 4
    demo_regions_per_country: int = 1
    demo_municipalities_per_region: int = 2

    # Frontend URLs (for reference)
    react_app_api_url: str = "http://localhost:8000/api"
    react_app_ipfs_gateway: str = "https://gateway.pinata.cloud/ipfs"

    # Community Links (included in NFT metadata)
    telegram_group_url: str = "https://t.me/MunicipalFlagNFT"
    project_website_url: str = "https://municipalflagnft.com"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = str(ENV_FILE) if ENV_FILE else None
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Allow extra env vars not defined in Settings


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Export settings instance for easy import
settings = get_settings()
