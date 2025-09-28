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
        const googleKey = '${{ secrets.GOOGLE_API_KEY }}';
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

const button = document.querySelector("#btn");
const output = document.querySelector("#output");

// Attach an event listener 
button.addEventListener("click", function() { 
	//run this code whenever the button with id 'btn' is clicked
  output.innerHTML = "Hello! You clicked the button.";
});
