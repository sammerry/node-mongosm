module.exports = {
  verbose: false,
  filename: "example-osm/way.osm",
  host: "localhost",
  port: "27017",
  database: "test",
  suppressErrors: false,
  useOriginalID: false,
  upsert: false,
  xmlns: true,
  strict: false,
  lowercase:true,
  node: {
    ignoreAttributes: []
  },
  way: {
    ignoreAttributes: []
  },
  relation: {
    ignoreAttributes: []
  }
};
