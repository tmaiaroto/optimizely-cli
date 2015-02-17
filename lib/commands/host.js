/**
 * Module dependencies
 */
var express = require("express");
var path = require('path');
var fs = require('fs');
var logger = require('../logger');

var readConfig = require("../read-config");
var LocalController = require('../server/controller');
var Variation = require('../variation');

var compileExperiment;
var expPath = path.resolve(process.cwd(),".optcli/tasks/compileExperiment.js")
if(fs.fileExistsSync(expPath)){
  compileExperiment = require(expPath)
}else{
  complileExperiment = require(__dirname + "../default-tasks/compileExperiment.js");
}
var varPath = path.resolve(process.cwd(),".optcli/tasks/compileVariation.js")
if(fs.fileExistsSync(varPath)){
  compileExperiment = require(varPath)
}else{
  complileVariation = __dirname + "../default-tasks/compileVariation.js";
}


var getSSLCredentials = function() {
  var originalPath = path.join(
    path.dirname(fs.realpathSync(__filename)),
    '../../');
  var credentials = {
    key: fs.readFileSync(originalPath + "ssl/server.key", 'utf8'),
    cert: fs.readFileSync(originalPath + "ssl/server.crt", 'utf8')
  };
  return credentials;
}

module.exports = function(varPath, port, program) {
  //Start Server
  var app = express();
  app.set('view engine', 'ejs');

  //configure the controller
  var varPath = path.resolve(process.cwd(), varPath);
  var variation = new Variation({}, varPath);
  variation.loadFromFile();

  if (!variation) {
    logger.log("error", "No variation at path: \"" + varPath +
      "\" found");
    return;
  }

  //local controller for the requests
  try {
    localController = new LocalController(variation, port);
  } catch(error) {
    logger.log("error", error.message);
    return;
  }

  //set the routes
  app.get("/", localController.installUserScript.bind(localController));
  app.get("/install.user.js", localController.userScript.bind(localController));
  app.get("/variation.js", function(req,res){
    compileExperiment(varPath, true, function(error, experiment){
      compileVariation(varPath, function(error, variation){
        console.log(experiment, variation)
      })
    })
  });
  app.get("/variation.css", function(req,res){
    compileExperiment(varPath, true, function(error, experiment){
      console.log(experiment);
    })
  });

  //start the server
  if (program.ssl) {
     var httpsServer = require('https').createServer(getSSLCredentials(), app);
     httpsServer.listen(localController.port, function() {
       console.log("Serving https variation " + varPath + " at port " + localController.port);
       console.log("point your browser to https://localhost:" + localController.port);
       console.log("Ctrl-c to quit");
     });
  } else {
    app.listen(localController.port, function() {
      console.log("Serving variation " + varPath + " at port " + localController.port);
      console.log("point your browser to http://localhost:" + localController.port);
      console.log("Ctrl-c to quit");
    });
  }
}
