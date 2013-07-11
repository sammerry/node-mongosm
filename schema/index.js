 
var mongoose = require('./../node_modules/mongoose');



module.exports = function (options) {
  var Schema = mongoose.Schema;

  db = mongoose.db = mongoose.connect(
    options.host,
    options.database,
    options.port
  );

  function keepAttribute (preSaveEntry) {
    if (!!!options[preSaveEntry.type].keepAttributes[0]) return;
    var preSaveJson = JSON.parse(JSON.stringify(preSaveEntry))
    for (var atr in preSaveJson) {
      if (!!options[preSaveEntry.type] && options[preSaveEntry.type].keepAttributes.indexOf(atr) < 0){
        preSaveEntry.set(atr, undefined);
      }
    }
  };

  function ignoreAttribute (preSaveEntry) {
    if (!!!options[preSaveEntry.type].ignoreAttributes[0]) return;
    options[preSaveEntry.type].ignoreAttributes.forEach(function (atr, index) {
      preSaveEntry.set(atr, undefined);
    });
  };

  mongoose.connection.on('error', function (err) {
    console.log(err);
    function reconnect () {
      mongoose.connect(serverAddress);
    };
    setTimeout(reconnect, 5000)
  });

  mongoose.preSaveFileter= function (next) {
    if (options[this.type] && options[this.type].keepAttributes) keepAttribute(this);
    if (options[this.type] && options[this.type].ignoreAttributes) ignoreAttribute(this);

    next();
  }

  mongoose.postSave = function (doc) {
    if (!!options.verbose) {
      console.log(doc);
      process.stdout.write("\n\n################################################\n");
    }
  }


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
    version: Number,
    uid: Number,
    user: String,
    changeset: Number,
    timestamp: Date,
    visible: Boolean,
    tags: {}
  },{collection: "nodes" });
  db.model('node', Node_Schema);
  Node_Schema.pre('save', mongoose.preSaveFileter);
  Node_Schema.post('save', mongoose.postSave);

  var Way_Schema = Schema({
    _id: Number,
    osm_id: { type:Number, unique: true },
    updated: {type:Date, default: Date.now},
    type: {type:String, default:"way"},
    loc: {
      type: { type: String },
      coordinates: { type: [] },
    },
    version: Number,
    uid: Number,
    user: String,
    changeset: Number,
    timestamp: Date,
    visible: Boolean,
    tags: {}
  },{collection: "ways" });
  db.model('way', Way_Schema);
  Way_Schema.pre('save',  mongoose.preSaveFileter);
  Way_Schema.post('save', mongoose.postSave);

  var Relation_Schema = Schema({
    _id: Number,
    osm_id: { type:Number, unique: true },
    updated: {type:Date, default: Date.now},
    type: {type:String, default:"relation"},
    loc: [String],
    version: Number,
    uid: Number,
    user: String,
    changeset: Number,
    timestamp: Date,
    visible: Boolean,
    tags: {}
  },{collection: "relations" });
  db.model('relation', Relation_Schema);
  Relation_Schema.pre('save', mongoose.preSaveFileter);
  Relation_Schema.post('save', mongoose.postSave);

  return mongoose;
}

