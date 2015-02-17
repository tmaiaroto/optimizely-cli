var path = require('path');
var gulp = require('gulp');
var through = require('through');
module.exports = function(directory, callback){
  try{
    var variation_json = path.resolve(directory, 'variation.json');
    var variation_js = path.resolve(directory, 'variation.js');
    gulp.src(variation_json)
    .pipe(through(function(data){
      variation_json = JSON.parse(data.contents);
        gulp.src(variation_js)
        .pipe(through(function(data){
          variation_js = data.contents.toString('utf8');;
          variation_json.js_component = variation_js.toString('utf8');;
          callback(null, variation_json);
        }))
    }))
  }catch(error){
    callback(error)
  }
}
