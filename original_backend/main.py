"""
Municipal Flag NFT Game - Backend API

Main FastAPI application entry point.
"""
# Updated to support IPFS import endpoints
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routers import (
    countries_router,
    regions_router,
    municipalities_router,
    flags_router,
    users_router,
    auctions_router,
    rankings_router,
    admin_router
)

# Initialize FastAPI app
app = FastAPI(
    title=settings.project_name,
    description="A web game based on NFTs where players collect flags of real municipalities.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - Allow all origins for Railway deployment
# In production, Railway uses dynamic subdomains that need flexible CORS
cors_origins = settings.cors_origins_list

# Filter out wildcard patterns and use them separately
explicit_origins = [origin for origin in cors_origins if "*" not in origin]
has_wildcards = any("*" in origin for origin in cors_origins)

# For development, use explicit origins. For production with wildcards, use ["*"]
# But only allow "*" when not in development mode
allow_all_origins = has_wildcards and settings.environment != "development"

print(f"[CORS] Environment: {settings.environment}")
print(f"[CORS] Explicit origins: {explicit_origins}")
print(f"[CORS] Allow all origins: {allow_all_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else explicit_origins,
    allow_credentials=not allow_all_origins,  # Cannot use credentials with "*"
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# STARTUP EVENTS
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup and seed if empty."""
    init_db()

    # Run database migrations for new columns
    from database import engine
    from sqlalchemy import text, inspect

    with engine.connect() as conn:
        inspector = inspect(engine)

        # Check if 'flags' table exists and if 'nfts_required' column exists
        if 'flags' in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns('flags')]
            if 'nfts_required' not in columns:
                print("[MIGRATION] Adding 'nfts_required' column to flags table...")
                try:
                    conn.execute(text("ALTER TABLE flags ADD COLUMN nfts_required INTEGER DEFAULT 1 NOT NULL"))
                    conn.commit()
                    print("[SUCCESS] Column 'nfts_required' added successfully!")
                except Exception as e:
                    print(f"[WARNING] Could not add column (may already exist): {e}")

    # Auto-seed database if empty (for Railway deployment)
    from database import SessionLocal
    from models import Country
    db = SessionLocal()
    try:
        existing = db.query(Country).count()
        if existing == 0:
            print("[SEED] Database is empty, seeding with demo data...")
            from seed_data import seed_database
            seed_database(db)
    finally:
        db.close()

    print(f"[STARTED] {settings.project_name} API started!")
    print(f"[ENV] Environment: {settings.environment}")
    print(f"[DOCS] API Docs available at /docs")


# =============================================================================
# ROUTES
# =============================================================================

# Health check
@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "project": settings.project_name}


# API routers
app.include_router(countries_router, prefix="/api/countries")
app.include_router(regions_router, prefix="/api/regions")
app.include_router(municipalities_router, prefix="/api/municipalities")
app.include_router(flags_router, prefix="/api/flags")
app.include_router(users_router, prefix="/api/users")
app.include_router(auctions_router, prefix="/api/auctions")
app.include_router(rankings_router, prefix="/api/rankings")
app.include_router(admin_router, prefix="/api/admin")


# =============================================================================
# ROOT ENDPOINT
# =============================================================================

@app.get("/", tags=["Root"])
def root():
    """Root endpoint with API information."""
    return {
        "name": settings.project_name,
        "version": "1.0.0",
        "description": "Municipal Flag NFT Game API",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "countries": "/api/countries",
            "regions": "/api/regions",
            "municipalities": "/api/municipalities",
            "flags": "/api/flags",
            "users": "/api/users",
            "auctions": "/api/auctions",
            "rankings": "/api/rankings",
            "admin": "/api/admin"
        }
    }


# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.backend_reload
    )
