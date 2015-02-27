/**
 * Module dependencies
 */
var express = require("express");
var path = require('path');
var fs = require('fs');
var logger = require('../logger');
var ejs = require('ejs');
var readConfig = require("../read-config");
var LocalController = require('../server/controller');
var Variation = require('../variation');
var tasks = require('../tasks');
var unescape = require('../unescape');
var compileVariation = tasks.compileVariation;
var compileExperiment = tasks.compileExperiment;
/*
var getSSLCredentials = function(options, callback) {
  if(typeof callback !== "function") return;
  var pem = require('pem');
  pem.createCertificate(options, function(err, keys){
    callback(null,{
      key: keys.serviceKey,
      cert:  keys.certificate
    })
  });
}
*/
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
  app.get("/variation.js", function(req, res){
    compileExperiment(varPath, true, function(error, experiment){
      compileVariation(varPath, function(error, variation){
        res.set({
          "Content-Type": "text/javascript"
        });
        var location = path.resolve(__dirname,
          "../../export-templates/host.js");
        var customLocation = path.resolve(process.cwd(),
          ".optcli/export-templates/host.js");
        if(fs.existsSync(customLocation)){
          location = customLocation;
        }
        res.end(unescape(ejs.render(
          fs.readFileSync(location,'utf8'),
            {
              experiment : experiment,
              variation : variation
            }
        )))
      })
    })
  });
  app.get("/variation.css", function(req, res){
    compileExperiment(varPath, true, function(error, experiment){
      res.set({
        "Content-Type": "text/css"
      });
      var location = path.resolve(__dirname,
        "../../export-templates/host.css");
      var customLocation = path.resolve(process.cwd(),
        ".optcli/export-templates/host.css");
      if(fs.existsSync(customLocation)){
        location = customLocation;
      }
      res.end(unescape(ejs.render(
        fs.readFileSync(location,'utf8'),
          {
            experiment : experiment
          }
      )));
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
