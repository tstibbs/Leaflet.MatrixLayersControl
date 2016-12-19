var urbanParks = new L.LayerGroup();
var urbanBuildings = new L.LayerGroup();
var riversideParks = new L.LayerGroup();
var riversideBuildings = new L.LayerGroup();
var station_terminus_v = new L.LayerGroup();
var station_nonterminus_v = new L.LayerGroup();
var station_terminus_nonv = new L.LayerGroup();
var station_nonterminus_nonv = new L.LayerGroup();

L.marker([51.503984, -0.118253]).addTo(riversideParks);
L.marker([51.497466, -0.124905]).addTo(riversideParks);
L.marker([51.506061, -0.116966]).addTo(riversideBuildings);
L.marker([51.499102, -0.124648]).addTo(riversideBuildings);
L.marker([51.503797, -0.143649]).addTo(urbanParks);
L.marker([51.530535, -0.153362]).addTo(urbanParks);
L.marker([51.500784, -0.143052]).addTo(urbanBuildings);
L.marker([51.497770, -0.101477]).addTo(urbanBuildings);


L.marker([51.4966, -0.1448]).addTo(station_terminus_v); //victoria
L.marker([51.4854, -0.1229]).addTo(station_nonterminus_v); //vauxhall
L.marker([51.5031, -0.1132]).addTo(station_terminus_nonv); //waterloo
L.marker([51.505, -0.086]).addTo(station_nonterminus_nonv); //southwark



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
	'aspect1': {
		'Urban/Parks': urbanParks,
		'Urban/Buildings': urbanBuildings,
		'Riverside/Parks': riversideParks,
		'Riverside/Buildings': riversideBuildings
	},
	'stations': {
		'terminus;v': station_terminus_v,
		'nonterminus;v': station_nonterminus_v,
		'terminus': station_terminus_nonv,
		'nonterminus': station_nonterminus_nonv
	}
};
var options = {
	//dimensionNames: ['Locality', 'Type'],
	dimensionNames: {'aspect1': ['Locality', 'Type'], 'stations' : ['Stations']},
	aspects: ['aspect1', 'stations'],
	multiAspects: true
};

var control = L.control.matrixLayers(baseLayers, null, matrixLayers, options);
control.addTo(map);
