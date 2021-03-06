var urbanParks = new L.LayerGroup();
var urbanBuildings = new L.LayerGroup();
var riversideParks = new L.LayerGroup();
var riversideBuildings = new L.LayerGroup();

L.marker([51.503984, -0.118253]).addTo(riversideParks);
L.marker([51.497466, -0.124905]).addTo(riversideParks);
L.marker([51.506061, -0.116966]).addTo(riversideBuildings);
L.marker([51.499102, -0.124648]).addTo(riversideBuildings);
L.marker([51.503797, -0.143649]).addTo(urbanParks);
L.marker([51.530535, -0.153362]).addTo(urbanParks);
L.marker([51.500784, -0.143052]).addTo(urbanBuildings);
L.marker([51.497770, -0.101477]).addTo(urbanBuildings);

var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
});

var map = L.map('map', {
	center: [51.515, -0.13],
	zoom: 13,
	layers: [streets, urbanParks, urbanBuildings, riversideParks, riversideBuildings]
});

var baseLayers = {
	"Streets": streets
};

var matrixLayers = {
	'Urban/Parks': urbanParks,
	'Urban/Buildings': urbanBuildings,
	'Riverside/Parks': riversideParks,
	'Riverside/Buildings': riversideBuildings
};
var options = {
	dimensionNames: ['Locality', 'Type']
};

if (window.addLinks) {
	options.dimensionLabels = {
		Locality: '<a href="https://en.wiktionary.org/wiki/locality">Locality</a>',
		Type: '<a href="https://en.wiktionary.org/wiki/type">Type</a>'
	};
	options.dimensionValueLabels = {
		Locality: {
			Urban: '<a href="https://en.wiktionary.org/wiki/urban">Urban</a>',
			Riverside: '<a href="https://en.wiktionary.org/wiki/riverside">Riverside</a>'
		},
		Type: {
			Parks: '<a href="https://en.wiktionary.org/wiki/parks">Parks</a>',
			Buildings: '<a href="https://en.wiktionary.org/wiki/buildings">Buildings</a>'
		}
	};
}
var control = L.control.matrixLayers(baseLayers, null, matrixLayers, options);
control.addTo(map);
