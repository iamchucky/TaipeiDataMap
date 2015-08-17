Input: xxx.csv opendata
1. use extractAddresses.js to generate uniqueAdd.txt
2. use phantomjs testGeocode.js to generate geocoded.txt (make sure local webserver is running)
3. use phantomjs fillVillage.js to generate geocoded_withVillage.txt
4. use fillupGeocode.js to generate 1999_processed.txt
5. copy the lines to the original 1999_processed.txt (the one with all data)
6. use genStats.js to generate data.json at upper level
