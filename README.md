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

note: if upsert = false, documents which already exist in the database will not be modefied
and will not be printed out in verbose mode.

```
node mongosm
```

alternatively you can run it from the commandline with
```
./mongosm -v -f "your-file.osm"
```

##Command-line Flags
```
  -v verbose
  -f file path
  -l to lowercase
  -u upcert all entries : defaults to save
  -s suppress errors
  -host host name
  -port port
  -tb use time bucketing.
  -sc place all nodes, ways and relations in the same collection.
  -k document filter: removes all attributes except ones supplied in comma separated list EX: -k way:user,timestamp
  -i document filter: includes all attributes except ones supplied in comma separated list EX: -i way:user,timestamp
  -db database
  -h help
```

## Options

Commandline options are generally preferred, but option defaults may be manually set in the [options.js](https://github.com/sammerry/node-mongosm/blob/master/options.js) file.

Standard Options:
```
  verbose: false
  filename: "example-osm/way.osm"
  host: "localhost"
  port: "27017"
  database: "test"
  suppressErrors: false
  useOriginalID: false
  upsert: false
  xmlns: true
  strict: false
  lowercase: true
  singleCollection: false
  timeBucket: false
```

Document Filter Options:
```
  ignoreAttributes: []  // items to excluded
  keepAttributes: [] // strict list of items to include
```
only one document filter type should be needed

Way Specific Options:
```
  geometry: true // include the generated LineString or Polygon
  nodes: false // include the array of node references that make up the way
```

##Document Filtering

By setting the options ignoreAttributes, keepAttributes per node, way or
relation you can filter the document pre save. The options should be
provided an array of the key names which are to be effected. This can also be acheived
by using the -k or -i command line flag in the following format <elementName>:<key>,<key>.

Via Command Line:
```
./mongosm -v -k way:loc,user
```

Via Options:
```
way {
  keepAttributes: ['loc','user']
}
```

##Time Stamp Bucketing

When run with the timeBucket option to true or the -tb flag. You can efficiently search
and index via day month or year much more efficiently with an $exists operator.

Searches for all entries in january of 2009 would look like.
```
db.geo.find({'osmTimeBucket.2009.01':{$exists:true}});
```

##Wishlist

- Secure handling of User and Pass for remote db upload.
- Better handling for relation refs
- Retry once on insert failure
- Testing vs sample .osm files
- Support for multiple files
