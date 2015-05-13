/* Parser, used for debugging, when main page is loaded */
var poeparser = require('poe-parser');

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

	/* Example, how to use thread parser */
	poeparser.parseThread(
		"http://web.poe.garena.ru/forum/view-thread/106"
	);
	
	res.render(
		'index',
		{
			'title': 'Ru poe.trade'
		}
	);
});

router.get('/search', function(req, res, next) {

	res.render(
		'index',
		{
			title: 'Ru poe.trade'
		}
	);
});


module.exports = router;
