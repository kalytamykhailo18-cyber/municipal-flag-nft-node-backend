"""
Pydantic schemas for request/response validation.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator
from models import FlagCategory, NFTStatus, OwnershipType, AuctionStatus


# =============================================================================
# BASE SCHEMAS
# =============================================================================

class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    class Config:
        from_attributes = True


# =============================================================================
# COUNTRY SCHEMAS
# =============================================================================

class CountryCreate(BaseModel):
    """Schema for creating a country."""
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=2, max_length=3)
    is_visible: bool = True


class CountryUpdate(BaseModel):
    """Schema for updating a country."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=2, max_length=3)
    is_visible: Optional[bool] = None


class CountryResponse(BaseSchema):
    """Schema for country response."""
    id: int
    name: str
    code: str
    is_visible: bool
    created_at: datetime
    region_count: Optional[int] = 0


class CountryDetailResponse(CountryResponse):
    """Schema for country detail with regions."""
    regions: List["RegionResponse"] = []


# =============================================================================
# REGION SCHEMAS
# =============================================================================

class RegionCreate(BaseModel):
    """Schema for creating a region."""
    name: str = Field(..., min_length=1, max_length=100)
    country_id: int
    is_visible: bool = True


class RegionUpdate(BaseModel):
    """Schema for updating a region."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    country_id: Optional[int] = None
    is_visible: Optional[bool] = None


class RegionResponse(BaseSchema):
    """Schema for region response."""
    id: int
    name: str
    country_id: int
    is_visible: bool
    created_at: datetime
    municipality_count: Optional[int] = 0


class RegionDetailResponse(RegionResponse):
    """Schema for region detail with country and municipalities."""
    country: Optional[CountryResponse] = None
    municipalities: List["MunicipalityResponse"] = []


# =============================================================================
# MUNICIPALITY SCHEMAS
# =============================================================================

class MunicipalityCreate(BaseModel):
    """Schema for creating a municipality."""
    name: str = Field(..., min_length=1, max_length=100)
    region_id: int
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    is_visible: bool = True


class MunicipalityUpdate(BaseModel):
    """Schema for updating a municipality."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    region_id: Optional[int] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_visible: Optional[bool] = None


class MunicipalityResponse(BaseSchema):
    """Schema for municipality response."""
    id: int
    name: str
    region_id: int
    latitude: float
    longitude: float
    coordinates: str
    is_visible: bool
    created_at: datetime
    flag_count: Optional[int] = 0


class MunicipalityDetailResponse(MunicipalityResponse):
    """Schema for municipality detail with region and flags.

    Uses FlagDetailResponse to include interests and ownerships for matching game reveal logic.
    """
    region: Optional[RegionResponse] = None
    flags: List["FlagDetailResponse"] = []


# =============================================================================
# FLAG SCHEMAS
# =============================================================================

class FlagCreate(BaseModel):
    """
    Schema for creating a flag.

    MULTI-NFT FEATURE:
    nfts_required determines how many NFTs are needed to obtain this flag:
    - 1: Standard single NFT flag (default)
    - 3: Grouped NFT flag requiring 3 NFTs
    """
    municipality_id: int
    name: str = Field(..., min_length=1, max_length=100)
    location_type: str = Field(..., min_length=1, max_length=50)
    category: FlagCategory = FlagCategory.STANDARD
    nfts_required: int = Field(default=1, ge=1, le=10, description="Number of NFTs required to obtain this flag (1 or 3)")
    image_ipfs_hash: Optional[str] = None
    metadata_ipfs_hash: Optional[str] = None
    price: Decimal = Decimal("0.01")


