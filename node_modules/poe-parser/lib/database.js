var dbdriver = require("./drivers/mongodriver");
var localStorage = require("./drivers/sqlite");

/*
* @param type Integer ( 0 - implicit, 1 - explicit)
* @param modObj Object
* {
*     val : [ int, ... ],
*     base: String
* }
*/
exports.checkModAndInsert = localStorage.checkModAndInsert;

/*
* @param doneCb function (time) {} 
* where time - unix timestamp or 'none' as String
*/
exports.getLastUpdateTime = dbdriver.getLastUpdateTime;

/*
* @param threadJson Object - see map json for move info
* @param threadInfo Object
* {
*     name: String
*     url: String
*     bumpTime: Int (unix timestamp)
* }
*/
exports.initSaveThreadProc = dbdriver.initSaveThreadProc;
