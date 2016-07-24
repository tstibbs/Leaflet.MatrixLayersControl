L.Control.MatrixLayers = L.Control.Layers.extend({	
	//_update: function () {
	//}
});

L.control.matrixLayers = function (baseLayers, overlays, options) {
	return new L.Control.MatrixLayers(baseLayers, overlays, options);
};
