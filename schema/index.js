var mongoose = require('mongoose');
require('date-utils');

module.exports = function (options) {
  var Schema = mongoose.Schema;

  var nodeCollection =
      wayCollection =
      relationCollection = 'geo';

  options.mongoose.uri = options.mongoose.uri
                      || "mongodb://" + options.host + ":" + options.port + "/" + options.database;

  db = mongoose.db = mongoose.connect(
    options.mongoose.uri,
    options.mongoose
  );

  if (!!options.singleCollection) {
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
    options[preSaveEntry.type].ignoreAttributes.forEach(function (atr, index) {
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
      var date = new Date(this.timestamp);
      var currentDate = new Date();
      var osmD = date.toFormat('YYYY.MM.DD.HH.SS');
      var monD = date.toFormat('YYYY.MM.DD.HH.SS');
      this.set('osmTimeBucket.' + osmD, true);
      this.set('updateTimeBucket.' + monD, true);
    }

    next();
    done();
  };

  mongoose.postSave = function (doc) {
    if (!!options.verbose) {
      console.log(doc);
      process.stdout.write("\n\n################################################\n");
    }
  };


  var Node_Schema = Schema({
    _id: Number,
    osm_id: { type:Number, unique: true },
    updated: {type:Date, default: Date.now},
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
  },{collection: nodeCollection });
  db.model('node', Node_Schema);
  Node_Schema.pre('save', true, mongoose.preSaveFilter);
  Node_Schema.post('save', mongoose.postSave);

  var Way_Schema = Schema({
    _id: Number,
    osm_id: { type:Number, unique: true },
    updated: {type:Date, default: Date.now},
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
  },{collection: wayCollection });
  db.model('way', Way_Schema);
  Way_Schema.pre('save', true,  mongoose.preSaveFilter);
  Way_Schema.post('save', mongoose.postSave);

  var Relation_Schema = Schema({
    _id: Number,
    osm_id: { type:Number, unique: true },
    updated: {type:Date, default: Date.now},
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
  },{collection: relationCollection });
  db.model('relation', Relation_Schema);
  Relation_Schema.pre('save', true, mongoose.preSaveFilter);
  Relation_Schema.post('save', mongoose.postSave);

  return mongoose;
};

