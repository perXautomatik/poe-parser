var fs = require('fs');

/*
* Mods list database shema
*/
exports.createBaseTable = "CREATE TABLE IF NOT EXISTS `items_mods` (\
mod_type INT(2) NOT NULL,\
mod_value VARCHAR(512) PRIMARY KEY NOT NULL );";

/*
* Local database file for mods cache. In future this file may be moved to memcache.
*/
exports.modsFile = fs.realpathSync('') + "../db/mods.lock";

/*
* Default mongodb configuration after fresh install.
* You can change and database name, if want.
*/
exports.mongoHost = "mongodb://localhost:27017/poetrading";
