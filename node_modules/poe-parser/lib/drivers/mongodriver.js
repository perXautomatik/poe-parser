var intel = require("intel");

/*
* Mongoose setup
*/
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var db = mongoose.connection;

var conf = require("./conf");

db.on('error', function (err) {
    intel.error('connection error:', err.message);
});

db.once('open', function callback () {
    intel.info("Connected to DB!");
});

mongoose.connect(conf.mongoHost);

var entrySchema = new Schema({}, { strict: false });
var Entry = mongoose.model('system_entries', entrySchema);

var threadSchema = new Schema({
	name: String,
	realmRegion: String,
	charName: String,
	url: String,
	data: Schema.Types.Mixed
});
var Thread = mongoose.model('threads', threadSchema);

function onInsertCb(err, res) {
	if (err) {
		intel.error("Error on inserting thread!");
	}
}

/*
* search by key @bumpTime in mongodb collection @system_entries
*/
exports.getLastUpdateTime = function (doneCb) {
	Entry.find({ 'bumpTime' : { $exists : true } }, function (err, items) {
		if (items.length === 0) {
			doneCb('none');
		} else {
			doneCb(items[0].get('bumpTime'));
		}
	});
};

/*
* Update thread, if given url in database exists,
* Else insert new thread to db.
*/
exports.initSaveThreadProc = function (threadJson, threadInfo) {
	var el = {
			name: threadInfo.name,
			url: threadInfo.url,
			realmRegion: threadInfo.realmRegion,
			charName: threadInfo.charName,
			data: threadJson
		};

	Thread.find({'url': threadInfo.url}, function (err, items) {
		if (items.length === 0) {
			new Thread(el).save();
		} else {
			Thread.update({ '_id': items[0].get('_id')}, el, onInsertCb)
		}
	});
};
