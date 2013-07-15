module.exports = {
  mongoose: {
    uri: ""
  },
  verbose: false,
  filename: "example-osm/way.osm",
  host: "localhost",
  port: "27017",
  database: "test",
  suppressErrors: false,
  useOriginalID: true,
  upsert: false,
  xmlns: true,
  strict: false,
  lowercase:true,
  singleCollection: false,
  timeBucket: false,
  node: {
    keepAttributes: ['_id', 'tags', 'loc'],
    mongooseVersionKey: false,
    storeUpdateTime: false
  },
  way: {
    keepAttributes: ['_id', 'tags', 'loc'],
    populateGeometry: true,
    nodeIdList: true,
    mongooseVersionKey: false,
    storeUpdateTime: false
  },
  relation: {
    keepAttributes: ['_id', 'tags', 'loc', 'members'],
    mongooseVersionKey: false,
    storeUpdateTime: false
  }
};
