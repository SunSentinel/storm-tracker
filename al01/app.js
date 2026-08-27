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
                case 'H' : status = "Status: Hurricane, winds between 74 and 110 mph"; break;
                case 'M' : status = "Status: Major hurricane, winds greater than 110 mph"; break;
            }
            if (status) {
                layer.bindTooltip(status + "<br /> Expected: " + feature.properties.DATELBL, { maxHeight: 50 });
            }
        }
    },
    pointToLayer: function(feature, latlng) {
        // Grab the letter from the shapefile (D, S, H, or M)
        var letter = feature.properties.DVLBL;
        
        // Dynamically assign the CSS class defined in app.css
        var customClass = "storm-icon icon-" + letter;
        
        // Create the HTML-based icon
        var stormIcon = L.divIcon({
            className: customClass,
            html: letter,
            iconSize: [18, 18], // 18px width and height
            iconAnchor: [9, 9]  // Centers icon perfectly over coordinate
        });
        
        // Return a standard marker using our custom icon
        return L.marker(latlng, { icon: stormIcon });
    }
});
pointsShp.addTo(map).bringToFront();


// --- 5. NATIVE COLLAPSIBLE LEGEND ---
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    // Create the main container
    var div = L.DomUtil.create('div', 'leaflet-legend leaflet-bar leaflet-control');
    div.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    div.style.padding = '10px';
    div.style.lineHeight = '1.8em';
    div.style.color = '#333';
    
    // Prevent clicking the legend from clicking the map underneath
    L.DomEvent.disableClickPropagation(div);

    // Create the clickable header
    var header = L.DomUtil.create('div', 'legend-header', div);
    header.style.cursor = 'pointer';
    header.style.textAlign = 'center';
    
    // Create the content container
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
    html += '<br><strong>Path</strong><br>';
    html += '<div style="display:inline-block; width:18px; height:18px; background-color:#3d9da4; opacity:0.5; border-radius:50%; margin-right:6px; vertical-align:middle;"></div> Storm cone<br>';
    html += '<div style="display:inline-block; width:18px; height:2px; background-color:black; margin-right:6px; vertical-align:middle;"></div> Storm track<br>';
    html += '</div>';

    content.innerHTML = html;

    // Toggle logic function
    header.onclick = function() {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            header.innerHTML = '<strong>Legend &#9660;</strong>'; // Down arrow
        } else {
            content.style.display = 'none';
            header.innerHTML = '<strong>Legend &#9650;</strong>'; // Up arrow
        }
    };

    // Responsive design toggle (Auto-collapses on screens narrower than 450px)
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