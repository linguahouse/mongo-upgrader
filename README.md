# mongo-upgrader

This is a simple npm package to manage MongoDB database upgrades. 
It will connect to a server, select a given database, check the upgraded version if it has it, and run the upgrade scripts in numerical order. The upgrade scripts are in ```alt[0-9].js``` format.

Available options:
-h HOST address of MongoDB server
-d DATABASE name
-f FOLDER which has the alt scripts

Each alt script is ran in context of Mongo shell, and includes the underscore library.

```
mongo-upgrader [-h] [-v] -u HOST -d DATABASE -f FOLDER
```