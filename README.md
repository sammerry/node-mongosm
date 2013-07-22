Node-Mongosm
============

Node-mongosm is a stepping stone. It bridges the gap from raw .osm file xml to MongoDB via a simple commandline interface.

##Installation

Install the latest stable build from npm. This will install the mongosm
executable to your path for easy command line use.
```
npm install mongosm
```

Optionally you can install the latest from this repo by cloning and
installing with the -d option.
```
npm install -d
```

##Run

With the standard installation of Mongodb you can start parsing from the command line
```
mongod &
mongosm -v -f "your-file.osm"
```

Alternatively in lib/options.js set the {filename: "your_file.osm"} and run the app.
You will also want to set {upsert: true/false} to your needs.

note: if upsert = false, documents which already exist in the database will not be modified
and will not be printed out in verbose mode.

```
node mongosm
```

All Mongoose [options](http://mongoosejs.com/docs/connections.html) are passed to mongoose connection, from the options.mongoose object. Uploading to an external database can be achieved by adding any settings to the mongoose: {} object in options.js

##Command-line Flags
```
  -v verbose
  -l to lowercase
  -f file path
  -s suppress errors
  -upsert upcert all entries : defaults to save
  -tb use timebucketing for osm timestamp and update timestamp
  -sc places all nodes, ways and relations in the 'geo' collection
  -k removes all attributes except ones supplied in comma separated list EX: -k way:user,timestamp
  -i includes all attributes except ones supplied in comma separated list EX: -i way:user,timestamp
  -host host name
  -db database
  -u username
  -p password
  -port port
  -h help
```

## Options

Command line options are generally preferred, but option defaults may be manually set in the [options.js](https://github.com/sammerry/node-mongosm/blob/master/options.js) file.

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

Database Options:

All [Mongoose options](http://mongoosejs.com/docs/connections.html) are supported from options.mongoose in  [options.js](https://github.com/sammerry/node-mongosm/blob/master/options.js).

##Document Filtering

By setting the options ignoreAttributes, keepAttributes per node, way or
relation you can filter the document pre save. The options should be
provided an array of the key names which are to be effected. This can also be achieved
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

When run with the timeBucket option to true or the -tb flag. You can search
and index via day month or year much more efficiently with an $exists operator.

Searches for all entries in january of 2009 would look like.
```
db.geo.find({'osmTimeBucket.2009.01':{$exists:true}});
```

##Pipe

Instead of downloading and storing the latest .osm file you can directly
pipe data from the OSM API.
```
curl "http://www.openstreetmap.org/api/0.6/node/1" | ./mongosm -upsert
```

##Wish-list

- Testing vs sample .osm files
- Support for multiple files

