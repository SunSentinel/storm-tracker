// var zipfile = "data/al102023_5day_007.zip";

var map = L.map('map').setView([27.176, -92.87], 4.5);

// Adding Voyager Basemap
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 18
}).addTo(map);

// Add a unique timestamp AND a fake .zip fragment to trick the shapefile parser
var cacheBuster = "?v=" + new Date().getTime() + "#.zip";


// --- 1. WIND WATCHES & WARNINGS ---
var wwlinZip = "data/wwlin.zip" + cacheBuster;
var wwlinShp = new L.Shapefile(wwlinZip, {
    onEachFeature: function(feature, layer) {
        if (feature.properties && feature.properties.TCWW) {
            var status = "";
            switch(feature.properties.TCWW) {
                case 'TWA': status = "Tropical storm watch"; break;
                case 'TWR': status = "Tropical storm warning"; break;
                case 'HWA': status = "Hurricane watch"; break;
                case 'HWR': status = "Hurricane warning"; break;
                case 'SWA': status = "Storm surge watch"; break;
                case 'SWR': status = "Storm surge warning"; break;
            }
            if (status) {
                layer.bindTooltip(status + ", as of " + feature.properties.ADVDATE, { maxHeight: 40 });
            }
        }
    },
    style: function(feature) {
        switch (feature.properties.TCWW) {
            case 'TWA': return {color: "#FBB631"}; // tropical storm watch
            case 'TWR': return {color: "#136383"}; // tropical storm warning
            case 'HWA': return {color: "#ee6d4a"}; // hurricane watch
            case 'HWR': return {color: "#D80000"}; // hurricane warning
            case 'SWA': return {color: "#61b8bf"}; // storm surge watch 
            case 'SWR': return {color: "#0000ff"}; // storm surge warning 
        }
    },
    stroke: true,
    weight: 4,
    opacity: 0.9
 });
wwlinShp.addTo(map);


// --- 2. CONE OF UNCERTAINTY ---
var coneZip = "data/pgn.zip" + cacheBuster;
var coneShp = new L.Shapefile(coneZip, {
    style: function(feature) {
        return {
            opacity: 0.5,
            fillOpacity: 0.5,
            stroke: false,
            color: "#3d9da4"
        }
    }
});
coneShp.addTo(map);


// --- 3. STORM TRACK LINE ---
var trackZip = "data/lin.zip" + cacheBuster;
var trackShp = new L.Shapefile(trackZip, {
    style: function(feature) {
        return {
            opacity: 1,
            fillOpacity: 1,
            stroke: true,
            weight: 1.75,
            color: "black"
        }
    }
});
trackShp.addTo(map);

// Automatically zoom and pan to the storm track once data loads
trackShp.once("data:loaded", function() {
    if (trackShp.getBounds().isValid()) {
        map.fitBounds(trackShp.getBounds(), { padding: [50, 50] });
    }
});


// --- 4. FORECAST POINTS (CUSTOM ALPHABETIC MARKERS) ---
var pointsZip = "data/points.zip" + cacheBuster;
var pointsShp = new L.Shapefile(pointsZip, {
    onEachFeature: function(feature, layer) {
        if (feature.properties && feature.properties.DVLBL) {
            var status = "";
            switch(feature.properties.DVLBL) {
                case 'D' : status = "Status: Tropical depression, winds under 39 mph"; break;
                case 'S' : status = "Status: Tropical storm, winds between 39 to 73 mph"; break;
                case 'H' : status = "Status: Hurricane, winds between 74 and