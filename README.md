## What is this?
It's like the [leaflet layers control](http://leafletjs.com/examples/layers-control.html) except that you can specify a multi-dimensional matrix of layers. This essentially means you can group layers by more than one aspect.

## How do I do that?
Something like this:
```
var control = L.control.matrixLayers(baseLayers, null, {dimensionNames: ['Locality', 'Type']});
control.addTo(map);

control.addMatrixOverlay(urbanParks, 'Urban/Parks');
control.addMatrixOverlay(urbanBuildings, 'Urban/Buildings');
control.addMatrixOverlay(riversideParks, 'Riverside/Parks');
control.addMatrixOverlay(riversideBuildings, 'Riverside/Buildings');
```

Notice that the first part of each name corresponds to the 'Locality' label and the second part of each name corresponds to the 'Type' label. There could be any number of these dimensions, but too many will affect performance.
