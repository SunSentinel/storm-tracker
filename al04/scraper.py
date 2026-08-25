import os
import io
import glob
import shutil
import zipfile
import requests
from bs4 import BeautifulSoup

# --- 1. BULLETPROOF DIRECTORY SETUP ---
# Find exactly where this script lives and set the data directory right next to it
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'data')

# ---------------------------------------------------
# CHANGE THESE VARIABLES FOR THE ACTIVE STORM
stormname = 'al04' 
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
# Completely wipe the data folder to prevent mixing old and new advisories
if os.path.exists(DATA_DIR):
    shutil.rmtree(DATA_DIR)

# Recreate the empty folder safely
os.makedirs(DATA_DIR, exist_ok=True)

# --- 6. DOWNLOAD AND EXTRACT ---
print(f"Downloading data from: {final}")
r = requests.get(final)
z = zipfile.ZipFile(io.BytesIO(r.content))

# Extract directly into our absolute data directory
z.extractall(DATA_DIR)

# --- 7. REPACKAGE ZIPS ---
# For the time points
with zipfile.ZipFile(os.path.join(DATA_DIR, 'points.zip'), 'w') as zipF:
    for file in glob.glob(f"{DATA_DIR}/**/*5day_pts*", recursive=True):
        zipF.write(file, arcname=os.path.relpath(file, DATA_DIR))

# For the cone of uncertainty
with zipfile.ZipFile(os.path.join(DATA_DIR, 'pgn.zip'), 'w') as zipF:
    for file in glob.glob(f"{DATA_DIR}/**/*5day_pgn*", recursive=True):
        zipF.write(file, arcname=os.path.relpath(file, DATA_DIR))

# For the track
with zipfile.ZipFile(os.path.join(DATA_DIR, 'lin.zip'), 'w') as zipF:
    for file in glob.glob(f"{DATA_DIR}/**/*5day_lin*", recursive=True):
        zipF.write(file, arcname=os.path.relpath(file, DATA_DIR))

# For wind/hurricane advisories 
with zipfile.ZipFile(os.path.join(DATA_DIR, 'wwlin.zip'), 'w') as zipF:
    for file in glob.glob(f"{DATA_DIR}/**/*wwlin*", recursive=True):
        if not file.endswith('.zip'): # <-- THIS PREVENTS THE ZIP BOMB
            zipF.write(file, arcname=os.path.relpath(file, DATA_DIR))

# --- 8. CLEANUP RAW FILES ---
# Keep only our 4 generated zip files to keep the GitHub repo small
allowed_zips = ['points.zip', 'pgn.zip', 'lin.zip', 'wwlin.zip']

for item in os.listdir(DATA_DIR):
    if item not in allowed_zips:
        item_path = os.path.join(DATA_DIR, item)
        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
        else:
            os.remove(item_path)

print(f"Successfully processed, cleaned, and saved data for {stormname.upper()} into {DATA_DIR}!")