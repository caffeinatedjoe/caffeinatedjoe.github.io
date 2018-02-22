function init() {
 Tabletop.init( { key: ‘https://docs.google.com/spreadsheets/d/1hNxU4YCmZZ5uRfq8_eHUwLspzNWncJzmdclrzYAGlvM/pubhtml',
 callback: function(data, tabletop) { 
 console.log(data)
 },
 simpleSheet: true } )
}
window.addEventListener(‘DOMContentLoaded’, init)
