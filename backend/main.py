from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from service import get_cached_boats, start_background_sync, sync_state, calculate_stats, get_boat_details
import logging
import os

app = FastAPI()

# Enable CORS (allow all origins for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger("uvicorn")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up... Triggering initial sync.")
    start_background_sync()

@app.get("/api/boats")
def get_boats(refresh: bool = False):
    """
    Returns the cached list of boats.
    If refresh=True, triggers a background sync (if not already running).
    """
    if refresh:
        start_background_sync()
        
    boats = get_cached_boats()
    return boats

@app.get("/api/status")
def get_sync_status():
    """
    Returns the current sync status.
    """
    return sync_state.get_status()

@app.post("/api/sync")
def trigger_sync():
    """
    Manually triggers a sync.
    """
    start_background_sync()
    return {"message": "Sync started"}

@app.get("/api/stats")
def get_stats():
    boats = get_cached_boats()
    return calculate_stats(boats)

@app.get("/api/boats/{boat_id}")
def get_boat_detail(boat_id: str):
    details = get_boat_details(boat_id)
    if not details:
        raise HTTPException(status_code=404, detail="Boat not found")
    return details

# Serve Static Files (Frontend)
# Check if dist exists (production mode)
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        # Serve index.html for non-API routes (SPA support)
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not found")
            
        # Check if file exists in dist (e.g. favicon.ico)
        possible_file = os.path.join(frontend_dist, full_path)
        if os.path.exists(possible_file) and os.path.isfile(possible_file):
             return FileResponse(possible_file)
             
        # Fallback to index.html
        return FileResponse(os.path.join(frontend_dist, "index.html"))

