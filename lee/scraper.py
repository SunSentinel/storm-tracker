import requests, zipfile, io
from bs4 import BeautifulSoup
from zipfile import ZipFile
import glob
import os

# import wget

## FOR A NEW STORM FILE, YOU NEED TO CHANGE LINES 10 AND 11
stormname = 'lee'
url = "https://www.nhc.noaa.gov/gis/archive_forecast_results.php?id=al13&year=2023"
page = requests.get(url)
soup = BeautifulSoup(page.content, "html.parser")


anchor = soup.find_all(lambda tag: tag.name=='a' and tag.text.endswith('.zip'))
link = anchor[-1].get('href')
folder = anchor[-1].get_text(strip=True)

# link = a['href']
# folder = a.get_text(strip=True)

landing = "https://www.nhc.noaa.gov/gis/"
final = landing+link
# wget.download(final)

## CLEAR THE EXISTING ZIP FILES
for olddata in glob.glob(stormname + '/data/*', recursive=True):
    os.remove(olddata)

r = requests.get(final)
z = zipfile.ZipFile(io.BytesIO(r.content))
z.extractall("./" + stormname + "/data")

#    for file in glob.glob('folder[0:8] + "-" + folder[14:17] + "_5day_pts'):

# with zipfile.ZipFile(stormname + '/data/pts.zip', 'w') as zipF:
#     for file in glob.glob(stormname + '/data/*5day_pts*', recursive=True):
#         zipF.write(file)

# Parse into 4 separate Zip files: line, pgn, points, wwlin
# For the time points
with zipfile.ZipFile(stormname + '/data/points.zip', 'w') as zipF:
    for file in glob.glob(stormname + '/data/*5day_pts*', recursive=True):
        full_path = file
        relative_path = stormname + '/data'
        zipF.write(file, arcname=os.path.relpath(full_path, relative_path))


# For the cone of uncertainty
with zipfile.ZipFile(stormname + '/data/pgn.zip', 'w') as zipF:
    for file in glob.glob(stormname + '/data/*5day_pgn*', recursive=True):
        full_path = file
        relative_path = stormname + '/data'
        zipF.write(file, arcname=os.path.relpath(full_path, relative_path))

# For the track
with zipfile.ZipFile(stormname + '/data/lin.zip', 'w') as zipF:
    for file in glob.glob(stormname + '/data/*5day_lin*', recursive=True):
        full_path = file
        relative_path = stormname + '/data'
        zipF.write(file, arcname=os.path.relpath(full_path, relative_path))

# For wind/hurricane advisories
with zipfile.ZipFile(stormname + '/data/wwlin.zip', 'w') as zipF:
    for file in glob.glob(stormname + '/data/*5day_wwlin*', recursive=True):
        full_path = file
        relative_path = stormname + '/data'
        zipF.write(file, arcname=os.path.relpath(full_path, relative_path))





