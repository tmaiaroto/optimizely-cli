var path = require('path');
var gulp = require('gulp');
var through = require('through');
module.exports = function compileVariation(directory, callback){
  try{
    gulp.task('compile-variation', function(){
      var variation_json = path.resolve(directory,'variation.json');
      var variation_js = path.resolve(directory,'variation.js');
      gulp.src(variation_json)
      .pipe(through(function(data){
        variation_json = JSON.parse(data.contents);
          gulp.src(variation_js)
          .pipe(through(function(data){
            variation_js = data.contents;
            variation_json.js = variation.js;
            callback(null, variation.json);
          }))
      }))
    })
  }catch(error){
    callback(error)
  }
  gulp.run('compile-variation');
}
