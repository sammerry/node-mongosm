var fs = require("fs"),
    strict = false,
    options = require("options.js"),
    mongoose = require('./node_modules/mongoose');

var db = mongoose.connect('mongodb://localhost/test');
mongoose.connection.on('open', function () {

  // on connection to db start parsing.
  var saxStream = require("sax").createStream(strict, options);
  // TODO: add dots to show activity every 2 sec?
  saxStream.on("opentag",appendData);
  fs.createReadStream(options.filename)
    .pipe(saxStream);

  saxStream.on("end", shutDown);

  saxStream.on("error", function (e) {
    console.error("error!", e)
    this._parser.error = null
    this._parser.resume()
  });

});

var Node_Schema = mongoose.Schema({
  _id: Number,
  type: String,
  loc: {
    type: Object,
    coordinates: {type: [Number], index: '2dsphere'}
  },
  version: Number,
  uid: Number,
  user: String,
  changeset: Number,
  timestamp: Date,
  visible: Boolean,
  tags: {}
},{collection: "nodes" });
mongoose.model('node', Node_Schema);
var Node = db.model('node');

var Way_Schema = mongoose.Schema({
  _id: Number,
  type: String,
  loc: {
    type: Object,
    coordinates: [{ type: Number, ref: 'node' }]
  },
  version: Number,
  uid: Number,
  user: String,
  changeset: Number,
  timestamp: Date,
  visible: Boolean,
  tags: {}
},{collection: "ways" });
mongoose.model('Way', Way_Schema);
var Way = db.model('Way');

var Relation_Schema = mongoose.Schema({
  _id: Number,
  type: String,
  loc: {
    type: Object,
    coordinates: [{}]
  },
  version: Number,
  uid: Number,
  user: String,
  changeset: Number,
  timestamp: Date,
  visible: Boolean,
  tags: {}
},{collection: "relations" });
mongoose.model('Relation', Relation_Schema);
var Relation = db.model('Relation');


var entry;
function appendData (node)  {

  switch(node.name)
  {
    
    case "node":
      if (!!entry) {
        save();
      }
      entry = new Node();
      var lat = parseInt(node.attributes.lat.value);
      var lng = parseInt(node.attributes.lon.value);
      entry.set("loc.type", "Point");
      entry.set("loc.coordinates", [lat,lng]);
      prepBaseNode(node);
      break;

    case "tag":
      var key   = "tags." + node.attributes.k.value.replace(/:/, "."),
          value = node.attributes.v.value;
      entry.set(key, value);
      break;

    case "nd":
      var ref = node.attributes.ref.value;
      var coord = entry.get("loc.coordinates", Array);
      coord.push(ref);
      entry.set("loc.coordinates",  coord);
      break;

    case "way":
      if (!!entry) {
        save();
      }
      entry = new Way();
      entry.set("loc", {type:"LineString", coordinates: []});
      prepBaseNode(node);
      break;

    case "member":
      var val = {}
      for (var attribute in node.attributes) {
        // TODO: this does not account for namespacing
        val[attribute] = node.attributes[attribute].value;
      }
      var coord = entry.get("loc.coordinates", Array);

      // TODO: this should be an object not a string
      coord.push(JSON.stringify(val));
      entry.set("loc.coordinates", coord);
      break;

    case "relation":
      if (!!entry) {
        save();
      }
      entry = new Relation();
      entry.set("loc", {type:"MultiPolygon", coordinates: []});
      prepBaseNode(node);
      break;

    case "osm":
      var val = {};
      for (var attribute in node.attributes) {
        val[attribute] = node.attributes[attribute].value;
      }
      console.log("OSM Data::: ", val)
      break;

    case "bounds":
      var val = {};
      for (var attribute in node.attributes) {
        val[attribute] = node.attributes[attribute].value;
      }
      console.log("bounds::: ", val)
      break;


    default:
      console.log(node);
      break;

  }
}

function prepBaseNode (node) {    
  entry.set("_id",  node.attributes.id.value);
  entry.set("type",  node.name);
  for (var attribute in node.attributes) {
    if (attribute == "id" || attribute == "lat" || attribute == "lon") continue;
    entry.set(attribute, node.attributes[attribute].value);
  }
}

function shutDown() {
  save();
  mongoose.connection.close();
}

function save() {
    
  function saveCB( err ) {
    if (!!err) console.log(err);
    if (!!options.verbose) {
      console.log(entry);
      console.log(entry,"\n\n################################################")
    }
  }
  function upsert () {
    var options = {upsert: true};
    var value = entry.toJSON();
    var query = {_id: value._id};
    delete value._id;
    mongoose
      .models[entry.type]
      .findOneAndUpdate(query, value, options, saveCB);
  }

  // TODO: determine if points are a polygon or line
  // then save loc.type as LineString, Polygon or Point;

  if (!!options.upsert) {
    upsert();
  } else {
    entry.save(saveCB);
  }
}

