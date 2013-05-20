node-mongosm
============

This package will convert .osm files from Open Street Map and save / upsert new entries to your personal instance of mongoDB.

##Installation

ensure you have mongoDB installed on your system and Install dependencies via npm.

``` shell
npm install -d
```

##Run

You will also want to add your file name and preferences to options.js prior to runtime.

``` shell4deees
node app
```

##Wishlist

- Time Stamp Bucketing
- Better handling for relation refs
- Retry once on insert failure
- Commandline arguments.
- Testing vs sample .osm files
