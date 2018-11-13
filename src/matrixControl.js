function factory(leaflet) {
	var MatrixLayersModel = leaflet.Control.Layers.extend({

		initialize: function (dimensionNames) {
			this._dimensionNames = dimensionNames;
			this._layers = {};
			this._selections = {};
			this._layersToDimensions = {};
			this._dimensionsToRelatedLayers = {};
		},

//		_layers: {
//			"layer1": the actual layer object,
//			"layer2": the actual layer object,
//		},
//		_selections: {
// 			"dimension1": {
// 				"dimensionValue1": true,
// 				"dimensionValue2": false
// 			},
// 			"dimension2": {
// 			}
//		},
//		_layersToDimensions: {
// 			layer1: {
// 				"dimension1": "dimensionValue1",
// 				"dimension2": "dimensionValue5"
// 			}
//		},
//		_dimensionsToRelatedLayers: {
// 			"dimension1": {
// 				"dimensionValue1": [layer1, layer2],
// 				"dimensionValue2": [layer3, layer4]
// 			},
// 			"dimension2": {
// 			}
//		},

		setMap: function(map) {
			this._map = map;
		},
		
		addLayer: function(layer, name) {
			if (this._layers == undefined) {
				this._layers = {};
			}
			this._layers[name] = layer;
			var layerDims = {};
			var dimensionElements = name.split('/');
			for (var i = 0; i < dimensionElements.length; i++) {
				var dimensionName = this._dimensionNames[i];
				var dimensionValue = dimensionElements[i];
				layerDims[dimensionName] = dimensionValue;
				var dimensionValueParts = dimensionValue.split(';');
				for (var j = 0; j < dimensionValueParts.length; j++) {
					var dimensionValuePart = dimensionValueParts[j];
					if (this._dimensionsToRelatedLayers[dimensionName] == null) {
						this._dimensionsToRelatedLayers[dimensionName] = {};
					}
					if (this._dimensionsToRelatedLayers[dimensionName][dimensionValuePart] == null) {
						this._dimensionsToRelatedLayers[dimensionName][dimensionValuePart] = [];
					}
					this._dimensionsToRelatedLayers[dimensionName][dimensionValuePart].push(layer);
				}
			}
			this._setLayerDimensions(layer, layerDims);
		},

		_setLayerDimensions: function(layer, layerDims) {
			this._layersToDimensions[L.Util.stamp(layer)] = layerDims;
		},

		_getLayerDimensions: function(layer) {
			return this._layersToDimensions[L.Util.stamp(layer)];
		},

		getLayers: function() {
			return this._layers;
		},
		
		inputChanged: function(dimensionName, dimensionValue, checked) {
			this._saveSelectionState(dimensionName, dimensionValue, checked);
			if (this._selections[dimensionName] == null) {
				this._selections[dimensionName] = {};
			}
			this._selections[dimensionName][dimensionValue] = checked;
		},
		
		//
		
		getSelectedLayerNames: function() {
			//map the group dimension names to an ordering
			var orderedDimensionElements = new Array();
			for (var i = 0; i < this._dimensionNames.length; i++) {
				var dimensionName = this._dimensionNames[i];
				var dimensionElements = [];
				var dimensionSelections = this._selections[dimensionName];
				for (var dimId in dimensionSelections) {
					if (dimensionSelections[dimId] === true || dimId == '*') {
						dimensionElements.push(dimId);
					}
				}
				orderedDimensionElements.push(dimensionElements);
			}
			//iterate to construct a list of selected layers
			var selectedLayers = [];
			this._depthFirstIteration(orderedDimensionElements, 0, "", function(newSelectedLayers) {
				selectedLayers = selectedLayers.concat(newSelectedLayers);
			});
			
			return selectedLayers;
		},
		
		_depthFirstIteration: function (dimensions, dimensionIndex, parentPath, found, selectedLayers) {
			var currentDimension = dimensions[dimensionIndex];
			var dimensionName = this._dimensionNames[dimensionIndex];
			if (currentDimension != undefined) {
				var dimensionLayers = this._dimensionsToRelatedLayers[dimensionName];
				for (var i = 0; i < currentDimension.length; i++) {
					var dimensionValue = currentDimension[i];
					var dimensionValueLayers = dimensionLayers[dimensionValue];
					var newSelectedLayers = dimensionValueLayers;
					if (dimensionIndex > 0) {//i.e. we're not at the first one
						newSelectedLayers = selectedLayers.filter(function(n) {
							return dimensionValueLayers.indexOf(n) != -1;
						});
					}
					var newIndex = dimensionIndex + 1;
					this._depthFirstIteration(dimensions, newIndex, parentPath, found, newSelectedLayers);
				}
			} else {
				found(selectedLayers);
			}
		},
		
		getCountForElement: function(dimensionName, dimensionValue){
			var layers = this._getLayersForInput(dimensionName, dimensionValue);
			var count = this._sumMarkerCounts(layers);
			return count;
		},

		_getLayersForInput: function(currentDimensionName, currentDimensionValue) {
			var dimensionValueParts = currentDimensionValue.split(';');
			dimensionValueParts.push('*');
			var layers = [];
			for (var i = 0; i < dimensionValueParts.length; i++) {
				var part = dimensionValueParts[i];
				var partsLayers = this._dimensionsToRelatedLayers[currentDimensionName][part];
				if (partsLayers != null) {
					layers = layers.concat(partsLayers.filter(function (item) {
						return layers.indexOf(item) < 0;
					}));
				}
			}
			if (layers.length > 0) {
				return layers.filter(function(layer) {
					var layerDimensions = this._getLayerDimensions(layer);
					var allTicked = Object.keys(layerDimensions).reduce(function(allTicked, dimensionName) {
						if (dimensionName != currentDimensionName) {
							var dimensionValue = layerDimensions[dimensionName];
							var dimensionValueParts = dimensionValue.split(';');
							for (var j = 0; j < dimensionValueParts.length; j++) {
								var ticked = this._selections[dimensionName] != null && this._selections[dimensionName][dimensionValue] === true;
								allTicked = allTicked && ticked;
							}
							return allTicked;
						} else {
							return allTicked;
						}
					}.bind(this), true);
					return allTicked;
				}, this);
			} else {
				return null;
			}
		},

		_sumMarkerCounts: function(layers) {
			var count = layers.reduce(function(total, curr) {
				return total + curr.getLayers().length;
			}, 0);
			return count;
		},
		
		//
		
		_saveSelectionState: function(dimensionName, dimensionValue, selected) {
			if (localStorage !== undefined) {
				localStorage.setItem('matrix_layers_control:' + dimensionName + '/' + dimensionValue, selected.toString());
			}
		},
		
		getSavedSelectionState: function(dimensionName, dimensionValue) {
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
	
	var matrixLayers = leaflet.Control.Layers.extend({
		initialize: function (baseLayers, overlays, matrixOverlays, options) {
			leaflet.Control.Layers.prototype.initialize.call(this, baseLayers, overlays, options);
			leaflet.Util.setOptions(this, {
				multiAspects: false,
				aspects: [],
				dimensionNames: {},
				aspectLabels: {},//{aspectName1: 'Aspect Label 1'}
				dimensionLabels: {},//{dimensionName1: 'Dimension Label 1'}
				dimensionValueLabels: {},//{dimensionName1: {dimensionValue1: 'Dimension Value Label 1'}}
			});//workaround for the fact that you can't have mutable options as they persist between objects
			leaflet.Util.setOptions(this, options);
			this._overlaysByAspect = {};
			this._modelByAspect = {};
			this._matrixInputsByAspect = {};
			this._lazyAspects = {};
 			if (this.options.multiAspects) {
				for (var i = 0; i < this.options.aspects.length; i++) {
					var aspect = this.options.aspects[i];
					var aspectOverlays = matrixOverlays[aspect];
					this._addAspect(aspect, aspectOverlays);
				}
 			} else {
				var dummyAspect = 'single_aspect';
				this.addAspect(aspect, matrixOverlays, options)
 			}
		},
		
		_addAspectDetails: function(aspect, options) {
			if (options.dimensionNames) {
				this.options.dimensionNames[aspect] = options.dimensionNames;
			}
			if (options.dimensionLabels) {
				this.options.dimensionLabels[aspect] = options.dimensionLabels;
			}
			if (options.dimensionValueLabels) {
				this.options.dimensionValueLabels[aspect] = options.dimensionValueLabels;
			}
			if (options.aspectLabel) {
				this.options.aspectLabels[aspect] = options.aspectLabel;
			}
		},

		addLazyAspect: function(aspect, options, meta) {//meta must include 'callback'
			this._addAspectDetails(aspect, options);
			if (meta.callback == null) {
				throw new Error("Lazy aspect meta's must include a 'callback' function.");
			}
			this._lazyAspects[aspect] = meta;
		},

		addAspect: function(aspect, aspectOverlays, options) {
			this._addAspectDetails(aspect, options);
			this.options.aspects.push(aspect);
			this._addAspect(aspect, aspectOverlays);
		},
		
		_addAspect: function(aspect, aspectOverlays) {
			delete this._lazyAspects[aspect];
			this._modelByAspect[aspect] = new MatrixLayersModel(this.options.dimensionNames[aspect]);
			this._matrixInputsByAspect[aspect] = [];
			this._overlaysByAspect[aspect] = [];
			
			for (layerName in aspectOverlays) {
				this._addMatrixOverlay(aspectOverlays[layerName], layerName, aspect);
			}
			
			if (this._map) {
				this._update();
			}
		},
		
		_model: function (aspect) {
			return this._modelByAspect[aspect];
		},
		
		_matrixInputs: function (aspect) {
			return this._matrixInputsByAspect[aspect];
		},

		onAdd: function (map) {
			var container = leaflet.Control.Layers.prototype.onAdd.call(this, map);
			for (var i = 0; i < this.options.aspects.length; i++) {
				var aspect = this.options.aspects[i];
				this._model(aspect).setMap(map);
				this._updateSelectedLayers(aspect, undefined);
			}
			return container;
		},

		_safeGet: function(map/*, keys*/) {
			var keys = Array.prototype.slice.call(arguments, 1);
			keys.forEach(function(key) {
				if (map != null) {
					map = map[key];
				}
			});
			return map;
		},

		_drawAspect: function(aspect) {
			var aspectElement = document.createElement('div');
			aspectElement.className = 'aspect';
			this._overlaysList.appendChild(aspectElement);
			var aspectContainer = aspectElement;
			
			if (this.options.multiAspects) {
				leaflet.DomUtil.addClass(aspectElement, 'expanded');
				var aspectTitle = leaflet.DomUtil.create('div', 'aspect-title', aspectElement);
				var aspectTitleText = leaflet.DomUtil.create('span', null, aspectTitle);
				var titleString = this.options.aspectLabels[aspect];
				//if there is only one dimension, and it has a label, use that as the aspect label
				if (titleString == null) {
					var aspectLabels = this.options.dimensionLabels[aspect];
					if (aspectLabels != null) {
						var dimensionKeys = Object.keys(aspectLabels);
						if (dimensionKeys.length == 1) {
							titleString = this.options.dimensionLabels[aspect][dimensionKeys[0]];
						}
					}
				}
				//if no labels at all, just use the aspect name
				if (titleString == null) {
					titleString = aspect
				}
				aspectTitleText.innerHTML = titleString;
				var upArrow = leaflet.DomUtil.create('i', 'fa fa-caret-up aspect-arrow-up', aspectTitle);
				var downArrow = leaflet.DomUtil.create('i', 'fa fa-caret-down aspect-arrow-down', aspectTitle);
				upArrow.setAttribute('aria-hidden', 'true');
				downArrow.setAttribute('aria-hidden', 'true');
				var expandCollapse = function(aspectElement){
					return function() {
						if (leaflet.DomUtil.hasClass(aspectElement, 'expanded')) {
							leaflet.DomUtil.removeClass(aspectElement, 'expanded');
							leaflet.DomUtil.addClass(aspectElement, 'collapsed');
						} else {
							leaflet.DomUtil.removeClass(aspectElement, 'collapsed');
							leaflet.DomUtil.addClass(aspectElement, 'expanded');
						}
					};
				}(aspectElement);//scoping
				leaflet.DomEvent.on(upArrow, 'click', expandCollapse, this);
				leaflet.DomEvent.on(downArrow, 'click', expandCollapse, this);
				aspectContainer = leaflet.DomUtil.create('div', 'aspect-container', aspectElement);
			}
			
			return {
				aspectContainer: aspectContainer,
				aspectTitle: aspectTitle
			};
		},
		
		_update: function () {
			if (!this._container) {
				return;
			}

			leaflet.Control.Layers.prototype._update.call(this);
			this._separator.style.display = ''; //this is a bit of an upgrade risk, but is probably preferable to pulling in the code from this method from the standard layers control
			
			for (var a = 0; a < this.options.aspects.length; a++) {
				var aspect = this.options.aspects[a];
				var aspectContainers = this._drawAspect(aspect);

				//get hold of all the dimension values
				var allDimensions = [];
				for (var i = 0; i < this._overlaysByAspect[aspect].length; i++) {
					var obj = this._overlaysByAspect[aspect][i];
					var layerName = obj.name;
					
					if (this._model(aspect).getLayers() !== undefined && layerName in this._model(aspect).getLayers()) {
						var dimensionElements = layerName.split('/');
						for (var j = 0; j < dimensionElements.length; j++) {
							var dimensionElement = dimensionElements[j];
							if (allDimensions[j] == undefined) {
								allDimensions[j] = {};
							}
							var dimensionElementParts = dimensionElement.split(';');
							for (var k = 0; k < dimensionElementParts.length; k++) {
								var part = dimensionElementParts[k];
								allDimensions[j][part] = true;
							}
						}
					}
				}

				//now create the UI for all dimensions
				for (var i = 0; i < allDimensions.length; i++) {
					var dimensionName = this.options.dimensionNames[aspect][i];
					var dimension = allDimensions[i];
					var parentElement = document.createElement('div');
					parentElement.className = 'dimension-container';
					parentElement.dimensionName = dimensionName;
					
					var dimensionDisplay = dimensionName;
					if (allDimensions.length == 1) {
						dimensionDisplay = '';//only one dimension, so don't show the label (because it will duplicate the aspect label)
					} else if (this.options.dimensionLabels != null) {
						var display = this._safeGet(this.options.dimensionLabels, aspect, dimensionName);
						if (display != null) {
							dimensionDisplay = display;
						}
					}
					
					var dimensionEl = document.createElement('div');
					dimensionEl.innerHTML = '<span>' + dimensionDisplay + ' (<a href="#" class="check-all">all</a> / <a href="#" class="check-none">none</a>)</span>';
					var context = this;
					
					function selectAll(parentElement, aspect, all) {
						var checkboxes = parentElement.getElementsByTagName('input');
						for (var j = 0; j < checkboxes.length; j++) {
							checkboxes[j].checked = all;
							context._model(aspect).inputChanged(checkboxes[j].dimensionName, checkboxes[j].dimensionValue, all);
						}
						context._updateLayerClick(aspect);//once after updating all
					}

					var checkAllHref = dimensionEl.querySelector('a.check-all');
					var checkNoneHref = dimensionEl.querySelector('a.check-none');
					(function(parentElement, aspect) {//scoping
						checkAllHref.onclick = function() {
							selectAll(parentElement, aspect, true);
							return false;
						}
						checkNoneHref.onclick = function() {
							selectAll(parentElement, aspect, false);
							return false;
						}
					})(parentElement, aspect);
					parentElement.appendChild(dimensionEl);
								
					aspectContainers.aspectContainer.appendChild(parentElement);
					Object.keys(dimension).forEach(function (dimensionValue) { 
						this._addMatrixItem(parentElement, dimensionName, dimensionValue, aspect);
					}, this);
				}
			}
			
			for (aspect in this._lazyAspects) {
				var aspectContainers = this._drawAspect(aspect);
				var aspectMeta = this._lazyAspects[aspect];
				var descriptionContainer = leaflet.DomUtil.create('div', 'dimension-container', aspectContainers.aspectContainer);
				var description = leaflet.DomUtil.create('div', '', descriptionContainer);
				description.innerHTML = aspectMeta.description;
				var loader = leaflet.DomUtil.create('a', '', descriptionContainer);
				loader.setAttribute('href', '#');
				loader.innerHTML = 'Load...'
				loader.onclick = (function(loader, aspectTitle, callback) {
					return function() {
						var spinContainer = leaflet.DomUtil.create('div', 'spin-container', aspectTitle);
						leaflet.DomUtil.create('i', 'lazy-spinner fa fa-spinner fa-spin', spinContainer);
						callback();
						return false;
					}.bind(this)
				}).bind(this)(loader, aspectContainers.aspectTitle, aspectMeta.callback);//scoping
			}
		},

		_addMatrixOverlay: function (layer, name, aspect) {
			this._model(aspect).addLayer(layer, name);	
			this._overlaysByAspect[aspect].push({
				layer: layer,
				name: name,
				overlay: true
			});
			
		},
		
		_onMatrixInputClick: function(aspect) {
			return function (e) {
				this._handlingClick = true;

				var input = e.currentTarget;
				this._model(aspect).inputChanged(input.dimensionName, input.dimensionValue, input.checked);
				//var labelElement = input.parentElement;
				this._updateLayerClick(aspect);
			}
		},

		_updateLayerClick: function(aspect) {
			//the whirly loading image never worked very well, so just disable everything instead
			this._setOverlaysDisablement(true);
			//give the UI chance to update
			setTimeout(function() {
				this._updateSelectedLayers(aspect, function() {
					this._setOverlaysDisablement(false);
				}.bind(this));
			}.bind(this));
		},

		_updateSelectedLayers: function(aspect, callback) {
			//reset - onInputClick might have got there before us
			this._handlingClick = true;

			var selectedLayers = this._model(aspect).getSelectedLayerNames();
			
			//now add or remove the layers from the map
			var layers = this._model(aspect).getLayers();
			Object.keys(layers).forEach(function (layerName) {
				var layer = layers[layerName];
				if (selectedLayers.indexOf(layer) != -1 && !this._map.hasLayer(layer)) {
					this._map.addLayer(layer);

				} else if (!(selectedLayers.indexOf(layer) != -1) && this._map.hasLayer(layer)) {
					this._map.removeLayer(layer);
				}
			}, this);

			for (var i = 0; i < this._matrixInputs(aspect).length; i++) {
				var label = this._matrixInputs(aspect)[i];
				var input = label.querySelector('input');
				var dimensionName = input.dimensionName;
				var dimensionValue = input.dimensionValue;
				var count = this._model(aspect).getCountForElement(dimensionName, dimensionValue);
				var displayElement = label.querySelector('span.count');
				displayElement.innerHTML = count;
			}
			
			if (callback !== undefined) {
				callback();			
			}

			this._handlingClick = false;

			this._refocusOnMap();
		},

		_addMatrixItem: function (parentElement, dimensionName, dimensionValue, aspect) {
			var selected = this._model(aspect).getSavedSelectionState(dimensionName, dimensionValue);
			this._model(aspect).inputChanged(dimensionName, dimensionValue, selected);

			var label = document.createElement('label');

			var input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'leaflet-control-layers-selector';
			input.checked = selected;
			input.dimensionId = dimensionValue;//L.stamp(obj.layer);//TODO//dimensionName + "::" + 
			input.dimensionName = dimensionName;
			input.dimensionValue = dimensionValue;

			var clickListener = this._onMatrixInputClick(aspect);
			leaflet.DomEvent.on(input, 'click', clickListener, this);

			var displayString = dimensionValue;
			if (this.options.dimensionValueLabels != null) {
				var possibleDisplayString = this._safeGet(this.options.dimensionValueLabels, aspect, dimensionName, dimensionValue);
				if (possibleDisplayString != null) {
					displayString = possibleDisplayString;
				}
			}
			var display = document.createElement('span');
			var displayLeft = document.createElement('span');
			var displayCount = document.createElement('span');
			displayCount.classList.add('count');
			var displayRight = document.createElement('span');
			var count = this._model(aspect).getCountForElement(dimensionName, dimensionValue)
			displayLeft.innerHTML = ' ' + displayString + ' (';
			displayCount.innerHTML = count;
			displayRight.innerHTML = ')';

			display.appendChild(displayLeft);
			display.appendChild(displayCount);
			display.appendChild(displayRight);

			label.appendChild(input);
			label.appendChild(display);

			parentElement.appendChild(label);

			this._matrixInputs(aspect).push(label);
		},

		//we have to override this to stop it finding our inputs and then struggling to find layers for them
		_onInputClick: function () {
			var inputs = this._form.getElementsByTagName('input');

			this._handlingClick = true;

			for (var i = 0; i < inputs.length; i++) {
				var input = inputs[i];
				if (input.dimensionId === undefined) {//check this isn't a matrix layer
					var layer = this._getLayer(input.layerId).layer;

					if (!input.checked && this._map.hasLayer(layer)) {
						this._map.removeLayer(layer);
					} else if (input.checked && !this._map.hasLayer(layer)) {
						this._map.addLayer(layer);
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
		
		_checkDisabledLayers: function() {
			//do nothing, we can't support this functionality for now
		},
		
		_initLayout: function () {
			if (!this.options.embeddable) {
				leaflet.Control.Layers.prototype._initLayout.call(this);
			} else {
				var className = 'leaflet-control-layers';

				var section = this._container = this._form = leaflet.DomUtil.create('section', className + '-list');

				leaflet.DomEvent.disableClickPropagation(section);
				leaflet.DomEvent.disableScrollPropagation(section);

				this._baseLayersList = leaflet.DomUtil.create('div', className + '-base', section);
				this._separator = leaflet.DomUtil.create('div', className + '-separator', section);
				this._overlaysList = leaflet.DomUtil.create('div', className + '-overlays', section);
			}
			if (this.options.multiAspects) {
				leaflet.DomUtil.addClass(this._overlaysList, 'multi-aspect')
			}
		},
		
		addTo: function (map) {
			if (!this.options.embeddable) {
				leaflet.Control.Layers.prototype.addTo.call(this, map);
			} else {
				this.remove();
				this._map = map;

				this.onAdd(map);
				
				return this;
			}
		}
	});

	return matrixLayers;
}

//umd
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('leaflet'));
    } else {
        root.L.Control.MatrixLayers = factory(root.L);
		root.L.control.matrixLayers = function (baseLayers, overlays, matrixOverlays, options) {
			return new root.L.Control.MatrixLayers(baseLayers, overlays, matrixOverlays, options);
		};
    }
}(this, factory));
