# storm-tracker

This is our open-source hurricane tracker (hopefully temporarily) replacing the serverless Storm-Sentinel and Hurricane-tracker repositories, which were down on three fronts: old links, serverless, as well as mapbox.

If you need an open-source alternative, here it is.

Data landing page: https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=7
  Click on a storm to go to its personal GIS page.
Endpoint: https://projects.sun-sentinel.com/graphics/2023/storm-tracker/NAMEOFSTORM

### How to use this
1. Navigate to the hurricane's 7-day forecast interactive on NHC and download the GIS zip file for that advisory.
2. Add the zip file to the file directory's data folder.
3. TK: automated would be nice -- but for now, arrange and compress the files into 4 types: lin, pgn, points, wwlin. The result should be 4 zip files with those names. Drag those out into the data folder.
4. The map should automatically reset in local host, check and make sure everything is OK before pushing to s3.

Uses this s3 bucket: https://s3.console.aws.amazon.com/s3/buckets/projects.sun-sentinel.com?prefix=graphics/2023/storm-tracker/&region=us-east-1

You may need to cache the webpage and create an invalidation using "/*" in Cloudfront if the webpage does not re-load.
