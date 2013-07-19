

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

      self.save.call(way);
      cb();
    }
  }

  var out = 0;
  var tin = 0;
  function recurseRelation (doc, cb) {
    var members = doc.members;
    var index = members.length;
    var count = members.length-1;
    for (index;--index;) {


      if (members[index] === "is_in") continue; // skip parent refferences
      var type = members[index].type;
      var Model = doc.model(type);
      Model.findOne({osm_id: members[index].ref})
      .populate("members")
      .exec(function (err, subdoc) {
        if (!!err) return console.log(err);
        count--;
        if (subdoc === null) {
          console.log("missing sub-" + Model.modelName);
        } else {
          if (subdoc.type === 'way') {
            var newCoord = subdoc.loc.coordinates;
            var b = members.length;
            members[index].coordinates = newCoord;
          }
        }
        if (count===0) {
          self.save.call(doc);
          cb();
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

    if (self.output.way === self.input.way) {
      console.log("Starting to process the relaitons");
      self.relation.concurrency = 200;
      self.relation.process();
    }
  };


  self.node = async.queue(self.processNode, 2);
  self.way  = async.queue(self.processWay, 0);
  self.relation = async.queue(self.processRelation, 0);

  self.node.drain = function () {
    self.nodeQueueEmpty = true;
   };
  self.way.drain = function () {
    self.wayQueueEmpty = true;
    if (!!options.verbose) console.log('Way Queue Empty');
    console.log(self.input.nodes, self.output.nodes)
  };
  self.relation.drain = function () {
    self.relationQueueEmpty = true;
    if (!!options.verbose) console.log('Relation Queue Empty');
  };

  if (!!options.verbose) {
    self.relation.saturated = self.way.saturated = function () {
      console.log('Concurrency Saturated: Queueing Documents');
    };
  }


  return self;
}

module.exports = theQ;

