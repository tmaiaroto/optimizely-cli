var fs = require('fs');
var path = require('path');
var mkdirSync = require('mkdirp').sync;
var baseCachePath = path.resolve(process.cwd(),'.optcli/','cache/')
module.exports = {
  read:function(id, format){
    var cachePath = path.resolve(baseCachePath, id + ".json")
    try{
      return JSON.parse(fs.readFileSync(cachePath, format || 'utf-8'));
    }catch(e){
      return false;
    }
  },
  write:function(obj){
    var cachePath = path.resolve(baseCachePath, obj.id + ".json");
    try{
      if(!fs.existsSync(baseCachePath)) mkdirSync(baseCachePath);
      fs.writeFileSync(cachePath, JSON.stringify(obj));
      return true;
    }catch(e){
      return e;
    }
  }
}
