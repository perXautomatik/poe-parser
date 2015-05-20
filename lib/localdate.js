
var RU = {
	'декабря': 'December',
	'января': 'January',
	'февраля': 'February',
	'марта': 'March',
	'апреля': 'April',
	'мая': 'May',
	'июня': 'June',
	'июля': 'July',
	'августа': 'August',
	'сентября': 'September',
	'октября': 'October',
	'ноября': 'November',
	'lang': 'RU'
};

var EN = {
	'December': 'December',
	'January': 'January',
	'February': 'February',
	'March': 'March',
	'April': 'April',
	'May': 'May',
	'June': 'June',
	'July': 'July',
	'August': 'August',
	'September': 'September',
	'October': 'October',
	'November': 'November',
	'lang': 'EN'
};

var languages = [ RU, EN ];
var monthRe = /[^\w\s]+/g;

function getLang(month) {
	var i;

	for (i = 0; i < languages.length; i += 1) {
		if (languages[i][month] !== undefined) {
			return languages[i];
		}
	}

	return EN;
}

exports.parseByLang = function(date) {
	var month = date.match(monthRe)[0],
		dict = getLang(month.toLowerCase()),
		lang = dict.lang,
		result = date;

	switch (lang) {
		case 'RU':
			result = [dict[month], " ",
						date.replace(month, "").replace("г.", "")].join('');
			break;
		default:
			break;
	}

	return new Date(result);
}
