import requests, zipfile, io
from bs4 import BeautifulSoup
import glob
import os
import shutil

# --- FORCE PYTHON TO USE THIS SCRIPT'S DIRECTORY ---
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)
# ---------------------------------------------------

## CHANGE THESE VARIABLES FOR THE ACTIVE STORM
stormname = 'al02' 
year = '2026'

url = f"https://www.nhc.noaa.gov/gis/archive_forecast_results.php?id={stormname}&year={year}"
page = requests.get(url)
soup = BeautifulSoup(page.content, "html.parser")

# 1. Get ONLY the zip files that have '5day' in their name
anchors = soup.find_all(lambda tag: tag.name=='a' and '5day' in tag.text and tag.text.endswith('.zip'))

# 2. Filter out intermediate advisories (e.g., 001A.zip)
full_advisories = [a for a in anchors if a.text.replace('.zip', '')[-1].isdigit()]

if not full_advisories:
    print(f"Error: No full 5-day advisories found for {stormname.upper()} {year}.")
    exit()

# 3. Grab the latest FULL 5-day advisory
link = full_advisories[-1].get('href')

landing = "https://www.nhc.noaa.gov/gis/"
final = landing + link

# Completely wipe the data folder to prevent mixing old and new advisories
if os.path.exists('data'):
    shutil.rmtree('data')
os.makedirs('data', exist_ok=True)

print(f"Downloading data from: {final}")
r = requests.get(final)
z = zipfile.ZipFile(io.BytesIO(r.content))
z.extractall("./data")

# For the time points
with zipfile.ZipFile('data/points.zip', 'w') as zipF:
    for file in glob.glob('data/**/*5day_pts*', recursive=True):
        zipF.write(file, arcname=os.path.relpath(file, 'data'))

# For the cone of uncertainty
with zipfile.ZipFile('data/pgn.zip', 'w') as zipF:
    for file in glob.glob('data/**/*5day_pgn*', recursive=True):
        zipF.write(file, arcname=os.path.relpath(file, 'data'))

# For the track
with zipfile.ZipFile('data/lin.zip', 'w') as zipF:
    for file in glob.glob('data/**/*5day_lin*', recursive=True):
        zipF.write(file, arcname=os.path.relpath(file, 'data'))

# For wind/hurricane advisories 
with zipfile.ZipFile('data/wwlin.zip', 'w') as zipF:
    for file in glob.glob('data/**/*wwlin*', recursive=True):
        if not file.endswith('.zip'): # <-- THIS PREVENTS THE ZIP BOMB
            zipF.write(file, arcname=os.path.relpath(file, 'data'))

# --- NEW: CLEANUP RAW FILES ---
# Keep only our 4 generated zip files to keep the GitHub repo small
allowed_zips = ['points.zip', 'pgn.zip', 'lin.zip', 'wwlin.zip']
for item in os.listdir('data'):
    if item not in allowed_zips:
        item_path = os.path.join('data', item)
        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
        else:
            os.remove(item_path)

print(f"Successfully processed, cleaned, and saved data for {stormname.upper()}!")