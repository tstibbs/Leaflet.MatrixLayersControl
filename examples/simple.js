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

var streets = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});

var map = L.map('map', {
	center: [51.515, -0.13],
	zoom: 13,
	layers: [streets, urbanParks, urbanBuildings, riversideParks, riversideBuildings]
});

var baseLayers = {
	"Streets": streets
};

var control = L.control.matrixLayers(baseLayers, null, {dimensionNames: ['Locality', 'Type'], loadingImage: 'loading.gif'});
control.addTo(map);

control.addMatrixOverlay(urbanParks, 'Urban/Parks');
control.addMatrixOverlay(urbanBuildings, 'Urban/Buildings');
control.addMatrixOverlay(riversideParks, 'Riverside/Parks');
control.addMatrixOverlay(riversideBuildings, 'Riverside/Buildings');
