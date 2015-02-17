
var path = require('path');
var gulp = require('gulp');
var through = require('through');
module.exports = function compileExperiment(directory, host, callback){
  try{
    gulp.task('compile-experiment', function(){
      var experiment_json = path.resolve(directory,'experiment.json');
      var experiment_js = path.resolve(directory,'global.js');
      var experiment_css = path.resolve(directory,'global.css');
      gulp.src(experiment_json)
      .pipe(through(function(data){
        experiment_json = JSON.parse(data.contents);
          gulp.src(experiment_js)
          .pipe(through(function(data){
            experiment_js = data.contents;
            gulp.src(experiment_css)
            .pipe(through(function(data){
              experiment_css = data.contents;
              experiment_json.js = experiment.js;
              experiment_json.css = experiment.css;
              callback(null, experiment.json);
            }))
          }))
      }))
    })
  }catch(error){
    callback(error)
  }
  gulp.run('compile-experiment');
}
