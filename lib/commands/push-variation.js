var path = require("path");
var fs = require("fs");
var readConfig = require("../read-config");
var Experiment = require("../experiment");
var logger = require("../logger");
var OptimizelyClient = require('optimizely-node-client');
//var cache = require("../cache");
var tasks = require("../tasks");
var createOrUpdateVariation = function(folder, experiment_id){
  return tasks.compileExperiment(folder,true,function(error, expArgs){
    if(error){logger.log("error", error); return;}
    return tasks.compileVariation(folder, function(error, varArgs){
      if(error){logger.log("error", error); return;}
      varArgs['experiment_id'] = expArgs.id;
      var action = varArgs.id ? "update" : "create";
      readConfig("token").then(function(token) {
        var client = new OptimizelyClient(token);
        return client[action + "Variation"](varArgs).then(function(variationAttrs) {
          //cache.write(variationAttrs);
          tasks.writeVariation(folder, variationAttrs);
          logger.log("info", action + "d variation: " + variationAttrs.id);
        }, function(error) {
          logger.log("error", error);
          logger.log("error", "unable to " + action + " remote variation: " + e.message);
          console.error(e.stack);
        });
      })
    })
  })
}

module.exports = function(folder, experiment_id, program) {
  if(program && program['non-standard']){
    logger.log("info", "pushing non-standard at experiment at " + folder);
    return createOrUpdateVariation(folder, experiment_id, program);
  }
  var varPath = path.resolve(process.cwd(), folder, '../experiment.json');
  if(fs.existsSync(varPath)){
      experiment_id = JSON.parse(fs.readFileSync(varPath, 'utf-8')).id;
  }
  else return;
  logger.log("info", "pushing experiment at " + folder);
  return createOrUpdateVariation(folder, experiment_id, program);
}
