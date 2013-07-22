

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
    relationFunction = populateRelation;
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

  function populateRelation (relation, cb) {
    var members = relation.members;
    var index = members.length;
    var typeList = {};

    for (index;--index;) {
      var type = members[index].type;
      var ref = members[index].ref;
      typeList[type] = typeList[type] || [];
      typeList[type].push(ref);
    };

    if (!!typeList.way && !!typeList.relation) return cb();
    var Way = relation.constructor.base.models.way;
    Way.find({osm_id: {$in:typeList.way}})
    .exec(function (err, doc) {
      if (!!err || !!!doc) return console.log(err);
      var i = members.length;
      for (i;--i;) {
        var d = doc.length;
        var type = members[index].type;
        var ref = members[index].ref;
        for (d;d--;) {
          if (members[i].ref !== doc[d].osm_id) continue;
          members[i].coordinates = doc[d].loc.coordinates;
        }
        if (!!options.verbose && !!members[i].coordinates)
          console.log(members[i].ref + ":no matching " + Model.modelName)
      };
      self.save.call(relation);
    });
    cb();
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
    var type = node.constructor.modelName;
    self.output[type] = self.output[type]+1 || 1;
    node.set("loc.type", "Point");
    self.save.call(node);
    cb();


  };

  self.processWay = function (way, cb) {
    var type = way.constructor.modelName;
    self.output[type] = self.output[type]+1 || 1;
    wayFunction(way,cb);
  };

  self.processRelation = function (relation, cb) {
    var type = relation.constructor.modelName;
    self.output[type] = self.output[type]+1 || 1;
    relationFunction(relation,cb);
  };


  self.node = async.queue(self.processNode, 2);
  self.way  = async.queue(self.processWay, 0);
  self.relation = async.queue(self.processRelation, 0);

  self.way.drain = function () {
    if (!!options.verbose) console.log('Way Queue Empty');
  };
  self.relation.drain = function () {
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

