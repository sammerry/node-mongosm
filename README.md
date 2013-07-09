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

## Options
```
OSM XML includes several attributes on the nodes, ways and relations:
   timestamp
   user
   uid
   visible
   version
   changeset

By default, all of these attributes are imported in to the database. To alter this, you can use:
```
   keptAttributes: ['attribute1', 'attribute2', ...]
   ignoredAttributes: ['attribute1', 'attribute2', ...]
```
For example, to only keep the user attribute for ways, you would have in the options:
```
  ways: {
    keptAttributes: ['user']
  }
```
To remove the timestamp and visible attributes for nodes, you would have in the options:
```
  node: {
    ignoredAttributes: ['user']
  }
```

##Wishlist

- Time Stamp Bucketing
- Better handling for relation refs
- Retry once on insert failure
- Testing vs sample .osm files
- Support for multiple files
