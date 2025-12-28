"""
Municipalities API Router.
Updated to include interests and ownerships for matching game reveal logic.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from database import get_db
from models import Municipality, Region, Flag
from schemas import (
    MunicipalityCreate, MunicipalityUpdate, MunicipalityResponse,
    MunicipalityDetailResponse, RegionResponse, FlagDetailResponse,
    FlagInterestResponse, FlagOwnershipResponse, UserResponse, MessageResponse
)
from config import settings

router = APIRouter(tags=["Municipalities"])


def build_user_response(user):
    """Build user response with computed counts."""
    return UserResponse(
        id=user.id,
        wallet_address=user.wallet_address,
        username=user.username,
        reputation_score=user.reputation_score,
        followers_count=len(user.followers),
        following_count=len(user.following),
        created_at=user.created_at
    )


def verify_admin(x_admin_key: Optional[str] = Header(None)):
    """Verify admin API key for protected endpoints."""
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing admin API key"
        )
    return True


@router.get("", response_model=List[MunicipalityResponse])
def get_municipalities(
    region_id: Optional[int] = None,
    visible_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all municipalities, optionally filtered by region."""
    query = db.query(Municipality)

    if region_id:
        query = query.filter(Municipality.region_id == region_id)
    if visible_only:
        query = query.filter(Municipality.is_visible == True)

    municipalities = query.order_by(Municipality.name).all()

    result = []
    for municipality in municipalities:
        result.append(MunicipalityResponse(
            id=municipality.id,
            name=municipality.name,
            region_id=municipality.region_id,
            latitude=municipality.latitude,
            longitude=municipality.longitude,
            coordinates=municipality.coordinates,
            is_visible=municipality.is_visible,
            created_at=municipality.created_at,
            flag_count=len(municipality.flags)
        ))

    return result


@router.get("/{municipality_id}", response_model=MunicipalityDetailResponse)
def get_municipality(
    municipality_id: int,
    db: Session = Depends(get_db)
):
    """Get a single municipality with its flags."""
    municipality = db.query(Municipality).filter(Municipality.id == municipality_id).first()
    if not municipality:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Municipality with id {municipality_id} not found"
        )

    # Build region response
    region_data = RegionResponse(
        id=municipality.region.id,
        name=municipality.region.name,
        country_id=municipality.region.country_id,
        is_visible=municipality.region.is_visible,
        created_at=municipality.region.created_at,
        municipality_count=len(municipality.region.municipalities)
    )

    # Build flags list - include all flags, let frontend filter based on user ownership
    flags_data = []
    for flag in municipality.flags:
        # Build interests list with user info for matching game reveal logic
        interests_data = []
        for interest in flag.interests:
            user_data = build_user_response(interest.user) if interest.user else None
            interests_data.append(FlagInterestResponse(
                id=interest.id,
                user_id=interest.user_id,
                flag_id=interest.flag_id,
                created_at=interest.created_at,
                user=user_data
            ))

        # Build ownerships list with user info for matching game reveal logic
        ownerships_data = []
        for ownership in flag.ownerships:
            user_data = build_user_response(ownership.user) if ownership.user else None
            ownerships_data.append(FlagOwnershipResponse(
                id=ownership.id,
                user_id=ownership.user_id,
                flag_id=ownership.flag_id,
                ownership_type=ownership.ownership_type,
                transaction_hash=ownership.transaction_hash,
                created_at=ownership.created_at,
                user=user_data
            ))

        flags_data.append(FlagDetailResponse(
            id=flag.id,
            municipality_id=flag.municipality_id,
            name=flag.name,
            location_type=flag.location_type,
            category=flag.category,
            nfts_required=flag.nfts_required,  # Multi-NFT field
            image_ipfs_hash=flag.image_ipfs_hash,
            metadata_ipfs_hash=flag.metadata_ipfs_hash,
            token_id=flag.token_id,
            price=flag.price,
            first_nft_status=flag.first_nft_status,
            second_nft_status=flag.second_nft_status,
            is_pair_complete=flag.is_pair_complete,
            created_at=flag.created_at,
            interest_count=len(flag.interests),
            interests=interests_data,
            ownerships=ownerships_data
        ))

    return MunicipalityDetailResponse(
        id=municipality.id,
        name=municipality.name,
        region_id=municipality.region_id,
        latitude=municipality.latitude,
        longitude=municipality.longitude,
        coordinates=municipality.coordinates,
        is_visible=municipality.is_visible,
        created_at=municipality.created_at,
        flag_count=len(flags_data),
        region=region_data,
        flags=flags_data
    )


@router.post("", response_model=MunicipalityResponse, status_code=status.HTTP_201_CREATED)
def create_municipality(
    municipality: MunicipalityCreate,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Create a new municipality (admin only)."""
    # Verify region exists
    region = db.query(Region).filter(Region.id == municipality.region_id).first()
    if not region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Region with id {municipality.region_id} not found"
        )

    db_municipality = Municipality(
        name=municipality.name,
        region_id=municipality.region_id,
        latitude=municipality.latitude,
        longitude=municipality.longitude,
        is_visible=municipality.is_visible
    )
    db.add(db_municipality)
    db.commit()
    db.refresh(db_municipality)

    return MunicipalityResponse(
        id=db_municipality.id,
        name=db_municipality.name,
        region_id=db_municipality.region_id,
        latitude=db_municipality.latitude,
        longitude=db_municipality.longitude,
        coordinates=db_municipality.coordinates,
        is_visible=db_municipality.is_visible,
        created_at=db_municipality.created_at,
        flag_count=0
    )


@router.put("/{municipality_id}", response_model=MunicipalityResponse)
def update_municipality(
    municipality_id: int,
    municipality: MunicipalityUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Update a municipality (admin only)."""
    db_municipality = db.query(Municipality).filter(Municipality.id == municipality_id).first()
    if not db_municipality:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Municipality with id {municipality_id} not found"
        )

    if municipality.name is not None:
        db_municipality.name = municipality.name
    if municipality.region_id is not None:
        # Verify new region exists
        region = db.query(Region).filter(Region.id == municipality.region_id).first()
        if not region:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Region with id {municipality.region_id} not found"
            )
        db_municipality.region_id = municipality.region_id
    if municipality.latitude is not None:
        db_municipality.latitude = municipality.latitude
    if municipality.longitude is not None:
        db_municipality.longitude = municipality.longitude
    if municipality.is_visible is not None:
        db_municipality.is_visible = municipality.is_visible

    db.commit()
    db.refresh(db_municipality)

    return MunicipalityResponse(
        id=db_municipality.id,
        name=db_municipality.name,
        region_id=db_municipality.region_id,
        latitude=db_municipality.latitude,
        longitude=db_municipality.longitude,
        coordinates=db_municipality.coordinates,
        is_visible=db_municipality.is_visible,
        created_at=db_municipality.created_at,
        flag_count=len(db_municipality.flags)
    )


@router.delete("/{municipality_id}", response_model=MessageResponse)
def delete_municipality(
    municipality_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin)
):
    """Delete a municipality (admin only)."""
    db_municipality = db.query(Municipality).filter(Municipality.id == municipality_id).first()
    if not db_municipality:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Municipality with id {municipality_id} not found"
        )

    db.delete(db_municipality)
    db.commit()

    return MessageResponse(message=f"Municipality '{db_municipality.name}' deleted successfully")
