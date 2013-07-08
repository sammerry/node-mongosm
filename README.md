node-mongosm
============

This package will convert .osm files from Open Street Map and save / upsert new entries to your personal instance of mongoDB.

##Installation

ensure you have mongoDB installed on your system and Install dependencies via npm.

```
npm install -d
```

##Run

In options.js set the {filename: "your_file.osm"} and run the app.
You will also want to set {upsert: true/false} to your needs.

```
node mongosm
```

alternatively you can run it from the commandline with
```
./mongosm -v -f "your-file.osm"
```

##Command-line Flags
```
  -v    verbose
  -f    file path
  -l    to lowercase
  -u    upcert all entries : defaults to save
  -host host name
  -db   database
  -h    help
```

##Wishlist

- Time Stamp Bucketing
- Better handling for relation refs
- Retry once on insert failure
- Testing vs sample .osm files
- Support for multiple files
