import requests
import time
import math
import logging
import threading

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

API_TOKEN = "Bearer 4b84405e-5034-42d2-aac3-6a6275c826d1"
BASE_URL = "https://batoo.api.digibusiness.it/Navis2WS/v2/boats"

PAGE_SIZE = 50

# Global State for Sync
class SyncState:
    def __init__(self):
        self.boats = []
        self.is_loading = False
        self.total_fetched = 0
        self.total_estimated = 0
        self.last_updated = 0
        self._lock = threading.Lock()

    def update_progress(self, fetched, total):
        with self._lock:
            self.total_fetched = fetched
            self.total_estimated = total
            self.last_updated = time.time()
    
    def set_loading(self, loading):
        with self._lock:
            self.is_loading = loading
            
    def set_boats(self, boats):
        with self._lock:
            self.boats = boats
            self.last_updated = time.time()
            
    def get_status(self):
        with self._lock:
            return {
                "total_fetched": self.total_fetched,
                "total_estimated": self.total_estimated,
                "is_loading": self.is_loading,
                "boat_count": len(self.boats)
            }

sync_state = SyncState()

def fetch_worker():
    """Background worker to fetch boats"""
    if sync_state.is_loading:
        return
        
    sync_state.set_loading(True)
    sync_state.update_progress(0, 0)
    
    try:
        headers = {'Authorization': API_TOKEN, 'Accept': 'application/json'}
        params = {'start': 0, 'limit': PAGE_SIZE}
        all_boats = []
        
        # Initial Request
        logger.info("Starting background sync...")
        resp = requests.get(BASE_URL, headers=headers, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        
        total_results = data.get('TotalResults', 0)
        results = data.get('Results', [])
        all_boats.extend(results)
        
        sync_state.update_progress(len(all_boats), total_results)
        
        if total_results > PAGE_SIZE:
            num_pages = math.ceil(total_results / PAGE_SIZE) - 1
            current_start = 0
            
            for i in range(num_pages):
                current_start += PAGE_SIZE
                params['start'] = current_start
                
                # Rate limit
                time.sleep(0.1)
                
                try:
                    resp = requests.get(BASE_URL, headers=headers, params=params, timeout=15)
                    resp.raise_for_status()
                    page_results = resp.json().get('Results', [])
                    
                    if not page_results:
                        break
                        
                    all_boats.extend(page_results)
                    # Update Progress Live
                    sync_state.update_progress(len(all_boats), total_results)
                    logger.info(f"Sync progress: {len(all_boats)}/{total_results}")
                    
                except Exception as e:
                    logger.error(f"Error fetching page {i}: {e}")
                    continue
        
        # Deduplicate
        unique_boats = {b['BoatID']: b for b in all_boats if 'BoatID' in b}.values()
        final_list = list(unique_boats)
        
        sync_state.set_boats(final_list)
        logger.info(f"Sync complete. Total boats: {len(final_list)}")
        
    except Exception as e:
        logger.error(f"Sync failed: {e}")
    finally:
        sync_state.set_loading(False)

def start_background_sync():
    thread = threading.Thread(target=fetch_worker)
    thread.daemon = True
    thread.start()

def get_cached_boats():
    return sync_state.boats

def get_boat_details(boat_id):
    url = f"{BASE_URL}/{boat_id}"
    headers = {'Authorization': API_TOKEN, 'Accept': 'application/json'}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Error fetching boat details for {boat_id}: {e}")
        return None

def fetch_all_boats(filters=None):
    # Compatibility wrapper for legacy calls if any, but properly we should use cached.
    # If no cache, return empty or trigger sync.
    if not sync_state.boats and not sync_state.is_loading:
        start_background_sync()
    return sync_state.boats

def calculate_stats(boats):
    if not boats:
        return {
            "avg_price": 0,
            "max_price": 0,
            "min_price": 0,
            "total_boats": 0,
            "avg_year": 0,
            "max_year": 0,
            "min_year": 0,
            "brands": {}
        }
        
    prices = [b.get("SellPrice") for b in boats if b.get("SellPrice")]
    avg_price = sum(prices) / len(prices) if prices else 0
    max_price = max(prices) if prices else 0
    min_price = min(prices) if prices else 0
    
    # Year Stats
    years = [b.get("YearBuilt") for b in boats if b.get("YearBuilt")]
    years = [y for y in years if isinstance(y, int) and y > 1900]
    
    avg_year = sum(years) / len(years) if years else 0
    max_year = max(years) if years else 0
    min_year = min(years) if years else 0
    
    return {
        "avg_price": avg_price,
        "max_price": max_price,
        "min_price": min_price,
        "avg_year": int(avg_year),
        "max_year": max_year,
        "min_year": min_year,
        "total_boats": len(boats)
        # brands removed for brevity if not used, or re-add if needed
    }
