
var vows = require('vows'),
    assert = require('assert'),
    options = require('../lib/options.js');

var mongoose = require('../lib/schema')(options);
var count = 0;
var done = 0;

function finished() {
  done++;
  console.log(count,done)
  if (count === done ) return mongoose.connection.close();
};

mongoose.connection.on('error', function (err) {
  process.exit();
});

mongoose.connection.on('open', function (err) {
  vows.describe('Ensure expected options exist').addBatch({
      'check options': {
        topic: function () {
          count++
          return require('../lib/options.js');
        },
        'test': function (options) {
          var optionsBoolean = (typeof options === 'object') ? true:false;
          assert.isTrue(optionsBoolean);
          assert.isDefined(options.mongoose);
          assert.isDefined(options.mongoose.uri);
          assert.isDefined(options.mongoose.server);
          assert.isDefined(options.mongoose.server.poolSize);
          assert.isDefined(options.verbose);
          assert.isDefined(options.host);
          assert.isDefined(options.port);
          assert.isDefined(options.database);
          assert.isDefined(options.suppressErrors);
          assert.isDefined(options.useOriginalID);
          assert.isDefined(options.upsert);
          assert.isDefined(options.xmlns);
          assert.isDefined(options.strict);
          assert.isDefined(options.lowercase);
          assert.isDefined(options.singleCollection);
          assert.isDefined(options.timeBucket);
          assert.isDefined(options.lowercase);
          assert.isDefined(options.logInterval);
          assert.isDefined(options.node);
          assert.isDefined(options.node.keepAttributes);
          assert.isDefined(options.node.mongooseVersionKey);
          assert.isDefined(options.node.storeUpdateTime);
          assert.isDefined(options.way);
          assert.isDefined(options.way.keepAttributes);
          assert.isDefined(options.way.populateGeometry);
          assert.isDefined(options.way.nodeIdList);
          assert.isDefined(options.way.mongooseVersionKey);
          assert.isDefined(options.way.storeUpdateTime);
          assert.isDefined(options.relation);
          assert.isDefined(options.relation.populateGeometry);
          assert.isDefined(options.relation.mongooseVersionKey);
          assert.isDefined(options.relation.storeUpdateTime);
        }
      }
  }).run();

  vows.describe('Ensure expected options exist').addBatch({
    'check schema': {
    }
  });

  vows.describe('Ensure expected options exist').addBatch({
    'check options': {
      topic: function () {
        count++
        var options = require('../lib/options.js');
        return require('../lib/queue.js')(options);
      },
      'schema exists': function () {
        assert.isDefined(mongoose.model('node'));
        assert.isDefined(mongoose.model('way'));
        assert.isDefined(mongoose.model('relation'));
      },
      'test create/save node': function (queue) {
        var Node = mongoose.model('node');
        var node = new Node();
        console.log(node);
      },
      'test create/save way': function (queue) {
        var Way = mongoose.model('way');
        var way = new Way();
        console.log(way);
      },
      'test create/save relation': function (queue) {
        var Relation = mongoose.model('relation');
        var relation = new Relation();
        console.log(relation);
      }
    }
  }).run();
});

