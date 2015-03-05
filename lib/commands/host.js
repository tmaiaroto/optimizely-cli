/**
 * Module dependencies
 */
var express = require("express");
var path = require('path');
var fs = require('fs');
var logger = require('../logger');
var ejs = require('ejs');
var ws = require('ws');
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

  if(program.task){
    var runners = ["brocoli", "grunt", "gulp"];
    var taskPath = path.join(varPath,"..","..");
    var taskSplit = String(program.task).split(":");
    var runner = taskSplit[0].toLowerCase();
    var task = String(taskSplit[1] || "");
    if(runners.indexOf(runner) === -1){
      runner = "";
      if(fs.existsSync(path.resolve(taskPath, "brocfile.js")) ){
        runner = "brocoli";
      }
      else if(fs.existsSync(path.resolve(taskPath, "gruntfile.js"))){
        runner = "grunt";
      }else if(fs.existsSync(path.resolve(taskPath, "gulpfile.js"))){
        runner = "gulp"
      }

    }

    if(runner){
      var args = [];
      if(task) runner = runner + " " + task;
      try{
        var exec = require('child_process').exec;
        exec(runner,{
            cwd: taskPath
          },function(error, stdout, stderr) {
          console.log("%s:\n%s", runner, stdout);
        });
        console.log("Running %s.", runner)
        process.on('exit', function() {
          exec.kill();
        });
      }catch(error){
        console.log("Error running task %s.", error)
      }

    }else{
      console.log("Task runner %s not found.", runner);
    }
  }
  port = port || 8080
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
        var script = unescape(ejs.render(
          fs.readFileSync(location,'utf8'),
            {
              experiment : experiment,
              variation : variation
            }
        ));
        if(program.live){
          var reloadScript = unescape(ejs.render(
            fs.readFileSync(path.resolve(__dirname,
              "../../templates/reloadScript.ejs.js"),'utf8'),
            {
              _port : port
            }
          ))
          script = reloadScript + script;
        }
        res.end(script)
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

  var server;
  var serverConnected = function(){
      console.log("Serving " + (program.ssl ? "secure " : "") + "variation " + varPath + " at port " + port);
      console.log("point your browser to http" + (program.ssl ? "s " : "") + "://localhost:" + port);
      console.log("Ctrl-c to quit");
      if(program.live){
        var WS = require('ws').Server;
        var wss = new WS({server:server});
        var connectedSockets = [];
        wss.on('connection', function(socket) {
          connectedSockets.push(socket);
          console.log("SOCKET OPEN");
          socket.on('close', function(reason){
            console.log(
              "SOCKET CLOSED %s %s",
              socket._closeCode,
              socket._closeMessage);
            connectedSockets.splice(connectedSockets.indexOf(socket), 1);
          })
        });
        var watch = require('watch');
        watch.watchTree(path.resolve("..", varPath), function (f, curr, prev) {
          console.log('reloading...');
          connectedSockets.forEach(function(socket){
            socket.send('reload');
          });
        })
        console.log('live');
      }
    };

  if(program.ssl){
    var httpsServer = require('https').createServer(getSSLCredentials(), app);
    server = httpsServer.listen(port, serverConnected);
  }
  else{
    server = app.listen(port, serverConnected)
  };
}
