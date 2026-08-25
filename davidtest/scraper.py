import os
import io
import glob
import json
import shutil
import zipfile
import requests
from bs4 import BeautifulSoup

# --- 1. BULLETPROOF DIRECTORY SETUP ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'data')

# ---------------------------------------------------
# CHANGE THESE VARIABLES FOR THE ACTIVE STORM
stormname = 'al03' 
year = '2026'
# ---------------------------------------------------

url = f"https://www.nhc.noaa.gov/gis/archive_forecast_results.php?id={stormname}&year={year}"
page = requests.get(url)
soup = BeautifulSoup(page.content, "html.parser")

# 2. Get ONLY the zip files that have '5day' in their name
anchors = soup.find_all(lambda tag: tag.name=='a' and '5day' in tag.text and tag.text.endswith('.zip'))

# 3. Filter out intermediate advisories (e.g., 001A.zip)
full_advisories = [a for a in anchors if a.text.replace('.zip', '')[-1].isdigit()]

if not full_advisories:
    print(f"Error: No full 5-day advisories found for {stormname.upper()} {year}.")
    exit()

# 4. Grab the latest FULL 5-day advisory
link = full_advisories[-1].get('href')

landing = "https://www.nhc.noaa.gov/gis/"
final = landing + link

# --- 5. FRESH DATA FOLDER ---
if os.path.exists(DATA_DIR):
    shutil.rmtree(DATA_DIR)

os.makedirs(DATA_DIR, exist_ok=True)

# --- 6. DOWNLOAD AND EXTRACT NHC SHAPEFILES ---
print(f"Downloading NHC data from: {final}")
r = requests.get(final)
z = zipfile.ZipFile(io.BytesIO(r.content))
z.extractall(DATA_DIR)

# --- 7. REPACKAGE ZIPS ---
# Points
with zipfile.ZipFile(os.path.join(DATA_DIR, 'points.zip'), 'w') as zipF:
    for file in glob.glob(f"{DATA_DIR}/**/*5day_pts*", recursive=True):
        zipF.write(file, arcname=os.path.relpath(file, DATA_DIR))

# Cone
with zipfile.ZipFile(os.path.join(DATA_DIR, 'pgn.zip'), 'w') as zipF:
    for file in glob.glob(f"{DATA_DIR}/**/*5day_pgn*", recursive=True):
        zipF.write(file, arcname=os.path.relpath(file, DATA_DIR))

# Track
with zipfile.ZipFile(os.path.join(DATA_DIR, 'lin.zip'), 'w') as zipF:
    for file in glob.glob(f"{DATA_DIR}/**/*5day_lin*", recursive=True):
        zipF.write(file, arcname=os.path.relpath(file, DATA_DIR))

# Wind warnings
with zipfile.ZipFile(os.path.join(DATA_DIR, 'wwlin.zip'), 'w') as zipF:
    for file in glob.glob(f"{DATA_DIR}/**/*wwlin*", recursive=True):
        if not file.endswith('.zip'):
            zipF.write(file, arcname=os.path.relpath(file, DATA_DIR))

# --- 8. FETCH & CONVERT SPAGHETTI MODEL DATA (ATCF -> GeoJSON) ---
print(f"Fetching spaghetti model guidance for {stormname.upper()}...")

# Target major forecast models (GFS, ECMWF, HWRF, HMON, NVGM/Navgem, ICON, UKMET)
TRACKED_MODELS = {'AVNO': 'GFS', 'EMX': 'ECMWF', 'HMNI': 'HMON', 'HWFI': 'HWRF', 'NVGM': 'NAVGEM', 'ICON': 'ICON', 'UKM': 'UKMET'}
MODEL_COLORS = {'GFS': '#e41a1c', 'ECMWF': '#377eb8', 'HMON': '#4daf4a', 'HWRF': '#984ea3', 'NAVGEM': '#ff7f00', 'ICON': '#ffff33', 'UKMET': '#a65628'}

# UCAR/RAL real-time ATCF data URL structure
atcf_url = f"https://www.ral.ucar.edu/hurricanes/realtime/plots/northatlantic/{year}/{stormname.lower()}/a{stormname.lower()}{year}.dat"

try:
    atcf_resp = requests.get(atcf_url, timeout=10)
    features = []

    if atcf_resp.status_code == 200:
        model_tracks = {}
        lines = atcf_resp.text.strip().split('\n')

        for line in lines:
            parts = [p.strip() for p in line.split(',')]
            if len(parts) >= 11:
                technique = parts[4]
                if technique in TRACKED_MODELS:
                    model_label = TRACKED_MODELS[technique]
                    lat_raw = parts[6]
                    lon_raw = parts[7]

                    # Parse Latitude (e.g., 257N -> 25.7)
                    lat = float(lat_raw[:-1]) / 10.0
                    if lat_raw.endswith('S'):
                        lat = -lat

                    # Parse Longitude (e.g., 801W -> -80.1)
                    lon = float(lon_raw[:-1]) / 10.0
                    if lon_raw.endswith('W'):
                        lon = -lon

                    if model_label not in model_tracks:
                        model_tracks[model_label] = []
                    
                    # Avoid duplicate sequential coordinates
                    coord = [lon, lat]
                    if not model_tracks[model_label] or model_tracks[model_label][-1] != coord:
                        model_tracks[model_label].append(coord)

        # Build GeoJSON Features
        for model_label, coords in model_tracks.items():
            if len(coords) > 1:
                features.append({
                    "type": "Feature",
                    "properties": {
                        "model": model_label,
                        "color": MODEL_COLORS.get(model_label, '#888888')
                    },
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coords
                    }
                })

    geojson_data = {
        "type": "FeatureCollection",
        "features": features
    }

    # Save spaghetti.geojson to data/
    spaghetti_path = os.path.join(DATA_DIR, 'spaghetti.geojson')
    with open(spaghetti_path, 'w') as f:
        json.dump(geojson_data, f, indent=2)

    print(f"Generated spaghetti.geojson with {len(features)} model tracks!")

except Exception as e:
    print(f"Warning: Could not process spaghetti model data ({e}). Creating empty file.")
    spaghetti_path = os.path.join(DATA_DIR, 'spaghetti.geojson')
    with open(spaghetti_path, 'w') as f:
        json.dump({"type": "FeatureCollection", "features": []}, f)

# --- 9. CLEANUP RAW SHAPEFILES ---
allowed_files = ['points.zip', 'pgn.zip', 'lin.zip', 'wwlin.zip', 'spaghetti.geojson']

for item in os.listdir(DATA_DIR):
    if item not in allowed_files:
        item_path = os.path.join(DATA_DIR, item)
        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
        else:
            os.remove(item_path)

print(f"Successfully processed and saved all test data for {stormname.upper()} into {DATA_DIR}!")