// var zipfile = "data/al102023_5day_007.zip";

var map = L.map('map').setView([27.176, -92.87], 4.5);

// Adding CartoDB Positron (Light & Minimal Basemap) - Now with API Key
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_2cv5_1_a7200e47d8bf0ea75d99f6fc', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 18
}).addTo(map);

// Add a unique timestamp AND a fake .zip fragment to trick the shapefile parser
var cacheBuster = "?v=" + new Date().getTime() + "#.zip";


// --- 0. SPAGHETTI MODEL TRACKS (FETCH & RENDER) ---
var spaghettiLayerGroup = L.layerGroup();

fetch('./data/spaghetti.geojson?v=' + new Date().getTime())
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Spaghetti GeoJSON not found or empty.');
        }
        return response.json();
    })
    .then(function(data) {
        if (data && data.features && data.features.length > 0) {
            var spaghettiGeoJson = L.geoJSON(data, {
                style: function(feature) {
                    return {
                        color: '#aaaaaa', // Clean, subtle light grey shade for all models
                        weight: 1.5,
                        opacity: 0.65,
                        dashArray: '4, 4' // Subtle dashed line styling
                    };
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties && feature.properties.model) {
                        layer.bindTooltip("Model: " + feature.properties.model, {
                            sticky: true,
                            direction: 'auto'
                        });
                    }
                }
            });
            spaghettiLayerGroup.addLayer(spaghettiGeoJson);
            spaghettiLayerGroup.addTo(map);

            // Send spaghetti layer to the background so NHC track & cone stay on top
            spaghettiGeoJson.bringToBack();
        }
    })
    .catch(function(err) {
        console.log("Notice: Could not load spaghetti models: " + err.message);
    });


// --- 1. WIND WATCHES & WARNINGS ---
var wwlinZip = "./data/wwlin.zip" + cacheBuster;
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
var coneZip = "./data/pgn.zip" + cacheBuster;
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
var trackZip = "./data/lin.zip" + cacheBuster;
var trackShp = new L.Shapefile(trackZip, {
    style: function(feature) {
        return {
            opacity: 1,
            fillOpacity: 1,
            stroke: true,
            weight: 2.5,
            color: "black"
        }
    }
});
trackShp.addTo(map);

// Automatically zoom and pan to the storm track once data loads
trackShp.once("data:loaded", function() {
    if (trackShp.getBounds().isValid()) {
        map.fitBounds(trackShp.getBounds(), { padding: [100, 100] });
    }
});


// --- 4. FORECAST POINTS (CUSTOM ALPHABETIC MARKERS) ---
var pointsZip = "./data/points.zip" + cacheBuster;
var pointsShp = new L.Shapefile(pointsZip, {
    onEachFeature: function(feature, layer) {
        if (feature.properties && feature.properties.DVLBL) {
            var status = "";
            switch(feature.properties.DVLBL) {
                case 'D' : status = "Status: Tropical depression, winds under 39 mph"; break;
                case 'S' : status = "Status: Tropical storm, winds between 39 to 73 mph"; break;
                case 'H' : status = "Status: Hurricane, winds between 74 and 110 mph"; break;
                case 'M' : status = "Status: Major hurricane, winds greater than 110 mph"; break;
            }
            if (status) {
                layer.bindTooltip(status + "<br /> Expected: " + feature.properties.DATELBL, { maxHeight: 50 });
            }
        }
    },
    pointToLayer: function(feature, latlng) {
        var letter = feature.properties.DVLBL;
        var customClass = "storm-icon icon-" + letter;
        
        var stormIcon = L.divIcon({
            className: customClass,
            html: letter,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });
        
        return L.marker(latlng, { icon: stormIcon });
    }
});
pointsShp.addTo(map).bringToFront();


