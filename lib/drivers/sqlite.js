var sqlite3 = require('sqlite3').verbose();
var conf = require('./conf');

var db = new sqlite3.Database(conf.modsFile);

db.run(conf.createBaseTable);

exports.checkModAndInsert = function (type, baseMod, obj) {
	var query = [
			"INSERT OR REPLACE INTO `items_mods` \
			( mod_type, mod_shortkey, mod_value) VALUES (",
			type,
			" , ",
			obj.hash,
			", \"",
			baseMod,
			"\");"
		].join('');
	db.run(query);
};
