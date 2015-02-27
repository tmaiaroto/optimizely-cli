var path = require('path');
var fs = require('fs');
var gulp = require('gulp');
var through = require('through');
var protoTasks = {};
var taskPath = path.resolve(process.cwd(), ".optcli/tasks.js");
var tasks = fs.existsSync(taskPath) ? require(taskPath) : {};
tasks.compileExperiment = tasks.compileExperiment || function(directory, host, callback){
  if(host) directory = path.resolve(directory, '../');
  var experiment_json = path.resolve(directory, 'experiment.json');
  var experiment_css = path.resolve(directory, 'global.css');
  var experiment_js = path.resolve(directory, 'global.js');
  var experiment = JSON.parse(fs.readFileSync(experiment_json,'utf8'));
  experiment.custom_js = fs.readFileSync(experiment_js,'utf8');
  experiment.custom_css = fs.readFileSync(experiment_css,'utf8');
  callback(null, experiment);
  return;


  try{
    var experiment;
    var experiment_json = path.resolve(directory, 'experiment.json');
    var experiment_css = path.resolve(directory, 'global.css');
    var experiment_js = path.resolve(directory, 'global.js');
    gulp.src(experiment_json)
    .pipe(through(function(data){
      experiment = JSON.parse(data.contents);
        gulp.src(experiment_css)
        .pipe(through(function(data){
          experiment.custom_css = data.contents.toString('utf8');
          gulp.src(experiment_js)
          .pipe(through(function(data){
            experiment.custom_js = data.contents.toString('utf8');
            callback(null, experiment);
          }))
        }))
    }))
  }catch(error){
    callback(error);
  }
}
tasks.compileVariation =  tasks.compileVariation || function(directory, callback){
  try{

    var variation_json = path.resolve(directory, 'variation.json');
    var variation_js = path.resolve(directory, 'variation.js');
    var variation = JSON.parse(fs.readFileSync(variation_json,'utf8'));
    variation.js_component = fs.readFileSync(variation_js,'utf8')
    callback(null, variation);
    return;


    try{
      gulp.src(variation_json)
      .pipe(through(function(data){

        variation = JSON.parse(data.contents);
          gulp.src(variation_js)
          .pipe(through(function(data){
            variation.js_component = data.contents.toString('utf8');

          }))

      }))
    }catch(e){
      console.log("Error", e)
    }
  }catch(error){
    callback(error);
  }
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
