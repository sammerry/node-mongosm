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
  -v verbose
  -f file path
  -l to lowercase
  -u upcert all entries : defaults to save
  -s suppress errors
  -host host name
  -port port
  -k document filter: removes all attributes except ones supplied in comma separated list EX: -k way:user,timestamp
  -i document filter: includes all attributes except ones supplied in comma separated list EX: -i way:user,timestamp
  -db database
  -h help
```

## Options

Commandline options are generally preferred, but option defaults may be manually set in the [options.js][https://github.com/sammerry/node-mongosm/blob/master/options.js] file.

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
  lowercase:true
```

Document Filter Options:
```
  ignoreAttributes: []  // items to excluded
  keepAttributes: [] // strict list of items to include
```

only one document filter type should be needed

##Wishlist

- Time Stamp Bucketing
- Better handling for relation refs
- Retry once on insert failure
- Testing vs sample .osm files
- Support for multiple files
