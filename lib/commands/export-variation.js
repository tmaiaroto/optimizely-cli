var path = require("path");
var fs = require("fs");
var ejs = require("ejs");
var compileit = require("../tasks").compileVariation;
var unescape = require("../unescape");

module.exports = function(folder) {
  compileit(folder, function(error, variation){
    var location = path.resolve(__dirname,
      "../../export-templates/export-variation.ejs");
    var customLocation = path.resolve(process.cwd(),
      ".optcli/export-templates/export-variation.ejs");
    if(fs.existsSync(customLocation)){
      location = customLocation;
    }
    var output = unescape(ejs.render(
      fs.readFileSync(location, 'utf8'),{variation:variation}));
    console.log(output);
  })
}
