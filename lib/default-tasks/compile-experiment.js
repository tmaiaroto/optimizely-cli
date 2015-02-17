var path = require('path');
var gulp = require('gulp');
var through = require('through');
module.exports = function(directory, host, callback){
  try{
    if(host) directory = path.resolve(directory,'../');
    var experiment_json = path.resolve(directory, 'experiment.json');
    var experiment_js = path.resolve(directory, 'global.js');
    var experiment_css = path.resolve(directory, 'global.css');
    gulp.src(experiment_json)
    .pipe(through(function(data){
      experiment_json = JSON.parse(data.contents);
        gulp.src(experiment_js)
        .pipe(through(function(data){
          experiment_js = data.contents;
          gulp.src(experiment_css)
          .pipe(through(function(data){
            experiment_css = data.contents;
            experiment_json.custom_js = experiment_js.toString('utf8');
            experiment_json.custom_css = experiment_css.toString('utf8');

            callback(null, experiment_json);
          }))
        }))
    }))
  }catch(error){
    callback(error);
  }
}
