

var async = require("./../node_modules/async");

function theQ (options, Node) {

  var self = this;
  var idType;

  self.nodeQueueEmpty = true;
  self.wayQueueEmpty = true;
  self.relationQueueEmpty = true;

  self.output = {};
  self.input = {};

  // building options
  if (!!options.useOriginalID) {
    idType = "_id";
  } else {
    idType = "osm_id";
  }

  if (!!options.upsert) {
    self.save = upsert;
  } else {
    self.save = save;
  }

  var relationFunction;
  if (!!options.relation.populateGeometry) {
    options.way.populateGeometry = true;
    relationFunction = recurseRelation;
  } else {
    relationFunction = standardRelation;
  }

  var wayFunction;
  if (!!options.way.populateGeometry) {
    wayFunction = populateWayGeo;
  } else {
    wayFunction = standardWay;
  }

  // private functions
  function saveCB (err, doc) {
    if (!!err) return console.log(err);
    var type = doc.constructor.modelName;
    self.input[type] = self.input[type]+1 || 1;
    if (!!options.verbose) {
      console.log(doc);
      process.stdout.write("\n\n################################################\n");
    }
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
    var Node = way.constructor.base.models.node;
    var query = {osm_id: {$in: way.loc.nodes}};
    var select = {"loc.coordinates": true};
    select[idType] = true;

    Node.find(query, select, populateWay);

    function populateWay (err, doc) {
      // TODO: Research Sharding - on average it takes 3 Milliseconds to
      // sort and populate the document. Querying the nodes is the majority of lag.
      //
      // with 2.2 Milion nodes i was seeing anywhere from 7 to 900 saves every 3 sec.
      // and was maxing out my laptop. Not so sure sharding will help locally but it
      // may speed up it a little.
      if (err) return console.log(err, way);

      var i = way.loc.nodes.length;
      var coords = [];

      for (i;i--;) {// array to match to
        var b = doc.length;
        var nodeID = way.loc.nodes[i];
        for (b;b--;) {// array being matched
          if (doc[b] && doc[b][idType] === nodeID) {
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
;
      self.save.call(way);
      cb();
    }
  }

  function recurseRelation (doc, cb) {
    // TODO: hangs. for some reason it loses track of the callback
    // and stops consuming the queue;
    var members = doc.members;
    var i = members.length;

    var count = 0;
    function finished(osm_id, newCoord, callback) {
      var b = members.length;
      for (b;b--;) {
        if (members[b].ref !== osm_id) continue;
        members[b].coordinates = newCoord;
      }
      if (members.length === count) {
        self.save.call(doc);
        if (!!callback) callback();
      }
    }

    for (i;i--;) {
      if (members[i] === "is_in") continue; // skip parent refferences
      var type = members[i].type;
      var Model = doc.model(type);
      Model.findOne({osm_id: members[i].ref}, function (err, subdoc) {
        if (!!err) return console.log(err);
        count++;
        if (subdoc === null) {
          console.log("missing sub-" + Model.modelName);
          return;
        }
        if (subdoc.type === 'relation') {
          recurseRelation.call(subdoc, subdoc);
        } else {
          finished(subdoc.osm_id, subdoc.loc.coordinates, cb);
        }
      });
    }
  }

  function standardWay (way, cb) {
    var isCircularId = way.loc.nodes[0] === way.loc.nodes[way.loc.nodes.length-1];
    if (isCircularId) {
      way.set( 'loc.type', 'Polygon');
    } else {
      way.set( 'loc.type', 'LineString');
    }
    self.save.call(way);
    cb();
  }

  function standardRelation (relation,cb) {
    self.save.call(relation);
    cb();
  }

  // public queues
  self.processNode = function (node, cb) {
    self.wayQueueEmpty = false;
    var type = node.constructor.modelName;
    self.output[type] = self.output[type]+1 || 1;
    node.set("loc.type", "Point");
    self.save.call(node);
    cb();
  };

  self.processWay = function (way, cb) {
    self.wayQueueEmpty = false;
    var type = way.constructor.modelName;
    self.output[type] = self.output[type]+1 || 1;
    wayFunction(way,cb);
  };

  self.processRelation = function (relation, cb) {
    self.relationQueueEmpty = false;
    var type = relation.constructor.modelName;
    self.output[type] = self.output[type]+1 || 1;
    relationFunction(relation,cb);
  };


  self.node = async.queue(self.processNode, 300);
  self.way  = async.queue(self.processWay, 300);
  self.relation = async.queue(self.processRelation, 300);

  self.node.drain = function () {
    self.nodeQueueEmpty = true;
  };
  self.way.drain = function () {
    self.wayQueueEmpty = true;
    console.log('Way Queue Empty');
  };
  self.relation.drain = function () {
    self.relationQueueEmpty = true;
    console.log('Relation Queue Empty');
  };

  self.relation.saturated = self.way.saturated = function () {
    console.log('Concurrency Saturated: Queueing Documents');
  };


  return self;
}

module.exports = theQ;

