var mongoose = require('./../../node_modules/mongoose');
require('./../../node_modules/date-utils');

module.exports = function (options) {
  var Schema = mongoose.Schema;

  var nodeCollection = 'geo';
  var wayCollection = 'geo';
  var relationCollection = 'geo';
  var uriString = "mongodb://" + options.host + ":" + options.port + "/" + options.database;

  options.mongoose.uri = options.mongoose.uri || uriString;

  var db = mongoose.db = mongoose.connect(
    options.mongoose.uri,
    options.mongoose
  );

  if (!options.singleCollection) {
    nodeCollection = 'nodes';
    wayCollection = 'ways';
    relationCollection = 'relations';
  }

  function keepAttribute (preSaveEntry) {
    if (!!!options[preSaveEntry.type].keepAttributes[0]) return;
    var preSaveJson = JSON.parse(JSON.stringify(preSaveEntry));
    for (var atr in preSaveJson) {
      if (!!options[preSaveEntry.type] && options[preSaveEntry.type].keepAttributes.indexOf(atr) < 0){
        preSaveEntry.set(atr, undefined);
      }
    }
  }

  function ignoreAttribute (preSaveEntry) {
    if (!!!options[preSaveEntry.type].ignoreAttributes[0]) return;
    options[preSaveEntry.type].ignoreAttributes.forEach(function (atr) {
      preSaveEntry.set(atr, undefined);
    });
  }

  mongoose.connection.on('error', function (err) {
    console.log(err);
    function reconnect () {
      mongoose.connect(
        options.uri,
        options.mongoose
      );
    }
    setTimeout(reconnect, 5000);
  });

  mongoose.preSaveFilter = function (next, done) {
    if (options.useOriginalID === true) {
      this.set("_id",  this.osm_id);
      this.set("osm_id",  undefined);
    }

    if (options[this.type] && options[this.type].keepAttributes) keepAttribute(this);
    if (options[this.type] && options[this.type].ignoreAttributes) ignoreAttribute(this);

    if (!!options.timeBucket) {
      var mdate = new Date();
      var odate = new Date(this.timestamp);
      var osmD = odate.toFormat('YYYY.MM.DD.HH.MI');
      var monD = mdate.toFormat('YYYY.MM.DD.HH.MI');
      var sec = date.toFormat('SS');
      this.set('osmTimeBucket.' + osmD, sec);
      this.set('updateTimeBucket.' + monD, sec);
    }

    next();
    done();
  };

  var Node_Schema = Schema({
    _id: {type: Number, index:true, unique:true},
    osm_id: {type:Number, index:true, unique:true},
    type: {type:String, default:"node"},
    loc: {
      type: Object,
      coordinates: [Number],
      index: "2dsphere"
    },
    osmTimeBucket: Object,
    updateTimeBucket: Object,
    version: Number,
    uid: Number,
    user: String,
    changeset: Number,
    timestamp: Date,
    visible: Boolean,
    tags: {}
  },{collection: nodeCollection});
  db.model('node', Node_Schema);
  Node_Schema.pre('save', true, mongoose.preSaveFilter);

  if (options.node) {
    if (options.node.storeUpdateTime) {
      Node_Schema.add({ updated: {type: Date, default: Date.now }});
    }
  }

  if (options.node && options.node.mongooseVersionKey) {
    Node_Schema.set("versionKey", options.node.mongooseVersionKey);
  } else {
    Node_Schema.set("versionKey", false);
  }

  var Way_Schema = Schema({
    _id: {type: Number, index:true, unique:true},
    osm_id: {type:Number, index:true, unique:true},
    type: {type:String, default:"way"},
    loc: {
      type: { type: String },
      nodes: { type: Array, default:[]},
      coordinates: []
    },
    osmTimeBucket: Object,
    updateTimeBucket: Object,
    version: Number,
    uid: Number,
    user: String,
    changeset: Number,
    timestamp: Date,
    visible: Boolean,
    tags: {}
  },{collection: wayCollection});
  db.model('way', Way_Schema);
  Way_Schema.pre('save', true,  mongoose.preSaveFilter);

  if (options.way) {
    if (options.way.storeUpdateTime) {
      Way_Schema.add({ updated: {type: Date, default: Date.now }});
    }
  }

  if (options.way && options.way.mongooseVersionKey) {
    Way_Schema.set("versionKey", options.way.mongooseVersionKey);
  } else {
    Way_Schema.set("versionKey", false);
  }

  var Relation_Schema = Schema({
    _id: {type:Number, index:true, unique:true},
    osm_id: {type:Number, index:true, unique:true},
    type: {type:String, default:"relation"},
    loc: {},
    members: [],
    version: Number,
    uid: Number,
    user: String,
    changeset: Number,
    timestamp: Date,
    visible: Boolean,
    osmTimeBucket: Object,
    updateTimeBucket: Object,
    tags: {}
  },{collection: relationCollection, versionKey: options.mongooseVersionKey });
  db.model('relation', Relation_Schema);
  Relation_Schema.pre('save', true, mongoose.preSaveFilter);

  if (options.relation) {
    if (options.relation.storeUpdateTime) {
      Relation_Schema.add({ updated: {type: Date, default: Date.now }});
    }
  }

  if (options.relation && options.relation.mongooseVersionKey) {
    Relation_Schema.set("versionKey", options.relation.mongooseVersionKey);
  } else {
    Relation_Schema.set("versionKey", false);
  }

  return mongoose;
};

