L.Control.MatrixLayers = L.Control.Layers.extend({

	initialize: function (baseLayers, overlays, matrixOverlays, options) {
		L.Control.Layers.prototype.initialize.call(this, baseLayers, overlays, options);

		for (layerName in matrixOverlays) {
			this._addMatrixOverlay(matrixOverlays[layerName], layerName);
		}
	},

	onAdd: function (map) {
		var container = L.Control.Layers.prototype.onAdd.call(this, map);
		
		this._updateSelectedLayers();

		return container;
	},

	_update: function () {
		//much borrowed from https://github.com/Leaflet/Leaflet/blob/59a8c00a1850103f4fba8561961282eb21b29e7d/src/control/Control.Layers.js#L132
		if (!this._container) {
			return;
		}

		this._baseLayersList.innerHTML = '';
		this._overlaysList.innerHTML = '';

		var baseLayersPresent = false,
		    overlaysPresent = false,
		    i, obj;

		//get hold of all the dimension values
		var allDimensions = [];
		for (i in this._layers) {
			obj = this._layers[i];
			var layerName = obj.name;
			
			if (this._matrixLayers !== undefined && layerName in this._matrixLayers) {
				var dimensionElements = layerName.split('/');
				for (var i = 0; i < dimensionElements.length; i++) {
					var dimensionElement = dimensionElements[i];
					if (allDimensions[i] == undefined) {
						allDimensions[i] = {};
					}
					allDimensions[i][dimensionElement] = true;
				}
			} else {
				this._addItem(obj);
				overlaysPresent = overlaysPresent || obj.overlay;
				baseLayersPresent = baseLayersPresent || !obj.overlay;
			}
		}

		//now create the UI for all dimensions
		for (var i = 0; i < allDimensions.length; i++) {
			var dimensionName = this.options.dimensionNames[i];
			var dimension = allDimensions[i];
			var parentElement = document.createElement('div');
			parentElement.className = 'dimension-container';
			parentElement.dimensionName = dimensionName;
			
			var dimensionDisplay = dimensionName;
			if (this.options.dimensionLabels != null) {
				var display = this.options.dimensionLabels[dimensionName];
				if (display != null) {
					dimensionDisplay = display;
				}
			}
			
			var dimensionEl = document.createElement('div');
			dimensionEl.innerHTML = '<span>' + dimensionDisplay + ' (<a href="#" class="check-all">all</a> / <a href="#" class="check-none">none</a>)</span>';
			var context = this;
			
			function selectAll(parentElement, all) {
				var checkboxes = parentElement.getElementsByTagName('input');
				for (var i = 0; i < checkboxes.length; i++) {
					checkboxes[i].checked = all;
					context._saveSelectionState(checkboxes[i].dimensionName, checkboxes[i].dimensionValue, all);
				}
				context._updateLayerClick(parentElement);//once after updating all
			}

			var checkAllHref = dimensionEl.querySelector('a.check-all');
			var checkNoneHref = dimensionEl.querySelector('a.check-none');
			(function(parentElement) {//scoping
				checkAllHref.onclick = function() {
					selectAll(parentElement, true);
					return false;
				}
				checkNoneHref.onclick = function() {
					selectAll(parentElement, false);
					return false;
				}
			})(parentElement);
			parentElement.appendChild(dimensionEl);
						
			this._overlaysList.appendChild(parentElement);
			Object.keys(dimension).forEach(function (dimensionValue) { 
				this._addMatrixItem(parentElement, dimensionName, dimensionValue);
			}, this);
		}

	},

	_addMatrixOverlay: function (layer, name) {
		if (this._matrixLayers == undefined) {
			this._matrixLayers = {};
		}
		this._matrixLayers[name] = layer;
		this.addOverlay(layer, name);
	},
	
	
	_onMatrixInputClick: function (e) {
		this._handlingClick = true;

		var input = e.currentTarget;
		this._saveSelectionState(input.dimensionName, input.dimensionValue, input.checked);
		var labelElement = input.parentElement;
		this._updateLayerClick(labelElement);
	},

	_updateLayerClick: function(labelElement) {
		//the whirly loading image never worked very well, so just disable everything instead
		this._setOverlaysDisablement(true);
		//give the UI chance to update
		setTimeout(function() {
			this._updateSelectedLayers(function() {
				this._setOverlaysDisablement(false);
			}.bind(this));
		}.bind(this));
	},

	_updateSelectedLayers: function(callback) {
		//reset - onInputClick might have got there before us
		this._handlingClick = true;

		//get the inputs in each div and see which are ticked, to get a list of the selected dimension elements
		var divs = this._overlaysList.getElementsByTagName('div');
		var checkedDimensions = {};
		for (var i = 0; i < divs.length; i++) {
			var div = divs[i];
			var dimension = div.dimensionName;
			var inputs = div.getElementsByTagName('input');
			if (checkedDimensions[dimension] == undefined) {
				checkedDimensions[dimension] = new Array();
			}
			for (var j = 0; j < inputs.length; j++) {
				var input = inputs[j];
				if (input.checked) {
					checkedDimensions[dimension].push(input.dimensionId);
				}
			}
		}
		//map the group dimension names to an ordering
		var orderedDimensionElements = new Array();
		for (var i = 0; i < this.options.dimensionNames.length; i++) {
			var dimensionName = this.options.dimensionNames[i];
			var dimensionElements = checkedDimensions[dimensionName];
			orderedDimensionElements.push(dimensionElements);
		}
		//iterate to construct a list of selected layers
		var selectedLayerNames = {};
		this._depthFirstIteration(orderedDimensionElements, 0, "", function(path){
			selectedLayerNames[path] = true;
		});
		//now add or remove the layers from the map
		Object.keys(this._matrixLayers).forEach(function (layerName) {
			var layer = this._matrixLayers[layerName];
			if (layerName in selectedLayerNames && !this._map.hasLayer(layer)) {
				this._map.addLayer(layer);

			} else if (!(layerName in selectedLayerNames) && this._map.hasLayer(layer)) {
				this._map.removeLayer(layer);
			}
		}, this);
		
		if (callback !== undefined) {
			callback();			
		}

		this._handlingClick = false;

		this._refocusOnMap();
	},
	
	_depthFirstIteration: function (dimensions, dimensionIndex, parentPath, found) {
		var currentDimension = dimensions[dimensionIndex];
		if (currentDimension != undefined) {
			for (var i = 0; i < currentDimension.length; i++) {
				var dimensionValue = currentDimension[i];
				var newPath = dimensionValue;
				if (parentPath.length > 0) {
					newPath = parentPath + '/' + newPath;
				}
				var newIndex = dimensionIndex + 1;
				this._depthFirstIteration(dimensions, newIndex, newPath, found);
			}
		} else {
			found(parentPath);
		}
	},

	_addMatrixItem: function (parentElement, dimensionName, dimensionValue) {
		var label = document.createElement('label');

		var input = document.createElement('input');
		input.type = 'checkbox';
		input.className = 'leaflet-control-layers-selector';
		input.checked = this._getSelectionState(dimensionName, dimensionValue);
		input.dimensionId = dimensionValue;//L.stamp(obj.layer);//TODO//dimensionName + "::" + 
		input.dimensionName = dimensionName;
		input.dimensionValue = dimensionValue;

		L.DomEvent.on(input, 'click', this._onMatrixInputClick, this);

		var displayString = dimensionValue;
		if (this.options.dimensionValueLabels != null && this.options.dimensionValueLabels[dimensionName] != null && this.options.dimensionValueLabels[dimensionName][dimensionValue] != null) {
			displayString = this.options.dimensionValueLabels[dimensionName][dimensionValue];
		}
		var display = document.createElement('span');
		display.innerHTML = ' ' + displayString;

		label.appendChild(input);
		label.appendChild(display);

		parentElement.appendChild(label);

		return label;
	},

	//we have to override this to stop it finding our inputs and then struggling to find layers for them
	_onInputClick: function () {
		var i, input, obj,
		    inputs = this._form.getElementsByTagName('input'),
		    inputsLen = inputs.length;

		this._handlingClick = true;

		for (i = 0; i < inputsLen; i++) {
			input = inputs[i];
			if (input.dimensionId === undefined) {//check this isn't a matrix layer
				obj = this._layers[input.layerId];

				if (input.checked && !this._map.hasLayer(obj.layer)) {
					this._map.addLayer(obj.layer);

				} else if (!input.checked && this._map.hasLayer(obj.layer)) {
					this._map.removeLayer(obj.layer);
				}
			}
		}

		this._handlingClick = false;

		this._refocusOnMap();
	},
	
	_setOverlaysDisablement: function(disabled) {
		var nodes = document.querySelectorAll('div.leaflet-control-layers-overlays *');
		for (var i = 0; i < nodes.length; i++) {
			nodes[i].disabled = disabled;
			if (disabled) {
				nodes[i].classList.add('disabled');
			} else {
				nodes[i].classList.remove('disabled');
			}
		}
	},
	
	_saveSelectionState: function(dimensionName, dimensionValue, selected) {
		if (localStorage !== undefined) {
			localStorage.setItem('matrix_layers_control:' + dimensionName + '/' + dimensionValue, selected.toString());
		}
	},
	
	_getSelectionState: function(dimensionName, dimensionValue) {
		if (localStorage !== undefined) {
			var selected = localStorage.getItem('matrix_layers_control:' + dimensionName + '/' + dimensionValue);
			if (selected == null) {
				return true;//default to being selected
			} else {
				return "true" == selected;//local storage can only store strings
			}
		} else {
			return true;//default to being selected
		}
	}

});

L.control.matrixLayers = function (baseLayers, overlays, matrixOverlays, options) {
	return new L.Control.MatrixLayers(baseLayers, overlays, matrixOverlays, options);
};
