// Map Control module for restaurant review application
//
class MapControl {
  // Constructor takes default latitude, longitude, and zoom levels
  // The constructor method will initialize the map in a div element with
  // 'id' = map.
  // Add router to inputs to allow using router for internal navigation
  // when markers are clicked.
  constructor(lat, long, zoom, router) {
    // Use lat and long to consturct a LatLng object as default center of map
    this.defaultCenter = L.latLng([lat, long]);
    this.defaultZoom = zoom;

    // Use router for navigation to internal paths
    this.router = router;

    // Initialize the map
    this.map = L.map('map', {
          center: this.defaultCenter,
          zoom: this.defaultZoom,
          scrollWheelZoom: false
        });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
      mapboxToken: 'pk.eyJ1Ijoic2RjcnVubmVyIiwiYSI6ImNqaWJyZXp5dTB4bWozbHM2YjZrdW43MjMifQ.EowtKHnQ02BnpcwWvnJNWA',
      maxZoom: 18,
      attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(this.map);

    // Do not include attribution links in the tab order
    this.removeMapAttributionsFromTabOrder();

    // Create a layer group for holding the markers. Since the layer group is
    // added to the map, markers will be refreshed auotmatically as they are
    // added and removed from the group.
    this.markerGroup = L.layerGroup([]);
    this.markerGroup.addTo(this.map);
  }

  // Do as the method name suggests
  removeMapAttributionsFromTabOrder() {
    const linkList = document.querySelectorAll(".leaflet-control-attribution a");
    linkList.forEach(link => {
      link.setAttribute('tabindex', '-1');
    })
  }

  // Add a marker to the marker group
  addMarker(name, latlng, url) {
    const marker = new L.marker([latlng.lat, latlng.lng],
      {
        title: name,
        alt: name,
        'url': url
      });
    marker.on('click', () => { this.router.goTo(new URL(url, location.origin)); });
    this.markerGroup.addLayer(marker);
  }

  // Remove markers from the marker group
  clearMarkers() {
    this.markerGroup.clearLayers();
  }

  // Reset the view to center on current markers. If no markers are specified,
  // reset to default center and zoom levels.
  // TODO: If time allows calculate optimal zoom. For now, use default zoom for
  // multiple markers or 16 for a single marker.
  resetView() {
    this.map.invalidateSize();
    if (0 == this.markerGroup.getLayers().length) {
      this.map.setView(this.defaultCenter, this.defaultZoom);
    }
    else {
      const center = this.calcCenter();
      const zoom = 1 === this.markerGroup.getLayers().length ? 16 : this.defaultZoom;
      this.map.setView(center, zoom);
    }
  }

  // Calculate center of markers in marker group and return as LatLng object
  calcCenter() {
    const markers = this.markerGroup.getLayers();
    let points = [];

    markers.forEach(m => points.push(m.getLatLng()));

    return L.latLngBounds(points).getCenter();
  }
}

export { MapControl as default };
