// -------------------------------------
// Create Map (static / non-interactive)
// -------------------------------------
const map = L.map('ukimap', {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    touchZoom: false
}).setView([55, -3], 6);

map.scrollWheelZoom.disable();


// -------------------------
// Load UK + Ireland GeoJSON
// -------------------------
fetch("map/uk_ireland_merged.geojson")
    .then(res => res.json())
    .then(data => {

        const layer = L.geoJSON(data, {
            style: {
                color: "rgba(10, 12, 26, 0.7)",
                weight: 2,
                fill: false,
                lineJoin: "round",
                lineCap: "round"
            }
        }).addTo(map);

        layer.bringToBack();
        map.fitBounds(layer.getBounds());
    });


// -----------------------------
// Marker Data
// Names must be same data-name
// -----------------------------
const markersData = [
    { coords: [52.2053, 0.1218], name: "University of Cambridge", url: "https://ukidiscs2026.github.io/discs2026/" },
    { coords: [51.7617, -0.2468], name: "University of Hertfordshire", url: "https://ukidiscs.github.io/discs2025/" },
    { coords: [52.3793, -1.5603], name: "University of Warwick", url: "https://ukidiscs.github.io/discs2024/" }
];


// -----------------------------
// Store DOM references to list links
// -----------------------------
const linkRefs = {};
document.querySelectorAll(".uni-list a").forEach(link => {
    linkRefs[link.dataset.name] = link;
});


// -----------------------------
// Active marker state
// -----------------------------
let activeMarker = null;
let remainingTime = 5000;
let timerStart = null;
let activeTimeout = null;

function startTimer() {
    timerStart = Date.now();
    activeTimeout = setTimeout(deactivateCurrent, remainingTime);
}

function pauseTimer() {
    if (!activeTimeout) return;

    clearTimeout(activeTimeout);
    activeTimeout = null;

    const elapsed = Date.now() - timerStart;
    remainingTime -= elapsed;
}

function deactivateCurrent() {
    if (!activeMarker) return;

    activeMarker.setStyle({
        fillColor: "#77b0ffff",
        color: "#77b0ffff",
        radius: 4
    });

    activeMarker.closePopup();

    const link = linkRefs[activeMarker.options.name];
    if (link) link.classList.remove("uni-highlight");

    activeMarker = null;
    remainingTime = 5000;
    activeTimeout = null;
}


// -----------------------------
// Create Markers
// -----------------------------
const markerRefs = {};

markersData.forEach(m => {

    const marker = L.circleMarker(m.coords, {
        radius: 4,
        weight: 0,
        color: "#77b0ffff",
        fillColor: "#77b0ffff",
        fillOpacity: 1,
        pane: "markerPane",
        name: m.name
    }).addTo(map)
      .bindPopup(
          `<a href="${m.url}" target="_blank">${m.name}</a>`,
          { offset: L.point(0, -10) }
      );

    markerRefs[m.name] = marker;

    // -----------------------------
    // Activate marker
    // -----------------------------
    function activate() {

        if (activeMarker && activeMarker !== marker) {
            clearTimeout(activeTimeout);
            deactivateCurrent();
        }

        marker.setStyle({
            fillColor: "#186eef",
            color: "#186eef",
            radius: 7
        });

        marker.openPopup();

        const link = linkRefs[m.name];
        if (link) link.classList.add("uni-highlight");

        activeMarker = marker;
        remainingTime = 5000;
        startTimer();
    }

    // Marker hover
    marker.on("mouseover", activate);

    // Pause timer while hovering
    marker.on("mouseover", pauseTimer);

    // Resume timer when leaving
    marker.on("mouseout", () => {
        if (activeMarker === marker && remainingTime > 0) {
            startTimer();
        }
    });

});


// -----------------------------
// List Hover → Marker Activation
// -----------------------------
document.querySelectorAll(".uni-list a").forEach(link => {

    const name = link.dataset.name;
    const marker = markerRefs[name];

    link.addEventListener("mouseenter", () => {
        if (!marker) return;

        if (activeMarker && activeMarker !== marker) {
            clearTimeout(activeTimeout);
            deactivateCurrent();
        }

        marker.setStyle({
            fillColor: "#186eef",
            color: "#186eef",
            radius: 7
        });

        marker.openPopup();
        link.classList.add("uni-highlight");

        activeMarker = marker;
        remainingTime = 5000;
        startTimer();
    });

});