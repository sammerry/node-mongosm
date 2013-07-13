
options = require("./options.js");
module.exports = function () {
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
        case "-u":
          options.upsert = true;
          break;
        case "-s":
          options.suppressErrors = true;
          break;
        case "-sc":
          options.singleCollection = true;
        case "-u":
          options.useOriginalID = true;
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
        default:
          logHelp();
          process.kill()
          break;
      }
    }
  });
  return process;
}
