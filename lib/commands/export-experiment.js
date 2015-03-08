var path = require("path");
var fs = require("fs");
var ejs = require("ejs");
var compileit = require("../tasks").compileExperiment;
var unescape = require("../unescape");

module.exports = function(folder) {
  compileit(folder, false, function(error, experiment){
    var location = path.resolve(__dirname,
      "../../export-templates/export-experiment.ejs");
    var customLocation = path.resolve(process.cwd(),
      ".optcli/export-templates/export-experiment.ejs");
    if(fs.existsSync(customLocation)){
      location = customLocation;
    }
    var output = unescape(ejs.render(
      fs.readFileSync(location, 'utf8'),{experiment:experiment}));
    console.log(output);
  })
}
