var map = L.map('map').setView([32, -70], 4);

// Adding Voyager Basemap
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 18
}).addTo(map);

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

// var data;
// function addMarkers() {
//       var marker = L.circleMarker([+d.LAT, +d.LON])
//       marker.addTo(map)
//     };

// d3.csv("./al082023-020_5day_pts.csv")
// .then(function(csv) {
//     data = csv;
//     addMarkers();
//     });

 var shpfile = new L.Shapefile('al082023_5day_020.zip', {
    onEachFeature: function(feature, layer) {
        if (feature.properties) {
            layer.bindPopup(Object.keys(feature.properties).map(function(k) {
                return k + ": " + feature.properties[k];
            }).join("<br />"), {
                maxHeight: 200
            });
        }
    }
});
shpfile.addTo(map);