// --- 5. NATIVE COLLAPSIBLE LEGEND ---
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'leaflet-legend leaflet-bar leaflet-control');
    div.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    div.style.padding = '10px';
    div.style.lineHeight = '1.8em';
    div.style.color = '#333';
    
    L.DomEvent.disableClickPropagation(div);

    var header = L.DomUtil.create('div', 'legend-header', div);
    header.style.cursor = 'pointer';
    header.style.textAlign = 'center';
    
    var content = L.DomUtil.create('div', 'legend-content', div);

    var html = '';
    // Storm Points
    html += '<div style="text-align: left; margin-top: 5px;">';
    html += '<strong>Storm Status</strong><br>';
    html += '<div class="storm-icon icon-D" style="display:inline-block; width:18px; height:18px; margin-right:6px; vertical-align:middle;">D</div> Tropical depression<br>';
    html += '<div class="storm-icon icon-S" style="display:inline-block; width:18px; height:18px; margin-right:6px; vertical-align:middle;">S</div> Tropical storm<br>';
    html += '<div class="storm-icon icon-H" style="display:inline-block; width:18px; height:18px; margin-right:6px; vertical-align:middle;">H</div> Hurricane<br>';
    html += '<div class="storm-icon icon-M" style="display:inline-block; width:18px; height:18px; margin-right:6px; vertical-align:middle;">M</div> Major hurricane<br>';

    // Watches & Warnings
    html += '<br><strong>Watches & Warnings</strong><br>';
    html += '<div style="display:inline-block; width:18px; height:4px; background-color:#FBB631; margin-right:6px; vertical-align:middle;"></div> Tropical storm watch<br>';
    html += '<div style="display:inline-block; width:18px; height:4px; background-color:#136383; margin-right:6px; vertical-align:middle;"></div> Tropical storm warning<br>';
    html += '<div style="display:inline-block; width:18px; height:4px; background-color:#ee6d4a; margin-right:6px; vertical-align:middle;"></div> Hurricane watch<br>';
    html += '<div style="display:inline-block; width:18px; height:4px; background-color:#d80000; margin-right:6px; vertical-align:middle;"></div> Hurricane warning<br>';

    // Path & Cone
    html += '<br><strong>Official Forecast</strong><br>';
    html += '<div style="display:inline-block; width:18px; height:18px; background-color:#3d9da4; opacity:0.5; border-radius:50%; margin-right:6px; vertical-align:middle;"></div> Forecast cone<br>';
    html += '<div style="display:inline-block; width:18px; height:3px; background-color:black; margin-right:6px; vertical-align:middle;"></div> Official track<br>';

    // Spaghetti Models Section & Toggle
    html += '<br><strong>Computer Models</strong><br>';
    html += '<label style="cursor:pointer; user-select:none;"><input type="checkbox" id="toggleSpaghetti" checked style="vertical-align:middle; margin-right:5px;"> Show spaghetti lines</label><br>';
    html += '<div style="display:inline-block; width:18px; height:0px; border-top:2px dashed #aaaaaa; margin-right:6px; vertical-align:middle;"></div> Computer models<br>';

    html += '</div>';

    content.innerHTML = html;

    // Toggle logic function
    header.onclick = function() {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            header.innerHTML = '<strong>Legend &#9660;</strong>';
        } else {
            content.style.display = 'none';
            header.innerHTML = '<strong>Legend &#9650;</strong>';
        }
    };

    if (window.innerWidth <= 450) {
        content.style.display = 'none';
        header.innerHTML = '<strong>Legend &#9650;</strong>'; 
    } else {
        content.style.display = 'block';
        header.innerHTML = '<strong>Legend &#9660;</strong>'; 
    }

    return div;
};

legend.addTo(map);

// Add event listener for the Spaghetti checkbox toggle after legend mounts
setTimeout(function() {
    var toggle = document.getElementById('toggleSpaghetti');
    if (toggle) {
        toggle.addEventListener('change', function(e) {
            if (e.target.checked) {
                map.addLayer(spaghettiLayerGroup);
                spaghettiLayerGroup.eachLayer(function(layer) {
                    if (layer.bringToBack) layer.bringToBack();
                });
            } else {
                map.removeLayer(spaghettiLayerGroup);
            }
        });
    }
}, 300);