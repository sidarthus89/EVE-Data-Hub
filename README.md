# EVE Data Hub

This is my first real big coding project. I took a lot of inspiration from https://evemarketbrowser.com and https://market.fuzzwork.co.uk/

It is basicly a simplied site structure for pulling ESI (EVE Swagger Interface) data and present is on a "static" html page. Then hosting it here on GitHub Pages.

# Step 1: Pulling SDE downn.
## EVE Statice Data Export (SDE) Links
https://developers.eveonline.com/docs/services/sde/ (Full Page)

https://eve-static-data-export.s3-eu-west-1.amazonaws.com/tranquility/sde.zip (Full Zip Download)

# Step 2: Extract Necessary Data
Now, this can be what ever you want to pull down, in whatever format you want. But for this, since I used the data to populate the website tables and menus, I only selected what was relevant to my setup.

[sdeDataExtractor.py] (link)

Make sure that the ```txt sdeDataExtractor.py``` is in the same directory as the unzipped SDE folder you downloaded in Step 1.

```txt
your-project-folder/
    ├── sdeDataExtractor.py     <-----download from the link in this step.
    └── sde/    <-----download and unzipped from link in Step 1.
        ├── universe/
        │   └── eve/
        │       └── RegionName (eg:TheForge)/
        │           ├── region.yaml
        │           └── ConstellationName (eg: Anttanen)/
        │               ├── constellation.yaml
        │               └── SystemName (eg: Geras)/
        │                   └── solarsystem.yaml
        ├── fsd/
        │   ├── marketGroups.yaml
        │   ├── types.yaml
        │   └── stationServices.yaml
	|   └── marketGroups.yaml
        └── bsd/
            └── staStations.yaml
```

The script will take about 15mins to run, recursivly, to crawl the SDE folder for the items. The biggest chunk of time should come from pulling out the "solarsystem.yaml" files.

It then merges the data into the respective .json files.

After the script is done, you should see 3 new files:
-stations.json       <-- Checks for stationIDs and names to help populate the station column in the Buyers and Sellers tables.>
-locations.json      <-- Handles the location drop down selections at the top of the market menu.>
-marketMenu.json     <-- Used for poppulateing a clone of the ingame market menu and items in it. No pricing.>



## Build your Site
Then build out your html, javascript and css. I have copies of all the files I used to build the site in the repo.


## Under the Hood
Just a recap of the files I identified to pull for the script. This will probably change based on your use case.
 
reigon.yaml 
```text
sde\universe\eve\TheForge\region.yaml
```
constellation.yaml  
```text
sde\universe\eve\TheForge\Anttanen\constellation.yaml
```
system.yaml  
```text
sde\universe\eve\TheForge\Anttanen\Geras\solarsystem.yaml  
```
staStations.yaml  
```text
sde\bsd\staStations.yaml
```
marketGroups.yaml
```text
de\fsd\marketGroups.yaml
```
types.yaml
```text
sde\fsd\types.yaml
```
