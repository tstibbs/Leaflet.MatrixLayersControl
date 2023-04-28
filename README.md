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

## Compatability
The master branch is developed against leaflet 1.x. There is a 0.7.7 branch which was developed against leaflet 0.7.7, but fixes are not normally backported to this branch - I am happy to accept pull requests to it though.

## Examples
[Simple](https://tstibbs.github.io/Leaflet.MatrixLayersControl/examples/simple.html)

[Fullscreen](https://tstibbs.github.io/Leaflet.MatrixLayersControl/examples/fullscreen.html)

[Links on dimensions names and values](https://tstibbs.github.io/Leaflet.MatrixLayersControl/examples/links.html)

[Multiple aspects](https://tstibbs.github.io/Leaflet.MatrixLayersControl/examples/multi-aspect.html)

## Contributing

PRs are very welcome, but for any big changes or new features please open an issue to discuss first.
