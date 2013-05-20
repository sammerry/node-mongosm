node-mongosm
============

This package will convert .osm files from Open Street Map and save / upsert new entries to your personal instance of mongoDB.

##Installation

ensure you have mongoDB installed on your system and Install dependencies via npm.

``` shell
npm install -d
```

##Run

In options.js set the {filename: "your_file.osm"} and run the app.
You will also want to set {upsert: true/false} to your needs.

``` shell
node app
```

##Wishlist

- Time Stamp Bucketing
- Better handling for relation refs
- Retry once on insert failure
- Commandline arguments.
- Testing vs sample .osm files
