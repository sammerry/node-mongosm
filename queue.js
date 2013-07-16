

var async = require("async");

function theQ (options,testNode) {

  var self = this;
  var idType;

  if (options.useOriginalID) {
    idType = "_id";
  } else {
    idType = "osm_id";
  }

  self.output = {}
  self.input = {};

  if (options.upsert) {
    self.save = upsert;
  } else {
    self.save = save;
  }

  var wayFunction
  if (!!options.way.populateGeometry) {
    wayFunction = populateWayGeo;
  } else {
    wayFunction = standardWay;
  }

  function saveCB (err, doc) {
    if (!!err) return console.log(err);
    var type = doc.constructor.modelName;
    self.input[type] = self.input[type]+1 || 1;
  }

  function upsert () {
    var Model = this.model(this.constructor.modelName),
        value = this.toObject(),
        query = {};
    query[idType] = value.osm_id;
    delete value._id;
    Model.findOneAndUpdate(query, value, {upsert: true}, saveCB);
  }

  function save() {
    this.save(saveCB);
  }

  function populateWayGeo (way, cb) {
    var Node = way.model('node');
    var query = {};
    query[idType] = {$in: way.loc.nodes};
    var select = {"loc.coordinates": true};
    select[idType] = true;

    Node.find( query, select, function (err, doc) {
      if (err) return console.log(err, way);
      console.log("arguments", arguments);

      var i = way.loc.nodes.length;
      var b = doc.length;
      var coords = [];

      for (i;i--;) {// array to match to
        for (b;b--;) {// array being matched
          var nodeID = way.loc.nodes[i];
          if (doc[b][idType] === nodeID) {
            coords.unshift(doc[b].loc.coordinates);
            continue;
          }
        }
      }

      way.set('loc.coordinates', coords);

      var isCircularId = way.loc.nodes[0] === way.loc.nodes[way.loc.nodes.length-1];
      var isCircularLtLng = coords[0] === coords[coords.length-1];

      if (isCircularId || isCircularLtLng ) {
        way.set('loc.type', 'Polygon');
      } else {
        way.set('loc.type', 'LineString');
      }

      way.save(saveCB);
      cb();
    });
  }

  function standardWay (way, cb) {
    if (isCircularId) {
      way.set( 'loc.type', 'Polygon');
    } else {
      way.set( 'loc.type', 'LineString');
    }
    way.save(saveCB);
    cb();
  }

  self.processNode = function (node, cb) {
    var type = node.constructor.modelName;
    self.output[type] = self.output[type]+1 || 1;
    node.set("loc.type", "Point");
    self.save.call(node);
    cb();
  };

  self.processWay = function (way, cb) {
    var type = node.constructor.modelName;
    self.output[type] = self.output[type]+1 || 1;
    wayFunction(way,cb);
  };

  self.processRelation = function () {
    console.log("Relations: TODO");
  };

  self.node = async.queue(self.processNode, 5000);
  self.way  = async.queue(self.processWay, 5000);
  self.relation = async.queue(self.processRelation, 5000);

  return self;
};

module.exports = theQ;

