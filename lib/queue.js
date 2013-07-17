

var async = require("./../node_modules/async");

function theQ (options, Node) {

  var self = this;
  var idType;

  self.output = {};
  self.input = {};

  // building options
  if (options.useOriginalID) {
    idType = "_id";
  } else {
    idType = "osm_id";
  }

  if (!!options.upsert) {
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
    var query = {};
    query[idType] = {$in: way.loc.nodes};
    var select = {"loc.coordinates": true};
    select[idType] = true;

    Node.find( query, select, populateWay);

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

  // public queues
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

  self.processRelation = function (relation, cb) {
    var type = node.constructor.modelName;
    self.output[type] = self.output[type]+1 || 1;

    // TODO: Create different geometries depending on the relations tags, e.g. type=multipolygon should be a
    //       MultiPolygon.
    // TODO: The following might also break if a relation includes a relation as a member, but the
    //       included relation has not been processed yet.

    var counter = relation.members.length;
    var features = [];

    for (var index = 0; index < relation.members.length; index++) {
      var member = relation.members[index];
      var query = {};
      query[idType] = member.ref;

      models[member.type].findOne(query, function(err, object) {
        if (!!err) return console.log(err);

        if (object == null) {
          console.log("Warning, generating incomplete geometry for relation " + relation.osm_id + " due to missing member " + member.ref + " (" + member.type + ")");
          object = { loc: undefined }; // Such that the following code will not break
        }

        features[index] = { type: "Feature", geometry: object.loc, role: member.role };
        // TODO: Slightly non standard here as the above feature contains a role?
        counter--;
        if (counter == 0) {
          relation.set("loc", { type: "FeatureCollection", features: features });
          save(Relation, relation);
        }
      });
    }

    /*
function sortDependantRelations() {
  for (var i=0; i<dependantRelationQueue.length; i++) {
    var relation = dependantRelationQueue[i];

    // Create a list of all the members which are relations
    var relationMembers = []
    for (var m=0; m<relation.members.length; m++) {
      var member = relation.members[m];
      if (member.type === "relation")
        relationMembers.push(parseInt(member.ref));
    }

    // For every relation that is scheduled to be processed after this one
    for (var j=i+1; j<dependantRelationQueue.length; j++) {
      var otherRelation = dependantRelationQueue[j];

      // Check if it is depended on by 'relation'
      if (relationMembers.indexOf(otherRelation.osm_id) != -1) {
        // If so, swap them
        dependantRelationQueue[i] = otherRelation;
        dependantRelationQueue[j] = relation;
        // Then process 'otherRelation' (now at position i)
        i--; // Repeat for i
        break;
      }
    }
  }
}
*/

    self.save(relation);
    cb();
  };

  self.node = async.queue(self.processNode, 1);
  self.way  = async.queue(self.processWay, 1);
  self.relation = async.queue(self.processRelation, 1);

  return self;
};

module.exports = theQ;

