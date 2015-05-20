var farmhash = require('farmhash');
var jsdom = require("jsdom");
var process = require("process");
var request = require("request");
var url = require("url");

var db = require("./database");

var priceNames = ["~b/o", "~c/o"];
var itemModRe = /[0-9]+/g;
var jquery = ["http://code.jquery.com/jquery.js"];

/* Custom errors constants */
var BUYOUT_FORUM_ERROR = 1024;
var CHARNAME_NOT_FOUND = "unnamed";

/*
* Simple url lib
*/
function getBaseUrl(uri) {
	var obj = url.parse(uri),
		result;

	return result = [
		obj.protocol,
		(obj.slashes) ? "//" : "",
		obj.host,
		"/"
	].join('');
}

function getHrefUrl(link, prefix) {
	var data = link.split("file:///"),
		host = (prefix === undefined) ? "" : prefix;

	if (data.length > 1) {
		return host + data[1];
	}

	return host + data[0].slice(1);

}

function getProfileUrl(profileLinkNode) {
	return profileLinkNode.firstChild.href;
}


/*
* Preparing json of item for insert to database.
* Updating default raw data more usable for search structure.
* @param mods_list is out param
* See @map.json for information, how
* mods stored in json
*/
function parseMods(type, mods_list) {
	var i,
		mod,
		baseMod;

	for (i = 0; i < mods_list.length; i += 1) {
		mod = mods_list[i];
		baseMod = mod.replace(itemModRe, "#");
		mods_list[i] = {
			val: mod.match(itemModRe),
			hash: farmhash.hash32(baseMod)
		};
		db.checkModAndInsert(type, baseMod, mods_list[i]);
	}
}

/*
* Default sockets item array
* [ group: N, attr: 'M' ],
* where N - links group, contained socked in item (0-6 \ 0-4 \ 0-3)
* and M - abbr of char attribute ( Dextrity \ Strengh \ Intellegence )
*/
function transformItemInfo(item) {

	if (item.implicitMods !== undefined) {
		parseMods(0, item.implicitMods);
	}

	if (item.explicitMods !== undefined) {
		parseMods(1, item.explicitMods);
	}

}

/* Can use default DOM api */
function getItemPrice(node) {
	if (node.nextSibling === undefined || node.nextSibling === null) {
		return "";
	}

	if (node.nextSibling.innerHTML === null || node.nextSibling.innerHTML === undefined) {
		return "";
	}

	return node.nextSibling.innerHTML;
}

function hasPrice(text) {
	if (text === undefined || text === null) {
		return false;
	}

	if (text.length < 4) {
		return false;
	}

	var i,
		has = false;

	for (i = 0; i < priceNames.length; i += 1) {
		if (text.indexOf(priceNames[i]) > -1) {
			has = true;
			break;
		}
	}

	return has;
}

function getThreadSource(scripts) {
	var i,
		raw_data,
		result;

	for (i = 0; i < scripts.length; i += 1) {
		if (scripts[i].text !== undefined && scripts[i].text !== null) {

			raw_data = scripts[i].text.split("function(R) { (new R(");
			if (raw_data.length > 1) {
				break;
			}

		}
	}

	try {
		raw_data = raw_data[1].split(")).run")[0];
	} catch (e) {
		/* Buyout thread, skip */
		return undefined;
	}

	try {
		return JSON.parse (raw_data);
	} catch (e) {
		return undefined;
	}
}

/*
* We looking for IGN in user profile.
* @param html string - profile page in any poe local site by GGG.
*/
function getCharName(html) {
	var keyClass,
		startIndex,
		charInfo,
		endIndex;

	try {
		keyClass = "characterName";
		startIndex = html.indexOf(keyClass);
		charInfo = html.slice(startIndex, startIndex + 200);
		endIndex = charInfo.indexOf("</");

		return charInfo.slice(keyClass.length + 2, endIndex);
	} catch (e) {
		return CHARNAME_NOT_FOUND;
	}
}

/*
* Collect item prices, user active IGN, item sockets, etc
* @param jQuery - dom object for one thread
*/
function buildThread(jQuery, threadInfo, baseUrl) {
	var i,
		postContent,
		source,
		items,
		text,
		profileUrl,
		charName = undefined,
		prices = [];

	postContent = jQuery(".content").first();
	items = postContent.find(".itemContentLayout");

	for (i = 0; i < items.length; i += 1) {
		text = getItemPrice(items.get(i));
		if (hasPrice(text)) {
			prices.push(text);
		} else {
			prices.push(null);
		}
	}

	source = getThreadSource(jQuery("script"));
	if (source === undefined) {
		return BUYOUT_FORUM_ERROR;
	}

	threadInfo.realmRegion = source[0][2].realmRegion;
	for (i = 0; i < prices.length; i += 1) {
		source[i] = source[i][1];

		source[i].price = prices[i];
		transformItemInfo(source[i]);
	}

	profileUrl = getProfileUrl(jQuery('.profile-link')[0]);
	profileUrl = getHrefUrl(profileUrl, getBaseUrl(threadInfo.url));

	request(profileUrl, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			return 0;
		}

		if (charName === undefined) {
			charName = getCharName(body);
		}

		threadInfo.charName = charName;
		db.initSaveThreadProc(source, threadInfo);
	});
}

/*
* @param done_func function (response, content) { ... }
*/
exports.parseThread = function(threadInfo, doneCb) {
	request(threadInfo.url, function(error, response, body) {
		if (error || response.statusCode !== 200) {
			return 0;
		}

		jsdom.env(
			body,
			jquery,
			function (errors, window) {
				buildThread(window.$, threadInfo);

				if (doneCb !== undefined && doneCb !== null) {
					doneCb ();
				}
			}
		);

	});

	return 0;
};

exports.parseThreadsList = function (list, doneCb, doneCbArgs) {
	var thread,
		count = list.length,
		doneThreadCb = function () {
			count = list.length;

			if (count === 0) {
				doneCb.apply(null, doneCbArgs);
			} else {
				thread = list.pop();
				console.log(thread.name, " thread now be parsed");

				/* Call stack with process api may be free */
				process.nextTick(function () {
					exports.parseThread(thread, doneThreadCb);
				});
			}
		};

	doneThreadCb();
};

exports.getBaseUrl = getBaseUrl;
exports.getHrefUrl = getHrefUrl;
