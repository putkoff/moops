<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Shapefile Data Filtering</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <style>
        
        label {
        display: line;
        margin-bottom: 5px;
    }

    select {
        width: 200px;
        padding: 5px;
        margin-bottom: 10px;
    }

    #map {
        width: 100%;
        height: 600px; /* Set the height of your map container */
        background-color: lightgray; /* Placeholder background color */
        margin-bottom: 20px;
    }

        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        td, th { padding: 10px; border: 1px solid black; text-align: left; }
    </style>
    <script>
    async function highlightData(designation, items) {
    try {
        const response = await fetchData(designation, items);
        if (response.geo_json) {
            const filteredGeoJson = typeof response.geo_json === 'string' ? JSON.parse(response.geo_json) : response.geo_json;
            const columnName = response.column_name;  // Assuming column_name is sent separately and correctly by the server

            // Remove existing layer if it exists
            if (layers[designation]) {
                map.removeLayer(layers[designation]);
            }
            

            // Define the onEachFeature function using the column name dynamically
            function onEachFeature(feature, layer) {
                if (feature.properties && feature.properties[columnName]) {
                    layer.bindPopup(`Name: ${feature.properties[columnName]}`);
                }
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: zoomToFeature
                });
            }

            // Create a new layer for the designation
            layers[designation] = L.geoJSON(filteredGeoJson, {
                style: getStyle(designation),
                onEachFeature: onEachFeature
            }).addTo(map);
        } else {
            console.error('No GeoJSON data received for ' + designation);
        }
    } catch (error) {
        alert('Error highlighting data for ' + designation + ': ' + error.message);
        console.error('Error highlighting data for ' + designation + ':', error);
    }
}
</script>    
</head>
<body>
   <h1>Map with Shapefile Data Filtering</h1>
    <div class="select-container">
        <label for="countySelectA">County A:</label>
        <select id="countySelectA" onchange="highlightData('counties', this.value);">
            <option value="">--Choose a County--</option>
        </select>

        <label for="citySelectA">City A:</label>
        <select id="citySelectA" onchange="highlightData('cities', this.value);">
            <option value="">--Choose a City--</option>
        </select>
    </div>

    <div class="select-container">
        <label for="countySelectB">County B:</label>
        <select id="countySelectB" onchange="highlightData('counties', this.value);">
            <option value="">--Choose a County--</option>
        </select>

        <label for="citySelectB">City B:</label>
        <select id="citySelectB" onchange="highlightData('cities', this.value);">
            <option value="">--Choose a City--</option>
        </select>
    </div>

<div id="map"></div> <!-- Map container -->

<script>
// Function to ensure the input is an array
function ensureList(items) {
    return Array.isArray(items) ? items : [items];
}
let countyLayer;
let cityLayer;
let zipcodeLayer;
let map;  // Declare map at a higher scope
// Layer references for different designations
let layers = {
    counties: null,
    cities: null,
    zipcodes: null
};
// Style configuration for different designations
const styles = {
    zipcodes: { color: 'red', weight: 2, fillOpacity: 0.5 },
    cities: { color: 'blue', weight: 5, fillOpacity: 1 },
    counties: { color: 'green', weight: 1, fillOpacity: 0.3 }  // Changed fillOpacity from 3 to 0.3 for a valid value
};
// Define the territories and corresponding select IDs
const territories = {
    'counties': ['countySelectA', 'countySelectB'],
    'cities': ['citySelectA', 'citySelectB']
};

document.addEventListener('DOMContentLoaded', function() {
    map = L.map('map').setView([37.5, -119.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Now map can be accessed outside this block if needed
    fetchDropdownData(); // Make sure this function doesn't need the map object immediately
});
// Function to zoom into the feature
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}
// Function to get style based on designation
function getStyle(designation) {
    return styles[designation] || {};
}
// Function to fetch data from the server
function fetchData(designation, items = null) {
    let url = `/test/map/static-geolist/${designation}`;
    if (items) {
        url = `/test/map/filtered-geojson/${designation}/${items}`;
    }
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok for ' + designation);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error loading ' + designation + ':', error);
            throw error;
        });
}
function fetchDropdownData() {
    // Define the territories and corresponding select IDs
    const territories = {
        'counties': ['countySelectA','countySelectB'],
        'cities': ['citySelectA','citySelectB']
    };
    
    // Iterate over the territories object
    Object.keys(territories).forEach(key => {
        // Fetch data for each territory type (counties, cities, etc.)
        fetch(`/test/map/static-geolist/${key}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok for ' + key);
                }
                return response.json();
            })
            .then(items => {
                // Populate the dropdowns corresponding to this territory
                territories[key].forEach(selectId => {
                    populateDropdown(selectId, items);
                });
            })
            .catch(error => {
                console.error('Error loading ' + key + ':', error);
                alert('Error loading ' + key + ':', error);
            });
    });
}
// Function to handle events and tooltips for each feature
function onEachFeature(feature, layer) {
    // Add a popup or tooltip
    if (feature.properties && feature.properties.NAME) {
        layer.bindPopup(`Name: ${feature.properties.NAME}`);
    }

    // You can also add event listeners here
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
// Example function to style feature on mouseover
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}
// Function to reset the highlight style
function resetHighlight(e) {
    layers[e.target.feature.properties.designation].resetStyle(e.target);
}
// Function to handle dropdown change
function handleDropdownChange(designation, selectId) {
    const select = document.getElementById(selectId);
    const selectedItem = select.value;
    highlightData(designation, selectedItem);
}
// Add event listeners to each dropdown
Object.keys(territories).forEach(designation => {
    territories[designation].forEach(selectId => {
        const select = document.getElementById(selectId);
        select.addEventListener('change', () => {
            handleDropdownChange(designation, selectId);
        });
    });
});
function populateDropdown(selectId, items) {
    const select = document.getElementById(selectId);
    select.innerHTML = ''; // Clear existing options
    select.add(new Option('--Choose an option--', '')); // Add default option
    items.forEach(item => {
        const option = new Option(item, item);
        select.add(option);
    });
}
</script> 
</body>
</html>
