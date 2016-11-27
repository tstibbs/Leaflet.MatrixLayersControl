var riversidePark1 = L.marker([51.503984, -0.118253]);
var riversidePark2 = L.marker([51.497466, -0.124905]);
var riverside1 = L.marker([51.506061, -0.116966]);
var riverside2 = L.marker([51.499102, -0.124648]);
var park1 = L.marker([51.503797, -0.143649]);
var park2 = L.marker([51.530535, -0.153362]);

var riversideParks = new L.LayerGroup([riversidePark1, riversidePark2]);
var justParks = new L.LayerGroup([park1, park2]);
var justRiversides = new L.LayerGroup([riverside1, riverside2]);

var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
});

var map = L.map('map', {
	center: [51.515, -0.13],
	zoom: 13,
	layers: [streets]
});

var matrixLayers = {
	'Parks;Riverside': riversideParks,
	'Parks': justParks,
	'Riverside': justRiversides
};

var options = {
	dimensionNames: ['Type']
};

var control = L.control.matrixLayers(null, null, matrixLayers, options);
control.addTo(map);
