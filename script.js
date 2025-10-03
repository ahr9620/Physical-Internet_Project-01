mapboxgl.accessToken = 'pk.eyJ1IjoiYXNocmVlZGVyIiwiYSI6ImNtOTA1dnZsZDBjZ3Iya3Bxb3kzMmtla3AifQ.GZL-IopP35-0nrjRnaTZ5w';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ashreeder/cmfvq86rg001i01re3ecme5bk',
    center: [-96, 40],
    zoom: 4
});

map.on('load', () => {
    map.addSource('my-custom-tiles', {
        type: 'vector',
        url: 'mapbox://styles/ashreeder/cmfvq86rg001i01re3ecme5bk'
    });

    map.addLayer({
        id: 'my-custom-tiles-layer',
        type: 'circle',
        source: 'my-custom-tiles',
        'source-layer': 'ashreeder.4rlngufb',
        paint: {
            'circle-color': '#ff0000',
            'circle-radius': 5, 
        }
    });
});

map.on('mousemove', (e) => {
    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;

    console.log('mousemove:', { lng, lat });

    const coordsEl = document.getElementById('coords');
    if (coordsEl) {
        coordsEl.textContent = `${lat}, ${lng}`;
    }
});


map.on('click', (e) => {
    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;

    console.log('click:', { lng, lat });


});


function flyToDatacenter(currentFeature) {
    map.flyTo({
        center: currentFeature.geometry.coordinates,
        zoom: 12
    });
}

map.on('click', (event) => {
    /* Determine if a feature in the "locations" layer exists at that point. */
    const features = map.queryRenderedFeatures(event.point, {
        source: 'my-custom-tiles',
        'source-layer': 'ashreeder.4rlngufb',

    });

    /* If it does not exist, return */
    if (!features.length) return;

    const clickedPoint = features[0];


    /* Fly to the point */
    flyToDatacenter(clickedPoint);

    /* Close all other popups and display popup for clicked store */

    const coords = clickedPoint.geometry && clickedPoint.geometry.coordinates;
    if (coords && coords.length >= 2) {
        const lng = coords[0];
        const lat = coords[1];
        const centerParam = `${lat},${lng}`;
        const googleKey = 'AIzaSyDaM8_dS5Xpp5tOstKqL2sYx10GwL5G26U';
        const imgUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(centerParam)}&zoom=16&size=240x240&maptype=satellite&key=${googleKey}`;

        new mapboxgl.Popup()
            .setLngLat(coords)
            .setHTML(`<img src="${imgUrl}"/> <p>Coordinates:</p>
                <p>${lat}</p>
                <p>${lng}</p>
                <p>Owner: ${clickedPoint.properties.name}</p>`)
            .addTo(map);

    } else {
        createPopUp && createPopUp(clickedPoint);
    }



});


// Utility: haversine distance in kilometers between two [lng, lat] points
function haversineDistance(a, b) {
    const toRad = (deg) => deg * Math.PI / 180;
    const [lng1, lat1] = a;
    const [lng2, lat2] = b;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lng2 - lng1);
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);

    const sinDLat = Math.sin(dLat/2);
    const sinDLon = Math.sin(dLon/2);
    const aVal = sinDLat*sinDLat + sinDLon*sinDLon * Math.cos(rLat1)*Math.cos(rLat2);
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1-aVal));
    return R * c;
}

// Find the 5 nearest features to the clicked point (by geometry coords)
function findNearestDatacenters(clickedFeature, limit = 5) {
    const allFeatures = map.querySourceFeatures('my-custom-tiles', {
        sourceLayer: 'ashreeder.4rlngufb'
    });

    const origin = clickedFeature.geometry.coordinates;

    const distances = allFeatures.map(f => ({
        feature: f,
        distance: haversineDistance(origin, f.geometry.coordinates)
    }));

    distances.sort((a,b) => a.distance - b.distance);
    return distances.slice(0, limit).map(d => ({ feature: d.feature, distance: d.distance }));
}

// Render the nearby list in the right-side panel
function renderNearbyList(clickedFeature) {
    const panel = document.getElementById('nearby-list');
    if (!panel) return;
    panel.innerHTML = '';

    const nearby = findNearestDatacenters(clickedFeature, 5);

    nearby.forEach((entry, idx) => {
        const f = entry.feature;
        const coords = f.geometry.coordinates;
        const lat = coords[1];
        const lng = coords[0];
        const name = f.properties && (f.properties.name || f.properties.title || `Datacenter ${idx+1}`);

        // Use map static image from Mapbox as thumbnail (public style) — small, no key required
        const thumbUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},10,0/240x160?access_token=${mapboxgl.accessToken}`;

        const item = document.createElement('div');
        item.className = 'nearby-item';
        item.tabIndex = 0;
        item.setAttribute('role', 'button');

        item.innerHTML = `
            <img class="nearby-thumb" src="${thumbUrl}" alt="${name} thumbnail" />
            <div class="nearby-meta">
                <div class="nearby-name">${name}</div>
                <div class="nearby-distance">${entry.distance.toFixed(1)} km</div>
            </div>
        `;

        item.addEventListener('click', () => {
            map.flyTo({ center: coords, zoom: 12 });
        });
        item.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                map.flyTo({ center: coords, zoom: 12 });
            }
        });

        panel.appendChild(item);
    });
}

// When a datacenter point is clicked, also populate nearby list
map.on('click', (event) => {
    const features = map.queryRenderedFeatures(event.point, {
        source: 'my-custom-tiles',
        'source-layer': 'ashreeder.4rlngufb'
    });
    if (!features.length) return;
    const clicked = features[0];
    renderNearbyList(clicked);
});


