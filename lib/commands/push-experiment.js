var _ = require("lodash");
var fs = require("fs");

var readConfig = require("../read-config");
var Experiment = require("../experiment");
var Variation = require("../variation");
var pushVariation = require("./push-variation");
var logger = require("../logger");
var OptimizelyClient = require('optimizely-node-client');

module.exports = function(folder, program) {
  //find the experiment
  var experiment = Experiment.locateAndLoad(folder);

  if (!experiment) {
    logger.log("error", "could not find experiment at " + folder);
    return;
  } else {
    logger.log("info", "pushing experiment at " + folder);
  }

  readConfig("token").then(function(token) {
      client = new OptimizelyClient(token);
      //if we already have an id, then update
      //TODO:Read Variation from Cache
      if (experiment.attributes.id) {
        experiment.updateRemote(client, folder);
      } else {
        experiment.createRemote(client, folder);
      }
    }).then(function() {
      if(program.iterate){
        experiment.getVariations().forEach(function(variationPath) {
          pushVariation(variationPath.slice(0,- Variation.JSON_FILE_NAME.length),program);
        });
      }
    }).catch(function(error) {
      // Handle any error from all above steps
      logger.log("error", error.stack);
    })
    .done();
}
