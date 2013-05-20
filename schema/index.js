 
var mongoose = require('./../node_modules/mongoose');

module.exports = mongoose;

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
mongoose.model('way', Way_Schema);


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
mongoose.model('relation', Relation_Schema);



