var cities = new L.LayerGroup();

L.marker([39.61, -105.02]).bindPopup('This is Littleton, CO.').addTo(cities),
L.marker([39.74, -104.99]).bindPopup('This is Denver, CO.').addTo(cities),
L.marker([39.73, -104.8]).bindPopup('This is Aurora, CO.').addTo(cities),
L.marker([39.77, -105.23]).bindPopup('This is Golden, CO.').addTo(cities);

var streets = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});

var map = L.map('map', {
	center: [39.73, -104.99],
	zoom: 10,
	layers: [streets, cities]
});

var baseLayers = {
	"Streets": streets
};

var overlays = {
	"Cities": cities
};

L.control.layers(baseLayers, overlays).addTo(map);
