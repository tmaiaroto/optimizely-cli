////////////////
//Usage
////////////////
/**
This gulp file is intended for use by with optcli.

The 'main' task, run by default, preforms a number of subtasks:

 - The 'global.js' subtask produces an experiment level javascript file by concatenating any number of javascript files and compiling them into a single file. This task also takes advantage of the babel javascript transpiler to allow the use of future versions of javascript... today! Visit https://babeljs.io/ to learn more.

 - The 'global.css' subtask produces stylesheet file by converting a scss file into a css file.

 - The 'variation.js' subtask works in much the same way as the 'global.js' task, but produces a variation level javascript file.

- All output files are minified

- Each file is also processed as an ejs template. Locals include:
   - A 'templates' object created from files within a 'templates' directory.
      keys are the file names and values are the contents
   - A 'strings' object imported from an 'strings.json' file.
Besure to properly decode/unescape strings broungt into your code through the templating feature.

There is also a 'watch' task that watches the SOURCE directory runs the 'main' task should anything change.

Example - Running the main gulp task on this directory:

input/
  templates/
  strings.json/
  arbitrary1.js (es6)
  arbitrary2.js (es6)
  ...
  global.js (es6)
  global.scss (scss)
  var_1/
    arbitraryA.js (es6)
    arbitraryB.js (es6)
    ...
    variation.js (es6)
  var_2/
    arbitraryC.js (es6)
    arbitraryD.js (es6)
    ...
    variation.js (es6)

will result in this directory:

output/
  global.js (es5)
  global.css (scss)
  var_1/
    variation.js (es5)
  var_2/
    variation.js (es5)

Note: The accompaning package.json file is not necessary, but having it around will allow you to install all dependancies with a simple 'npm install'.
.
*/


////////////////
//Constants
////////////////
var SOURCE = 'input';
var DEST = 'output';

////////////////
//Dependencies
////////////////

//Internal
var fs = require('fs');
var path = require('path');
var Buffer = require('buffer').Buffer;

//External
var gulp = require('gulp');
var merge = require('merge-stream');
var ejs = require('ejs');

//Gulp Plugins
var babel = require('gulp-babel');//Compile ES6
var concat = require('gulp-concat');//Concatenate Files
var sass = require('gulp-sass');//Convert SCSS to CSS
var rename = require('gulp-rename');//Rename Files
var plumber = require('gulp-plumber');//Handles Errors
var through = require('through-gulp');//Custom Transforms

////////////////
//Utilities
////////////////

var getFolders = function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function(file) {
      if(file === 'node_modules') return;
      if(file === 'templates') return;
      return fs.statSync(path.join(dir, file)).isDirectory();
    });
};

var defaultGetTemplates = function(directory){
  var templates = {};
  var templatesDir = path.resolve(directory, "templates");
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
  var stringsFile = path.resolve(directory, "strings.json");
  if(fs.existsSync(stringsFile)){
    strings = JSON.parse(fs.readFileSync(stringsFile));
  }
  return strings;
}

var ejsTemplate = function(data){
  var contents = data.contents.toString('utf8');
  var locals =    {
       templates : defaultGetTemplates(SOURCE),
       strings : defaultGetStrings(SOURCE)
     };
  contents = ejs.render(contents.toString('utf8'), locals);
  data.contents = new Buffer(contents);
  return data;
}

////////////////
//Tasks
////////////////

//Global JS
gulp.task('global.js', function(){
  return gulp.src([
    path.join(SOURCE,'!(global)*.js'),
    path.join(SOURCE, 'global.js')
  ])
  .pipe(plumber())
  .pipe(concat('global.js'))//Concatenate
  .pipe(through.map(ejsTemplate))//EJS
  .pipe(babel())//ES6
  .pipe(gulp.dest(DEST));
});

//Global CSS
gulp.task('global.css', function(){
  return gulp.src(path.join(SOURCE, 'global.scss'))
  .pipe(plumber())
  .pipe(through.map(ejsTemplate))//EJS
  .pipe(sass())//SCSS
  .pipe(rename('global.css'))//Rename
  .pipe(gulp.dest(DEST));
})

//Variation JS
gulp.task('variation.js', function(){
  var folders = getFolders(SOURCE);
  var tasks = folders.map(function(dir) {
     return gulp.src([
         path.join(SOURCE, dir, '!(variation)*.js'),
         path.join(SOURCE, dir, 'variation.js')
       ])
       .pipe(plumber())
       .pipe(concat('variation.js'))//Concatenate
       .pipe(through.map(ejsTemplate))//EJS
       .pipe(babel())//ES6
       .pipe(gulp.dest(path.join(DEST, dir)));
  });
  return merge(tasks);
});

//Main
gulp.task('main',
['global.js', 'global.css','variation.js'])

//Watch
gulp.task('watch',['main'],function(){
  gulp.watch(path.join(SOURCE,"**/*.*"), ['main']);
});

//Default
gulp.task('default', ['main']);
