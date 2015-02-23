#Modifying the OptCLI Pipeline
OptCLI works by transforming a directory of files into via a pipeline into an object that can be
 - served locally with __opcli host__.
 - pushed to Optimizely via __optcli push-experiment/variation__

You can easily modify this pipeline, but why would you want to do this? Modifying the pipeline gives you unlimited control over your development environment. Here's just small sample of things that modifying the pipelin will allow you to do:

 - Process styles using scss or less
 - Process scripts as typescript or coffeescript
 - Add variation specific styles
 - Define experiment/variation logic in the same file
 - And much much more...

But how exactly does one modify the pipeline? Everything you need to change is located in a single file in your project folder.

##Tasks.js
In your projects's optcli folder (located at .optcli -- if it doesn't already exist, create it!) create a new file named 'tasks.js'. Within the newly created file, create a [CommonJS](http://wiki.commonjs.org/wiki/CommonJS) style module that exposes four methods (described below). Each of the four methods described will override a corresponding internal command responsible for either transforming a directory into an object that Optimizely understands, or writing an object from Optimizey to a local directory of files. For information on the structure of these objects, please see the Optimizely REST API documentation on the [experiment object](http://developers.Optimizely.com/rest/#read-an-experiment) and the [varaition object](http://developers.Optimizely.com/rest/#read-a-variation).


###Tasks.js methods

It's be a good idea to check out the built in tasks.js methods: [here](https://github.com/FunnelEnvy/Optimizely-cli/blob/pipeline/lib/tasks.js). This should give you a good idea of how they work.


####Compile Variation
The compileVariation method takes a 'directory' and a 'callback' function as its arguments. It is expected to use the contents of the given directory to create a variation object, which is then  passed to the callback as it's second argument, with the first argument being passed as null. If an error occurs, the callback should be passed this error as it's first argument.

```js
module.exports.compileVariation = function(directory, callback){
  //Put Code Here
}
```
####Compile Experiment
Similar to the above method, the compileExperiment passes an experiment rather than a variation to it's callback. In addition, this function takes an additional 'hosting' flag to, specify whether or not the the function is used alone, or in conjunction with a variation located in the specified subdirectory

```js
module.exports.compileExperiment = function(directory, hosting, callback){
  //Put Code Here
}
```

####Write Variation
The writeVariation method takes a 'directory' and 'variation' as it's arguments. It is expected to use the contents of the variation object to create files in the given directory.
```js
module.exports.writeVariation = function(directory, variation){
  //Put Code Here
}
```
####Write Experiment
Similar to the above method, the writeExperiment produces a representation of an experiment in a directory rather than a variation.

```js
module.exports.writeExperiment = function(directory, experiment){
  //Put Code Here
}
```


###Example: Less compilation
In this example, we explore adding less compilation to the pipeline.
We start by creating tasks.js file as described above.
Since the style sheets are experiment specific, we only need concern ourselves with overidding  the compileExperiment and writeExperiment methods

Tasks.js
```js
module.exports.compileExperiment = function(directory, host, callback){
  //Put Code Here
}

module.exports.writeExperiment = function(directory, experiment){
  //Put Code Here
}
```
This is a simple modification, so let's start by simply copying over the code from the original methods to our new methods

Tasks.js
```js
module.exports.compileExperiment = function(directory, host, callback){
  if(host) directory = path.resolve(directory, '../');
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

module.exports.writeExperiment = function(directory, experiment){
  fs.writeFileSync(path.resolve(directory,"global.js"),
  experiment.custom_js || "");
  fs.writeFileSync(path.resolve(directory,"global.css"),
  experiment.custom_css || "");
  experiment = JSON.parse(JSON.stringify(experiment));
  delete experiment.custom_js;
  delete experiment.custom_css;
  fs.writeFileSync(path.resolve(directory,"experiment.json"), JSON.stringify(experiment));
  if(typeof callback === "function") callback();
}
```

You may have noticed that the original tasks.js file references a few modules. You'll have to install them, and any other modules locally to use them.
first, initialize a project inside of your optcil folder with npm init.

Now, install the "gulp" and "through" modules.

```bash
npm install gulp through
```
You'll also need the "fs" and "path", but those are built into node, so you don't need to install them separately.

Now, add in the references to the top of your tasks.js file:

Tasks.js
```js
var path = require('path');
var fs = require('fs');
var gulp = require('gulp');
var through = require('through');

module.exports.compileExperiment = function(directory, host, callback){
//...The rest
```

The last thing that we need to do is to add less to the pipeline.
We do this by first installing the [gulp-less plugin](https://github.com/plus3network/gulp-less).


```bash
npm install gulp-less
```
Now we add a reference within our file

Tasks.js
```js
var path = require('path');
var fs = require('fs');
var gulp = require('gulp');
var through = require('through');
var less = require('gulp-less');

module.exports.compileExperiment = function(directory, host, callback){
//...The rest
```

And then we simply pipe our css data through the plugin

```js
gulp.src(experiment_json)
.pipe(through(function(data){
  experiment = JSON.parse(data.contents);
    gulp.src(experiment_css)
    .pipe(less())
    .pipe(through(function(data){
      experiment.custom_css = data.contents.toString('utf8');
      gulp.src(experiment_js)
      .pipe(through(function(data){
        experiment.custom_js = data.contents.toString('utf8');
        callback(null, experiment);
      }))
    }))
}))
```

The final step, is mostly an aesthetic one. We change the .css files in our pipeline to .less giving us a final task.js file that looks like this:

Tasks.js
```js
var path = require('path');
var fs = require('fs');
var gulp = require('gulp');
var through = require('through');
var less = require('gulp-less');

module.exports.compileExperiment = function(directory, host, callback){
  if(host) directory = path.resolve(directory, '../');
  try{
    var experiment;
    var experiment_json = path.resolve(directory, 'experiment.json');
    var experiment_css = path.resolve(directory, 'global.less');
    var experiment_js = path.resolve(directory, 'global.js');
    gulp.src(experiment_json)
    .pipe(through(function(data){
      experiment = JSON.parse(data.contents);
        gulp.src(experiment_css)
        .pipe(less())
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

module.exports.writeExperiment = function(directory, experiment){
  fs.writeFileSync(path.resolve(directory,"global.js"),
  experiment.custom_js || "");
  fs.writeFileSync(path.resolve(directory,"global.less"),
  experiment.custom_css || "");
  experiment = JSON.parse(JSON.stringify(experiment));
  delete experiment.custom_js;
  delete experiment.custom_css;
  fs.writeFileSync(path.resolve(directory,"experiment.json"), JSON.stringify(experiment));
  if(typeof callback === "function") callback();
}
```
You are now ready to start using less in your pipeline!
