var publicSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1hNxU4YCmZZ5uRfq8_eHUwLspzNWncJzmdclrzYAGlvM/pubhtml';
function init() {
	Tabletop.init( {
		key: publicSpreadsheetUrl,
		callback: showInfo,
		simpleSheet: true
	} )
}

function showInfo(data, tabletop) {
	alert('Successfully processed!')
	console.log(data);
}

function makeTableHTML(myArray) {
	var result = "<table border=1>";
	for(var i=0; i<myArray.length; i++) {
		result += "<tr>";
		for(var j=0; j<myArray[i].length; j++){
			result += "<td>"+myArray[i][j]+"</td>";
		};
		
		result += "</tr>";
	};
	
	result += "</table>";
	return result;
}

window.addEventListener('DOMContentLoaded', init)
      
//$(‘.post’).append(makeTableHTML(data));
console.log(makeTableHTML(data));
