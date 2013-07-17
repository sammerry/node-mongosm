/* jshint -W004 */

var fs = require("fs"),
    options = require('./options.js');

require('./commandline.js')(options);
require('./../node_modules/date-utils');

var mongoose = require("./schema/index.js")(options),
    queue = require("./queue.js")(options);
    saxStream = require("./../node_modules/sax").createStream(options.strict, options);

var Node = mongoose.model('node');
var Way = mongoose.model('way');
var Relation = mongoose.model('relation');
var entry;
var relationIsDependant = false;
var eof = false;

// Accounting

var readNodes = 0;
var readWays = 0;
var readRelations = 0;
var lastReadNodes = 0;
var lastReadWays = 0;
var lastReadRelations = 0;
var lastSavedNodes = 0;
var lastSavedWays = 0;
var lastSavedRelations = 0;


// TODO: break logging, timing and finalEntry in to seperate logging file.
function log() {
  var savedNode =  queue.input.node || 0;
  var queuedNode = queue.output.node || 0;
  var savedWay =  queue.input.way || 0;
  var queuedWay = queue.output.way || 0;
  var queuedRelation = queue.output.relation || 0;
  var savedRelation = queue.input.relation || 0;

  var nodeReadSpeed  = readNodes - lastReadNodes; // from read to theQ
  var nodeWriteSpeed = savedNode - lastSavedNodes; // from read to saved in mongo
  var wayReadSpeed   = readWays - lastReadWays;
  var wayWriteSpeed  = savedWay - lastSavedWays; 
  var realtionWriteSpeed  = savedRelation - lastSavedRelations; 
  var relationReadSpeed  = readRelations - lastReadRelations; 

  console.log("nodes: "  + savedNode + "/" + queuedNode + "/" + readNodes + " read speed: " + nodeReadSpeed + " write speed: " + nodeWriteSpeed);
  console.log("ways: " + savedWay + "/" + queuedWay + "/" + readWays + " read speed: " + wayReadSpeed + " write speed: " + wayWriteSpeed);
  console.log("relations: " + savedRelation + "/" + queuedRelation + "/" + readRelations );

  lastSavedNodes = savedNode;
  lastSavedWays = savedWay;
  lastSavedRelations = savedRelation
  lastReadNodes = readNodes
  lastReadWays = readWays
  lastReadRelations = readRelations
}

// TODO: evented call back from queue.js;
var startTime = new Date()
function timing() {
  var endTime = new Date();

  var hours = startTime.getHoursBetween(endTime);
  var minutes = startTime.getMinutesBetween(endTime) - (hours * 60);
  var seconds = startTime.getSecondsBetween(endTime) - (minutes * 60);

  process.stdout.write("Total Time: ")
  process.stdout.write(hours + " H ");
  process.stdout.write(minutes + "M ");
  process.stdout.write(seconds + "S");
  process.stdout.write("\n");
}

// TODO: evented call back from queue.js with a context of final node type.
//
function isFinalEntry () {
  log();
  if (eof && queue.nodeQueueEmpty && queue.wayQueueEmpty && queue.relationQueueEmpty) {
    timing();
    clearInterval(intervalID);
    mongoose.connection.close();
  }
}

var intervalID;
mongoose.connection.on('open', function () {

  console.log("Starting to process the nodes");
  console.log("Logging Legend: Successful Save / Queue Called / Read From Stream")

  intervalID = setInterval(isFinalEntry, 3000);

  saxStream.on("opentag", parse);
  saxStream.on("closetag", closetag);
  fs.createReadStream(options.filename)
    .pipe(saxStream);

  saxStream.on("end", function() {
    eof = true;
    timing();
  });

  saxStream.on("error", function (e) {
    console.error("error!", e);
    this._parser.error = null;
    this._parser.resume();
  });
});

function parse (xmlNode)  {

  switch(xmlNode.name)
  {
    case "node":
      readNodes++;
      entry = new Node();
      var lat = parseFloat( xmlNode.attributes.lat.value );
      var lng = parseFloat( xmlNode.attributes.lon.value );
      entry.set("loc.coordinates", [lng,lat]);
      prepBaseNode(xmlNode);
      break;

    case "tag":
      var key   = "tags." + xmlNode.attributes.k.value.replace(/:/, "."),
          value = xmlNode.attributes.v.value;
      entry.set(key, value);
      break;

    case "nd":
      entry.loc.nodes.push(parseInt(xmlNode.attributes.ref.value, 10));
      break;

    case "way":
      readWays++;
      finishedReadingNodes = true;
      entry = new Way();
      prepBaseNode(xmlNode);
      break;

    case "member":
      var member = {};
      for (var attribute in xmlNode.attributes) {
        var elm = xmlNode.attributes[attribute];
        if (attribute === "ref") elm.value = parseInt(elm.value);
        member[attribute] = elm.value;
      }
      entry.members.push(member);
      break;

    case "relation":
      readRelations++;
      finishedReadingWays = true;
      entry = new Relation();
      entry.members = [];
      prepBaseNode(xmlNode);
      break;

    case "osm":
      var val = {};
      for (var attribute in xmlNode.attributes) {
        val[attribute] = xmlNode.attributes[attribute].value;
      }
      break;

    case "bounds":
      var val = {};
      for (var attribute in xmlNode.attributes) {
        val[attribute] = xmlNode.attributes[attribute].value;
      }
      break;

    default:
      console.log(xmlNode);
      break;
  }
}

function closetag (tagName) {
  switch(tagName)
  {
    case "node":
      queue.node.push(entry);
      break;

    case "way":
      queue.way.push(entry);
      break;

    case "relation":
      queue.relation.push(entry);
      break;
  }
}

function prepBaseNode (xmlNode) {
  entry.set("osm_id",  xmlNode.attributes.id.value);
  entry.set("type",  xmlNode.name);
  for (var attribute in xmlNode.attributes) {
    if (attribute === "id" || attribute === "lat" || attribute === "lon") continue;
    entry.set(attribute, xmlNode.attributes[attribute].value);
  }
}


