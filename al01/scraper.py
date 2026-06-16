import requests, zipfile, io
from bs4 import BeautifulSoup
from zipfile import ZipFile
import glob
import os
import shutil

## CHANGE THESE VARIABLES FOR THE ACTIVE STORM
stormname = 'al01' 
year = '2026'

url = f"https://www.nhc.noaa.gov/gis/archive_forecast_results.php?id={stormname}&year={year}"
page = requests.get(url)
soup = BeautifulSoup(page.content, "html.parser")

anchor = soup.find_all(lambda tag: tag.name=='a' and tag.text.endswith('.zip'))
link = anchor[-1].get('href')

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

# Note the ** added to the glob paths to search inside the NHC subfolders!

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
    for file in glob.glob('data/**/*5day_wwlin*', recursive=True):
        zipF.write(file, arcname=os.path.relpath(file, 'data'))

print(f"Successfully processed and saved data for {stormname.upper()}!")