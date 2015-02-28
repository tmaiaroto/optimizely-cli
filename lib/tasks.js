var path = require('path');
var fs = require('fs');
var ejs = require('ejs');
var protoTasks = {};
var taskPath = path.resolve(process.cwd(), ".optcli/tasks.js");
var tasks = fs.existsSync(taskPath) ? require(taskPath) : {};
var defaultGetTemplates = function(directory){
  var templates = {};
  var templatesDir = path.resolve(directory,"templates");
  if(fs.existsSync(templatesDir)){
    fs.readdirSync(templatesDir).forEach(function(file) {
      var text = fs.readFileSync(path.resolve(templatesDir,file),
        'utf-8').replace(/(?:\r\n|\r|\n)/g, '\n');
        templates[file] = escape(text);
    });
  }
  return templates;
};
var defaultGetStrings = function(directory){
  var strings = {};
  var stringsFile = path.resolve(directory,"strings.json");
  if(fs.existsSync(stringsFile)){
    strings = JSON.parse(fs.readFileSync(stringsFile));
  }
  return strings;
}

tasks.compileExperiment = tasks.compileExperiment || function(directory, host, callback){
  if(host) directory = path.resolve(directory, '../');
  var experiment_json = path.resolve(directory, 'experiment.json');
  var experiment_css = path.resolve(directory, 'global.css');
  var experiment_js = path.resolve(directory, 'global.js');
  var experiment = JSON.parse(fs.readFileSync(experiment_json,'utf8'));
  //process experiment_js
  experiment_js = fs.readFileSync(experiment_js,'utf8');
  experiment_js = ejs.render(experiment_js, {
    templates: defaultGetTemplates(directory),
    strings: defaultGetStrings(directory),
    experiment: experiment
  })
  //process experiment_css
  experiment_css = fs.readFileSync(experiment_css,'utf8');
  experiment_css = ejs.render(experiment_css, {
    templates: defaultGetTemplates(directory),
    strings: defaultGetStrings(directory),
    experiment: experiment
  })
  experiment.custom_js = experiment_js;
  experiment.custom_css = experiment_css;
  callback(null, experiment);
  return;
}
tasks.compileVariation =  tasks.compileVariation || function(directory, callback){
    tasks.compileExperiment(directory, true, function(error, experiment){
      var variation_json = path.resolve(directory, 'variation.json');
      var variation_js = path.resolve(directory, 'variation.js');
      var variation = JSON.parse(fs.readFileSync(variation_json,'utf8'));
      variation_js = fs.readFileSync(variation_js,'utf8');
      variation_js = ejs.render(variation_js, {
        templates: defaultGetTemplates(directory),
        strings: defaultGetStrings(directory),
        variation: variation,
        experiment: experiment
      })
      variation.js_component = variation_js;
      callback(null, variation);
      return;
    })
}
tasks.writeExperiment = tasks.writeExperiment || function(directory, experiment, callback){
  fs.writeFileSync(path.resolve(directory,"global.js"), experiment.custom_js || "");
  fs.writeFileSync(path.resolve(directory,"global.css"), experiment.custom_css || "");
  experiment = JSON.parse(JSON.stringify(experiment));
  delete experiment.custom_js;
  delete experiment.custom_css;
  fs.writeFileSync(path.resolve(directory,"experiment.json"), JSON.stringify(experiment));
  if(typeof callback === "function") callback();
}

tasks.writeVariation = tasks.writeVariation || function(directory, variation, callback){
  fs.writeFileSync(path.resolve(directory,"variation.js"), variation.js_component || "");
  variation = JSON.parse(JSON.stringify(variation));
  delete variation.js_component;
  fs.writeFileSync(path.resolve(directory,"variation.json"), JSON.stringify(variation));
  if(typeof callback === "function") callback();
}

module.exports = tasks;
