var publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1hNxU4YCmZZ5uRfq8_eHUwLspzNWncJzmdclrzYAGlvM/pubhtml';
function init() {
	Tabletop.init( {
		key: publicSpreadsheetUrl,
		callback: showInfo,
		simpleSheet: true
	} )
};

function showInfo(data, tabletop) {
	console.log(makeTableHTML(data));
	$('.bookList').append(makeTableHTML(data));
};

function makeTableHTML(myArray) {
	var result = "<table><thead><tr><th>Title</th><th>Author</th></tr></thead>";
	for(var i=0; i<myArray.length; i++) {
		result += "<tr>";
		result += "<td>"+myArray[i].title+"</td>";
		result += "<td>"+myArray[i].author+"</td>";		
		result += "</tr>";
	};
	
	result += "</table>";
	return result;
};

window.addEventListener('DOMContentLoaded', init);
