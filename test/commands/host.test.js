var ChildProcess = require('child_process');
var http = require('http');
var Promise = require('bluebird');
var fs = require('fs');
Promise.promisifyAll(fs);
var Browser = require('zombie');
var quickTemp = require('quick-temp');
var assert = require('chai').assert;
var expect = require('chai').expect;

var utils = require('../utils.js');

var directory = {};
var variationJS = '$(\'body\').addClass(\'test\')';
var experimentJS = 'function myFunc(){console.log("testing is fun");}';
var CSS = '.test {background: blue}';
var childProcess, browser;

describe.skip('Host Command', function(){
  before(function(done){
    //Create temporary project directory
    quickTemp.makeOrRemake(directory, 'project');
    directory.experiment = directory.project + '/test-experiment/';
    directory.variation = directory.project + '/test-experiment/test-variation';
    
    //Initialize a project, create experiment, and create a variation
    utils.init(directory.project);
    utils.experiment(directory.experiment);
    utils.variation(directory.experiment, '/test-variation', 'Variation 1');

    fs.writeFileAsync(directory.variation + '/variation.js', variationJS)
      .then(function(){
        return fs.writeFileAsync(directory.experiment + '/experiment.css', CSS);
      })
      .then(function(){
        return fs.writeFileAsync(directory.experiment + '/experiment.js', experimentJS);
      })
      .catch(function(error){
        assert(false, 'Could not add css/javascript to files');
      }); 

    childProcess = ChildProcess.spawn('optcli', ['host', 'test-experiment/test-variation'], {cwd: directory.project})
      .on('error', function(err){
        assert.ifError(err);
      })
      .on('exit', function(code) {
        console.log("Child `optcli` process exited. Code: " + code);
        done();
      });
    childProcess.stdout.on('data', function(message){
        done();
      });  
    browser = Browser.create();
    
  });
  after(function(done){
    childProcess.kill();
    done();
  })
  it('Should host the landing page on the default port', function(done){
    http.get('http://localhost:8080/', function(res){
      expect(res.statusCode).to.equal(200);
      done();
    }).on('error', function(err) {
      console.log("Got error: " + err.message);
      done(e);
    });
  });
  it('Should host variation.js', function(done){
    http.get('http://localhost:8080/variation.js', function(res){
      expect(res.statusCode).to.equal(200);
      done();
    }).on('error', function(err){
      console.log('Got error:' + err.message)
    });
  });
  it('Should host variation.css', function(done){
    http.get('http://localhost:8080/variation.css', function(res){
      expect(res.statusCode).to.equal(200);
      done();
    }).on('error', function(err){
      console.log('Got error:' + err.message)
    });
  })
});