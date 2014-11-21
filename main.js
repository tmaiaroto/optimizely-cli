fs = require('fs');
var opener = require('opener');

var OptimizelyClient = require('./lib/OptimizelyClient');

var apiToken = '879682bae11f2caccae44a9a9139b108:faf3989c';

var optimizelyClient = new OptimizelyClient(apiToken);

//create an experiment
// optimizelyClient.createExperiment({
//   projectId: 1709470138,
//   editUrl: 'http://www.gigaom.com',
//   description: 'Subscribe nav test'
// }).spread(function(data, response) {
//   console.log(data);
// }).error(function(e) {
//   console.error("unable to continue: ", e.message);
// });

var experimentId = 1856980241;
var baselineVar = 1859210326;
var firstVar = 1859210327;
var secondVar = 1865290982;
var thirdVar = 1868950199;

//update first variation
// optimizelyClient.updateVariation({
//   variationId: firstVar,
//   jsComponent: fs.readFileSync('./variation_one.js').toString(),
//   description: 'Membership'
// }).spread(function(data, response) {
//   console.log(data);
//   // open the variation 
//   // console.log('opening browser');
//   // opener('http://gigaom.com/?optimizely_x1856980241=1');
// }).error(function(e) {
//   console.error("unable to continue: ", e.message);
// });
//

//update second variation
// optimizelyClient.updateVariation({
//   variationId: secondVar,
//   jsComponent: fs.readFileSync('./variation_two.js').toString(),
//   description: 'Corp On Top'
// }).spread(function(data, response) {
//   console.log(data);
//   // open the variation 
//   // console.log('opening browser');
//   // opener('http://gigaom.com/?optimizely_x1856980241=1');
// }).error(function(e) {
//   console.error("unable to continue: ", e.message);
// });


// update third variation
optimizelyClient.updateVariation({
  variationId: thirdVar,
  jsComponent: fs.readFileSync('./variation_three.js').toString(),
  description: 'Subscribe First'
}).spread(function(data, response) {
  console.log(data);
  // open the variation 
  // console.log('opening browser');
  // opener('http://gigaom.com/?optimizely_x1856980241=1');
}).error(function(e) {
  console.error("unable to continue: ", e.message);
});


// open the variation 
// TODO: execute after a timeout
// console.log('opening variations in');
// opener('http://gigaom.com/?optimizely_x1856980241=1');
// opener('http://gigaom.com/?optimizely_x1856980241=2');

// optimizelyClient.createVariation({
//   experimentId: experimentId,
//   description: 'Corp On Top'
// }).spread(function(data, response) {
//   console.log(data);
// }).error(function(e) {
//   console.error("unable to continue: ", e.message);
// });

console.log('done');
