// CHANGE THE ZIP FILE HERE
var zipfile = "data/al082023_5day_020.zip"

var map = L.map('map').setView([32, -70], 4);

// Adding Voyager Basemap
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    attribution: 'Map: <a href="https://www.sun-sentinel.com/author/danica-jefferies/">Danica Jefferies / South Florida Sun Sentinel</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 18
}).addTo(map);

// var svg = d3.select(map.getPanes().overlayPane).append("svg"),
//     g = svg.append("g").attr("class", "leaflet-zoom-hide");

 var shpfile = new L.Shapefile(zipfile, {
    onEachFeature: function(feature, layer) {
        if (feature.properties) {
            layer.bindPopup(Object.keys(feature.properties).map(function(k) {
                return k + ": " + feature.properties[k];
            }).join("<br />"), {
                maxHeight: 200
            });
        }
        // console.log(feature.properties.DVLBL)
    },
    style: function(feature) {
        return {
            opacity: 1,
            fillOpacity: 0.6,
            // radius: 6,
            // color: feature.properties.__color__
        }
    },
    pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, {
            opacity: 1,
            fillOpacity: 0.8,
            radius: 5,
            color: 'black'
            // color: feature.properties.__color__,
        });
   }
 });
    
 shpfile.addTo(map);


