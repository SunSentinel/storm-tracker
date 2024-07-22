# storm-tracker

This is our open-source hurricane tracker (hopefully temporarily) replacing the serverless Storm-Sentinel and Hurricane-tracker repositories, which were down on three fronts: old links, serverless, as well as mapbox.

If you need an open-source alternative, here it is.

Data landing page: https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=7
  Click on a storm to go to its personal GIS page.
Endpoint: https://sunsentinel.github.io/storm-tracker/nameofstorm or ... storm-tracker/al01 or al02 etc.

### How to use this
1. Navigate to the hurricane's 7-day forecast interactive on NHC and click on the GIS link.
2. Get the URL to the GIS page and drop it into the scraper.py file. Cheat code: Each storm will be labeled al01, 02, 03, so you can prep for the season. The scraper will download the zip files off the web, unzip them, rearrange into the 4 types of data (lin, pgn, points, wwlin) and re-zip into the files necessary for Leaflet.
3. Turn on your local live server. The map should automatically appear with data, check and make sure everything is OK before pushing to GitHub.
4. You may need to adjust the zoom of the map, this is line 4 in "app.js"
5. To set the automation, this repo uses an actions.yml page with cron.
6. More documentation here: https://docs.google.com/document/d/1qw84y9pk7uLPQugyo60Y_5Mh_oBmYJoRwgEE3TbH65o/edit?usp=sharing
