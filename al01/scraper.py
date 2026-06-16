import requests, zipfile, io
from bs4 import BeautifulSoup
from zipfile import ZipFile
import glob
import os

## CHANGE THESE VARIABLES FOR THE ACTIVE STORM
stormname = 'al01'  # Update this to match the current storm ID (e.g., 'al02', 'al03')
year = '2026'

url = f"https://www.nhc.noaa.gov/gis/archive_forecast_results.php?id={stormname}&year={year}"
page = requests.get(url)
soup = BeautifulSoup(page.content, "html.parser")

anchor = soup.find_all(lambda tag: tag.name=='a' and tag.text.endswith('.zip'))
link = anchor[-1].get('href')
folder = anchor[-1].get_text(strip=True)

landing = "https://www.nhc.noaa.gov/gis/"
final = landing + link

# Ensure the target directory exists so the script doesn't crash on a fresh run
os.makedirs('data', exist_ok=True)

## CLEAR THE EXISTING ZIP FILES IN THE ROOT DATA FOLDER
for olddata in glob.glob('data/*', recursive=True):
    os.remove(olddata)

print(f"Downloading data from: {final}")
r = requests.get(final)
z = zipfile.ZipFile(io.BytesIO(r.content))
z.extractall("./data")

# Parse into 4 separate Zip files: line, pgn, points, wwlin

# For the time points
with zipfile.ZipFile('data/points.zip', 'w') as zipF:
    for file in glob.glob('data/*5day_pts*', recursive=True):
        full_path = file
        relative_path = 'data'
        zipF.write(file, arcname=os.path.relpath(full_path, relative_path))

# For the cone of uncertainty
with zipfile.ZipFile('data/pgn.zip', 'w') as zipF:
    for file in glob.glob('data/*5day_pgn*', recursive=True):
        full_path = file
        relative_path = 'data'
        zipF.write(file, arcname=os.path.relpath(full_path, relative_path))

# For the track
with zipfile.ZipFile('data/lin.zip', 'w') as zipF:
    for file in glob.glob('data/*5day_lin*', recursive=True):
        full_path = file
        relative_path = 'data'
        zipF.write(file, arcname=os.path.relpath(full_path, relative_path))

# For wind/hurricane advisories
with zipfile.ZipFile('data/wwlin.zip', 'w') as zipF:
    for file in glob.glob('data/*5day_wwlin*', recursive=True):
        full_path = file
        relative_path = 'data'
        zipF.write(file, arcname=os.path.relpath(full_path, relative_path))

print(f"Successfully processed and saved data for {stormname.upper()}!")