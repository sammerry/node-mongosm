
module.exports = function (options) {
  process.argv.forEach(function (val, index, array) {
    function logHelp () {
      process.stdout.write("\n-v verbose\n\-f file path\n-l to lowercase\n-u upcert all entries : defaults to save\n-s suppress errors\n-host host name\n-port port\n-k removes all attributes except ones supplied in comma separated list EX: -k way:user,timestamp\n-i includes all attributes except ones supplied in comma separated list EX: -i way:user,timestamp\n-db database\n-h help\n\n");
    }

    if (index > 1) {
      switch (val) {
        case "-v":
          options.verbose = true;
          break;
        case "-l":
          options.lowercase = true;
          break;
        case "-upsert":
          options.upsert = true;
          break;
        case "-s":
          options.suppressErrors = true;
          break;
        case "-sc":
          options.singleCollection = true;
          break;
        case "-oid":
          options.useOriginalID = true;
          break;
        case "-uri":
          options.mongoose.uri = array.splice(index+1,1)[0];
          break;
        case "-u":
          options.mongoose.username = array.splice(index+1,1)[0];
          break;
        case "-p":
          options.mongoose.password = array.splice(index+1,1)[0];
          break;
        case "-tb":
          options.timeBucket = true;
          break;
        case "-k":
          var atrKeep = array.splice(index+1,1)[0].split(":");
          options[atrKeep[0]] = options[atrKeep[0]] || {};
          options[atrKeep[0]].keepAttributes = atrKeep[1].split(",");
          break;
        case "-i":
          var atrIgnore = array.splice(index+1,1)[0].split(":");
          options[atrIgnore[0]] = options[atrIgnore[0]] || {};
          options[atrIgnore[0]].ignoreAttributes = atrIgnore[1].split(",");
          break;
        case "-f":
          options.filename = array.splice(index+1,1)[0];
          break;
        case "-host":
          options.host = array.splice(index+1,1)[0];
          break;
        case "-port":
          options.port = array.splice(index+1,1)[0];
          break;
        case "-db":
          options.database = array.splice(index+1,1)[0];
          break;
        case "-wg":
          options.populateGeometry = true;
          break;
        default:
          logHelp();
          process.kill();
          break;
      }
    }
  });
  return process;
};
