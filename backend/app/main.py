"""FastAPI application entry point."""
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.config import config
from backend.app.routes import (
    routes_auth,
    routes_users,
    routes_operator,
    routes_admin_ocr,
    routes_admin_audio,
    routes_admin_items,
    routes_datasets,
    routes_reviews,
    routes_ocr,
    routes_dashboard,
    routes_analytics,
    routes_homepage
)

# Create FastAPI app
app = FastAPI(
    title=config.APP_NAME,
    debug=config.DEBUG,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes_auth.router, prefix="/api")
app.include_router(routes_users.router, prefix="/api")
app.include_router(routes_operator.router, prefix="/api")
app.include_router(routes_admin_ocr.router, prefix="/api")
app.include_router(routes_admin_audio.router, prefix="/api")
app.include_router(routes_admin_items.router, prefix="/api")
app.include_router(routes_datasets.router, prefix="/api")
app.include_router(routes_reviews.router, prefix="/api")
app.include_router(routes_ocr.router, prefix="/api")
app.include_router(routes_dashboard.router)
app.include_router(routes_analytics.router)
app.include_router(routes_homepage.router)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "storage": config.STORAGE_TYPE,
        "app": config.APP_NAME
    }


# Serve static files from frontend build (for production deployment)
frontend_build_path = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_build_path.exists():
    # Mount static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=str(frontend_build_path / "assets")), name="assets")
    
    # Serve index.html for all other routes (SPA fallback)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes."""
        # Don't serve SPA for API routes
        if full_path.startswith("api/"):
            return {"error": "Not found"}
        
        index_file = frontend_build_path / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"error": "Frontend not built"}
else:
    # Development mode - just return API info
    @app.get("/")
    def root():
        """Root endpoint - dev mode."""
        return {
            "app": config.APP_NAME,
            "docs": "/api/docs",
            "status": "running (dev mode)"
        }
