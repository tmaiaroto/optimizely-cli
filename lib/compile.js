var path = require('path');
var fs = require('fs');
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
