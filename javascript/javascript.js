var publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1hNxU4YCmZZ5uRfq8_eHUwLspzNWncJzmdclrzYAGlvM/pubhtml';
function init() {
	Tabletop.init( {
		key: publicSpreadsheetUrl,
		callback: showInfo,
		simpleSheet: true
	} )
};

function showInfo(data, tabletop) {
	alert('Successfully processed!')
	console.log(data);
};

window.addEventListener('DOMContentLoaded', init);
