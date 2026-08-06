import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api.upload import router as upload_router
from app.api.process import router as process_router
from app.api.export import router as export_router
from app.api.retrain import router as retrain_router

app = FastAPI(
    title="Bank Statement Extraction & Classification API",
    description="End-to-end PDF Bank Statement parsing, account detail extraction, accounting validation, hybrid ML classification, and export system.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers under /api prefix
app.include_router(upload_router, prefix="/api", tags=["Upload & Security"])
app.include_router(process_router, prefix="/api", tags=["Statement Processing"])
app.include_router(export_router, prefix="/api", tags=["Export & Edit"])
app.include_router(retrain_router, prefix="/api", tags=["Feedback & Retraining"])

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Bank Statement Extraction System",
        "version": "1.0.0"
    }

# Mount static frontend build if dist folder exists
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
