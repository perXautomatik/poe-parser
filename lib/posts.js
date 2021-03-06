var intel = require("intel");

var request = require("request");
var jsdom = require("jsdom");
var process = require("process");

var db = require("./database");

var localdate = require("./localdate");
var thread = require("./thread");

var jquery = ["http://code.jquery.com/jquery.js"];

/*
* Posts parser section
*/

function getThreadTitle(childNode) {
	return childNode.firstChild.nextSibling.firstChild.innerHTML.trim();
}

function getThreadUrl(uri, childNode) {
	var u = childNode.firstChild.nextSibling.firstChild.href;

	return thread.getHrefUrl(u, uri);
}

/*
* Transform human readable time format to unix timestamp
*/
function getThreadTime(childNode) {
	var dt,
		month,
		dateStr = childNode.lastChild.innerHTML;

	dt = new Date(dateStr);

	if (dt.getTime() > 0) {
		return dt.getTime();
	}

	/* Another lang rules */
	return localdate.parseByLang(dateStr).getTime();
}

/*
* Algorithm theory or how it work:
* Step one - send request to forum page for
* getting bumbed threads info by index @index;
* Step two - parse result body with jsdom.
* Step three - iterate for all founded threads,
* where bumbed time more than lastBumbedTime, stored in database
* And step four - send all threads uri to thread parser.
* 
*/
function parseForumThreads(tradeForum, index, pagesCount, lastBumpTime, outList) {
	var i,
		items,
		node,
		obj,
		doneCb,
		pageUrl,
		lastThread,
		funcArgs = arguments,
		jQ = this,
		clearContext,
		baseUri = jQ.baseUri,
		parseNext = false;

	index += 1;
	pageUrl = [tradeForum, "/page/", index].join('');

	/*
	* delete all links to in-memory objects
	*/
	clearContext = function () {
		items = null;
		node = null;
		jQ = null;
		lastThread = null,
		funcArgs = null;
	};

	doneCb = function (errors, window) {
		jq = window.$;

		items = jq(".thread");
		for (i = 0; i < items.length; i += 1) {
			node = items[i];

			/* Parse thread information */
			outList.push({
				name: getThreadTitle(node.firstChild),
				url: getThreadUrl(baseUri, node.firstChild),
				bumpTime: getThreadTime(node.lastChild)
			});

			lastThread = outList[outList.length - 1];

			if (lastThread.bumpTime >= lastBumpTime) {
				parseNext = false;
				break;
			} else {
				parseNext = true;
			}

		}

		/* If last bump more than db value or current index == pages count,
		* then parser will be stopped.
		*/
		parseNext &= (index <= pagesCount);

		/*
		* parse all bumped threads on page
		*/
		if (outList.length > 0) {

			/*
			* We should save current boolean result 
			* if call stack be destroyed
			*/
			(function (isNext, fArgs, $) {

				thread.parseThreadsList(
					outList,
					/* Call this function when threads parser finished its work */
					function () {
						var sendetArgs = arguments;
						if (isNext) {
							process.nextTick(function () {
								parseForumThreads.apply($, sendetArgs);
								clearContext();
							});
						}
					},
					fArgs
				);

			}(parseNext, funcArgs, jQ));
		}
	};

	request(pageUrl, function(err, response, body) {
		try{
			jsdom.env(
				body,
				jquery,
				doneCb
			);
		} catch (e) {
			intel.info("parseForumThreads: jsdom: failed to build DOM object from response body");
			intel.info("Restarting from new page...");
			parseForumThreads.apply(jQ, funcArgs);
		}
	});
}

/*
* @param tradeSection string
* @param pagesCount int
*/
function searchForLastStoredThread(tradeSection, pagesCount) {
	var list = [],
		$ = this;

	db.getLastUpdateTime(function (time) {
		/* Start process */
		parseForumThreads.call($, tradeSection, 0, pagesCount, time, list);
	});
}

/*
* Path of exile forums structure
* div[class=pagination] - top
*     a - first page
*     ...
*     a - last page
*     a - next page
*
* div[class=pagination]  bottom
*     a - first page
*     ...
*     a - last page
*     a - next page
*/
function getPagesCount(jQuery) {
	try{
		return parseInt(jQuery(".pagination").first()
							.find("a").last().prev().html(), 10);
	} catch (e) {
		return 1;
	}
}

/*
* If you want init simple parser - give as argument trade section.
* @param trade_section string - path of exile url,
* linked to one from any trade league sections (standart, hardcore, etc)
*/
exports.indexPosts = function(tradeSection) {
	var postsList,
		pagesCount,
		baseUri = thread.getBaseUrl(tradeSection);

	request(tradeSection, function(err, response, body) {
		if (err || response.statusCode !== 200) {
			return 0;
		}

		jsdom.env(
			body,
			jquery,
			function(errors, window) {

				window.$.baseUri = baseUri;
				pagesCount = getPagesCount(window.$);

				/* Init parser */
				searchForLastStoredThread.call(window.$, tradeSection, pagesCount);
			}
		);
	});

};

/* for example */
exports.indexPosts("http://web.poe.garena.ru/forum/view-forum/12");
