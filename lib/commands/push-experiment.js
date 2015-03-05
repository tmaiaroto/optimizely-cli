var _ = require("lodash");
var fs = require("fs");
var path = require('path');
var readConfig = require("../read-config");
var Experiment = require("../experiment");
var Variation = require("../variation");
var logger = require("../logger");
var OptimizelyClient = require('optimizely-node-client');
var compileExperiment = require('../tasks').compileExperiment;
//var cache = require('../cache');
var tasks = require("../tasks");
var createOrUpdateExperiment = function(folder, program){
  return compileExperiment(folder, false, function(error, expArgs){
    if(error){logger.log("error", error); return;}
    var project = JSON.parse(fs.readFileSync(path.resolve(process.cwd(),"project.json")));
    expArgs['project_id'] = project.id;
    var action = expArgs.id ? "update" : "create";
    readConfig("token").then(function(token) {
      var client = new OptimizelyClient(token);
      return client[action + "Experiment"](expArgs).then(function(experimentAttrs) {
        //cache.write(experimentAttrs);
        tasks.writeExperiment(folder, experimentAttrs);
        logger.log("info", action + "d experiment: " + experimentAttrs.id);

        if(program.iterate){
          var pushVariation = require("./push-variation");
          return fs.readdirSync(folder)
            .filter(function(file) {
              if(!fs.statSync(path.resolve(folder, file)).isDirectory()) return;
              try{
                path.join(folder, file, Variation.JSON_FILE_NAME);
              }catch(e){
                return;
              }
              return file;
            })
            .forEach(function(variationPath) {
              try{
                pushVariation(
                  variationPath.slice(0,-Variation.JSON_FILE_NAME.length),
                  program);
              }catch(e){
                console.log("Error", e)
              }
            });
          };
      }, function(error) {
        logger.log("error", error);
        logger.log("error", "unable to " + action + " remote experiment: " + e.message);
        console.error(e.stack);
      });
    })
  })
}


module.exports = function(folder, program) {
  compileExperiment(folder, false, function(error, experiment){
    if (error) {
      logger.log("error", error);
      return;
    }
    logger.log("info", "pushing experiment at " + folder);
    createOrUpdateExperiment(folder, program);
    })
}
