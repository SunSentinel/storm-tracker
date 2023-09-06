// CHANGE THE ZIP FILE HERE
// var zipfile = "data/al102023_5day_007.zip";

// var map = L.map('map').setView([28, -76], 4.5);
var map = L.map('map').setView([22, -62], 4);

// Adding Voyager Basemap
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 18
}).addTo(map);

// var svg = d3.select(map.getPanes().overlayPane).append("svg"),
//     g = svg.append("g").attr("class", "leaflet-zoom-hide");


// Try loading layers in as different shapefiles
// WIND WARNINGS
var wwlinZip = "data/wwlin.zip"
var wwlinShp = new L.Shapefile(wwlinZip, {
    onEachFeature: function(feature, layer) {
        if (feature.properties) {
            layer.bindTooltip(Object.keys(feature.properties.TCWW[0]).map(function(){
                switch(feature.properties.TCWW) {
                    case 'TWA' : return "Tropical storm watch, as of " + feature.properties.ADVDATE;
                    case 'TWR' : return "Tropical storm warning, as of " + feature.properties.ADVDATE;
                    case 'HWA' : return "Hurricane watch, as of " + feature.properties.ADVDATE;
                    case 'HWR' : return "Hurricane warning, as of " + feature.properties.ADVDATE;
                    case 'SWA' : return "Storm surge watch, as of " + feature.properties.ADVDATE;
                    case 'SWR' : return "Storm surge warning, as of " + feature.properties.ADVDATE;
                }
            }).join("<br />"), {
                maxHeight: 40
            });
        }
        // console.log(Object.keys(feature.properties.TCWW[0]))
        console.log(feature.properties.TCWW)
    },
    style: function(feature) {
        switch (feature.properties.TCWW) {
            case 'TWA': return {color: "#FBB631"}; //tropical storm watch
            case 'TWR':   return {color: "#136383"}; //tropical storm warning
            case 'HWA':   return {color: "#ee6d4a"}; //hurricane watch
            case 'HWR':   return {color: "#D80000"}; //hurricane warning
            case 'SWA':   return {color: "#61b8bf"}; //storm surge watch ?? CODE
            case 'SWR':   return {color: "#0000ff"}; //storm surge warning ?? CODE
        }
    },
    stroke: true,
    weight: 4,
    opacity: 0.9
 });

wwlinShp.addTo(map);


// CONE
var coneZip = "data/pgn.zip"
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

// TRACK
var trackZip = "data/lin.zip"
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


// POINTS
var pointsZip = "data/points.zip"
var pointsShp = new L.Shapefile(pointsZip, {
onEachFeature: function(feature, layer) {
    if (feature.properties) {
         // PREV: layer.bindTooltip(Object.keys(feature.properties.DVLBL).map(function(k) {
        layer.bindTooltip(Object.keys(feature.properties.DVLBL[0]).map(function() {
            switch(feature.properties.DVLBL) {
                case 'D' : return "Status: Tropical depression, winds under 39 mph <br /> Expected: " + feature.properties.DATELBL;
                case 'S' : return "Status: Tropical storm, winds between 39 to 73 mph <br /> Expected: " + feature.properties.DATELBL;
                case 'H' : return "Status: Hurricane, winds between 74 and 110 mph <br /> Expected: " + feature.properties.DATELBL;
                case 'M' : return "Status: Major hurricane, winds greater than 110 mph <br /> Expected: " + feature.properties.DATELBL;
            }
        })
        .join("<br />"), {
            maxHeight: 50
        });
        // console.log(feature.properties)
    }
},
pointToLayer: function(feature, latlng) {
    return L.circleMarker(latlng, {
        opacity: 1,
        fillOpacity: 1,
        color: "black"
    });
},
style: function(feature) {
    switch(feature.properties.DVLBL) {
        case 'D' : return {radius: 1};
        case 'S' : return {radius: 2};
        case 'H' : return {radius: 3};
        case 'M' : return {radius: 4, color: "red"};
    }
}
});
pointsShp.addTo(map);



 // LEGEND
var legend = L.control.legend({
    position: 'bottomright',
    collapsed: false,
    symbolWidth: 16,
    opacity: 0.9,
    column: 2,
    legends: [{
        label: "Storm path",
        type: "circle",
        fillColor: "#3d9da4",
        opacity: 0.5,
        radius: 6
    },
    {
        label: "Tropical storm, winds 39 to 73 mph",
        type: "circle",
        color: "black",
        fillColor: "black",
        radius: 2
    },
    {
        label: "Hurricane, winds 74 to 110 mph",
        type: "circle",
        color: "black",
        fillColor: "black",
        radius: 3
    },
    {
        label: "Major hurricane, winds over 110 mph",
        type: "circle",
        color: "red",
        fillColor: "red",
        radius: 4
    },
    {
        label: "Tropical storm watch",
        type: "polyline",
        color: "#FBB631",
        weight: 4,
    },
    {
        label: "Tropical storm warning",
        type: "polyline",
        color: "#136383",
        weight: 4,
    },
    {
        label: "Hurricane watch",
        type: "polyline",
        color: "#ee6d4a",
        weight: 4,
    },
    {
        label: "Hurricane warning",
        type: "polyline",
        color: "#d80000",
        weight: 4,
    }]
})
legend.addTo(map);