class FlagUpdate(BaseModel):
    """Schema for updating a flag."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location_type: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[FlagCategory] = None
    nfts_required: Optional[int] = Field(None, ge=1, le=10, description="Number of NFTs required to obtain this flag")
    image_ipfs_hash: Optional[str] = None
    metadata_ipfs_hash: Optional[str] = None
    price: Optional[Decimal] = None


class FlagResponse(BaseSchema):
    """
    Schema for flag response.

    MULTI-NFT FEATURE:
    nfts_required indicates how many NFTs are needed to obtain this flag.
    total_price is calculated as price * nfts_required.

    DATA TYPE RULES (from overview/rule.md):
    - nfts_required: int (read from database, but FRONTEND should read from CONTRACT)
    - price: str with 8 decimals ("0.05000000") for API consistency
    - category: FlagCategory enum (lowercase string values)
    - status: NFTStatus enum (lowercase string values)
    """
    id: int
    municipality_id: int
    name: str
    location_type: str
    category: FlagCategory
    nfts_required: int  # Number of NFTs required - NO DEFAULT to prevent bug
    image_ipfs_hash: Optional[str]
    metadata_ipfs_hash: Optional[str]
    metadata_hash: Optional[str] = None  # SHA-256 hash for integrity verification
    token_id: Optional[int]
    price: str  # Price per NFT as string with 8 decimals ("0.05000000")
    first_nft_status: NFTStatus
    second_nft_status: NFTStatus
    is_pair_complete: bool
    created_at: datetime
    interest_count: Optional[int] = 0

    @field_validator("price", mode="before")
    @classmethod
    def format_price(cls, v):
        """Format price as string with 8 decimals for API consistency."""
        if v is None:
            return "0.00000000"
        # Convert Decimal/float to string with 8 decimal places
        return f"{float(v):.8f}"


class FlagDetailResponse(FlagResponse):
    """Schema for flag detail with municipality and interests."""
    municipality: Optional[MunicipalityResponse] = None
    interests: List["FlagInterestResponse"] = []
    ownerships: List["FlagOwnershipResponse"] = []


# =============================================================================
# USER SCHEMAS
# =============================================================================

class UserCreate(BaseModel):
    """Schema for creating a user."""
    wallet_address: str = Field(..., min_length=42, max_length=42)
    username: Optional[str] = Field(None, min_length=1, max_length=50)

    @field_validator("wallet_address")
    @classmethod
    def validate_wallet(cls, v):
        if not v.startswith("0x"):
            raise ValueError("Wallet address must start with 0x")
        return v.lower()


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    username: Optional[str] = Field(None, min_length=1, max_length=50)


class UserResponse(BaseSchema):
    """Schema for user response."""
    id: int
    wallet_address: str
    username: Optional[str]
    reputation_score: int
    created_at: datetime
    flags_owned: Optional[int] = 0
    followers_count: Optional[int] = 0
    following_count: Optional[int] = 0


class UserDetailResponse(UserResponse):
    """Schema for user detail with owned flags and interests."""
    ownerships: List["FlagOwnershipResponse"] = []
    interests: List["FlagInterestResponse"] = []


# =============================================================================
# INTERACTION SCHEMAS
# =============================================================================

class FlagInterestCreate(BaseModel):
    """Schema for creating a flag interest."""
    wallet_address: str = Field(..., min_length=42, max_length=42)

    @field_validator("wallet_address")
    @classmethod
    def validate_wallet(cls, v):
        if not v.startswith("0x"):
            raise ValueError("Wallet address must start with 0x")
        return v.lower()


class FlagInterestResponse(BaseSchema):
    """Schema for flag interest response."""
    id: int
    user_id: int
    flag_id: int
    created_at: datetime
    user: Optional[UserResponse] = None


class FlagOwnershipResponse(BaseSchema):
    """Schema for flag ownership response."""
    id: int
    user_id: int
    flag_id: int
    ownership_type: OwnershipType
    transaction_hash: Optional[str]
    created_at: datetime
    user: Optional[UserResponse] = None


class FlagOwnershipCreate(BaseModel):
    """Schema for recording flag ownership."""
    wallet_address: str = Field(..., min_length=42, max_length=42)
    ownership_type: OwnershipType
    transaction_hash: Optional[str] = None

    @field_validator("wallet_address")
    @classmethod
    def validate_wallet(cls, v):
        if not v.startswith("0x"):
            raise ValueError("Wallet address must start with 0x")
        return v.lower()


# =============================================================================
# SOCIAL SCHEMAS
# =============================================================================

class FollowCreate(BaseModel):
    """Schema for following a user."""
    target_wallet: str = Field(..., min_length=42, max_length=42)

    @field_validator("target_wallet")
    @classmethod
    def validate_wallet(cls, v):
        if not v.startswith("0x"):
            raise ValueError("Wallet address must start with 0x")
        return v.lower()


class ConnectionResponse(BaseSchema):
    """Schema for connection response."""
    id: int
    follower_id: int
    following_id: int
    created_at: datetime
    follower: Optional[UserResponse] = None
    following: Optional[UserResponse] = None


# =============================================================================
# AUCTION SCHEMAS
# =============================================================================

class AuctionCreate(BaseModel):
    """
    Schema for creating an auction.

    ENHANCED AUCTION FEATURES:
    - min_price: Minimum bid price (floor) - defaults to starting_price if not provided
    - buyout_price: Instant purchase price (optional)
    """
    flag_id: int
    wallet_address: str = Field(..., min_length=42, max_length=42)
    starting_price: Decimal = Field(..., gt=0)
    min_price: Optional[Decimal] = Field(None, gt=0, description="Minimum bid price (floor). Defaults to starting_price.")
    buyout_price: Optional[Decimal] = Field(None, gt=0, description="Instant purchase price (optional)")
    duration_hours: int = Field(..., ge=1, le=168)  # 1 hour to 7 days

    @field_validator("wallet_address")
    @classmethod
    def validate_wallet(cls, v):
        if not v.startswith("0x"):
            raise ValueError("Wallet address must start with 0x")
        return v.lower()

    @model_validator(mode="after")
    def set_min_price_default(self):
        """Set min_price to starting_price if not provided."""
        if self.min_price is None:
            self.min_price = self.starting_price
        return self

    @field_validator("buyout_price")
    @classmethod
    def validate_buyout_price(cls, v, info):
        if v is not None:
            starting_price = info.data.get("starting_price")
            if starting_price is not None and v <= starting_price:
                raise ValueError("Buyout price must be greater than starting_price")
        return v


class AuctionResponse(BaseSchema):
    """
    Schema for auction response.

    ENHANCED FIELDS:
    - min_price: Floor price for bids
    - buyout_price: Instant purchase price (optional)
    - winner_category: Category of winning bidder
    """
    id: int
    flag_id: int
    seller_id: int
    starting_price: Decimal
    min_price: Decimal
    buyout_price: Optional[Decimal]
    current_highest_bid: Optional[Decimal]
    highest_bidder_id: Optional[int]
    winner_category: Optional[FlagCategory]
    status: AuctionStatus
    ends_at: datetime
    created_at: datetime
    flag: Optional[FlagResponse] = None
    seller: Optional[UserResponse] = None
    bid_count: Optional[int] = 0


class AuctionDetailResponse(AuctionResponse):
    """Schema for auction detail with bids."""
    bids: List["BidResponse"] = []
    highest_bidder: Optional[UserResponse] = None


class BidCreate(BaseModel):
    """
    Schema for placing a bid.

    ENHANCED BID FEATURES:
    - bidder_category: Category of the bidder for tie-breaking
    """
    wallet_address: str = Field(..., min_length=42, max_length=42)
    amount: Decimal = Field(..., gt=0)
    bidder_category: FlagCategory = Field(default=FlagCategory.STANDARD, description="Bidder's category for tie-breaking")

    @field_validator("wallet_address")
    @classmethod
    def validate_wallet(cls, v):
        if not v.startswith("0x"):
            raise ValueError("Wallet address must start with 0x")
        return v.lower()


class BidResponse(BaseSchema):
    """Schema for bid response with category."""
    id: int
    auction_id: int
    bidder_id: int
    amount: Decimal
    bidder_category: FlagCategory
    created_at: datetime
    bidder: Optional[UserResponse] = None


class BuyoutCreate(BaseModel):
    """Schema for instant buyout purchase."""
    wallet_address: str = Field(..., min_length=42, max_length=42)

    @field_validator("wallet_address")
    @classmethod
    def validate_wallet(cls, v):
        if not v.startswith("0x"):
            raise ValueError("Wallet address must start with 0x")
        return v.lower()


# =============================================================================
# RANKING SCHEMAS
# =============================================================================

class UserRankingResponse(BaseModel):
    """Schema for user ranking."""
    rank: int
    user: UserResponse
    score: int


class FlagRankingResponse(BaseModel):
    """Schema for flag ranking.

    Uses FlagDetailResponse to include interests and ownerships for matching game reveal logic.
    """
    rank: int
    flag: "FlagDetailResponse"
    interest_count: int


# =============================================================================
# ADMIN SCHEMAS
# =============================================================================

class AdminStatsResponse(BaseModel):
    """Schema for admin statistics."""
    total_countries: int
    total_regions: int
    total_municipalities: int
    total_flags: int
    total_users: int
    total_interests: int
    total_ownerships: int
    total_auctions: int
    active_auctions: int
    completed_pairs: int


class DemoUserCreate(BaseModel):
    """Schema for creating a demo user."""
    wallet_address: str = Field(
        default="0xDEMO000000000000000000000000000000000001",
        min_length=42,
        max_length=42,
        description="Demo user wallet address"
    )
    username: str = Field(default="Demo User", min_length=1, max_length=50)
    reputation_score: int = Field(default=100, ge=0)

    @field_validator("wallet_address")
    @classmethod
    def validate_wallet(cls, v):
        if not v.startswith("0x"):
            raise ValueError("Wallet address must start with 0x")
        return v.lower()


class DemoUserResponse(BaseModel):
    """Schema for demo user response."""
    user: UserResponse
    message: str
    created: bool


class DemoOwnershipCreate(BaseModel):
    """Schema for seeding demo user ownerships."""
    user_id: int
    flag_count: int = Field(default=5, ge=1, le=50, description="Number of flags to give ownership")
    include_categories: List[str] = Field(
        default=["standard", "plus", "premium"],
        description="Flag categories to include"
    )


class DemoOwnershipResponse(BaseModel):
    """Schema for demo ownership response."""
    ownerships_created: int
    flags_owned: List[int]
    message: str


# =============================================================================
# COORDINATE NFT GENERATION SCHEMAS
# =============================================================================

class CoordinateNFTCreate(BaseModel):
    """
    Schema for generating NFT from coordinates.

    This triggers the full pipeline:
    1. Fetch Street View image
    2. Transform with AI
    3. Upload to IPFS
    4. Create metadata
    5. Create Flag in database
    """
    latitude: float = Field(..., ge=-90, le=90, description="Latitude (-90 to 90)")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude (-180 to 180)")
    municipality_id: int = Field(..., gt=0, description="Municipality this flag belongs to")
    location_type: str = Field(..., min_length=1, max_length=50, description="Type of location (e.g., 'Town Hall')")
    category: FlagCategory = Field(default=FlagCategory.STANDARD, description="Flag category")
    nfts_required: int = Field(default=1, ge=1, le=10, description="Number of NFTs required (1-10)")
    custom_name: Optional[str] = Field(None, max_length=100, description="Custom flag name (auto-generated if not provided)")
    custom_prompt: Optional[str] = Field(None, max_length=500, description="Custom AI prompt for style transformation")
    heading: Optional[int] = Field(None, ge=0, le=360, description="Street View camera heading (0-360)")


class CoordinateNFTProgress(BaseModel):
    """Schema for NFT generation progress updates."""
    step: int
    total_steps: int
    status: str
    message: str
    data: Optional[dict] = None


class CoordinateNFTResponse(BaseModel):
    """Schema for generated NFT response."""
    flag_id: int
    flag_name: str
    image_ipfs_hash: str
    metadata_ipfs_hash: str
    metadata_hash: str  # SHA-256 for integrity verification
    coordinates: str
    message: str
    success: bool = True


# =============================================================================
# COMMON SCHEMAS
# =============================================================================

class MessageResponse(BaseModel):
    """Simple message response."""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response."""
    detail: str
    success: bool = False


class ImagePreviewItem(BaseModel):
    """Single image in preview response."""
    url: str
    thumbnail: str
    title: str
    source: str


class ImagePreviewResponse(BaseModel):
    """Response with preview images from SerpAPI."""
    message: str
    success: bool = True
    images: List[ImagePreviewItem] = []


# Update forward references
CountryDetailResponse.model_rebuild()
RegionDetailResponse.model_rebuild()
MunicipalityDetailResponse.model_rebuild()
FlagDetailResponse.model_rebuild()
UserDetailResponse.model_rebuild()
AuctionDetailResponse.model_rebuild()
