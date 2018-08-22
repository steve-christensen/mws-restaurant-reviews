/*
 * 2018-06-15
 *  - Add code for alt attributes on images. Use image_desc if available.
 *    If not, use restaruant name.
 */

import { DBHelper } from '../lib/dbhelper.js';

let newMap;
let markers = [];

const restaurantDB = new DBHelper();

const mapAvailable = L;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added
//  fetchNeighborhoods();
//  fetchCuisines();
// Just call the DBHelper methods directly as wrapping them in a function
// in this instance does not add value
  restaurantDB.fetchNeighborhoods().then(neighborhoods => fillNeighborhoodsHTML(neighborhoods));
  restaurantDB.fetchCuisines().then(cuisines => fillCuisinesHTML(cuisines));
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
/* Wrapping the DBHelper calls in a function does not add value
const fetchNeighborhoods = () => {
  restaurantDB.fetchNeighborhoods().then(neighborhoods => fillNeighborhoodsHTML(neighborhoods));
}
*/

/**
 * Set neighborhoods HTML.
 */
//const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
const fillNeighborhoodsHTML = (neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach((neighborhood, idx) => {
    const option = document.createElement('option');
    option.id = "neighborhood-" + idx;
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
 /* Wrapping the DBHelper call in a function does not add value
const fetchCuisines = () => {
  restaurantDB.fetchCuisines().then(cuisines => fillCuisinesHTML(cuisines));
}
*/

/**
 * Set cuisines HTML.
 */
//const fillCuisinesHTML = (cuisines = self.cuisines) => {
const fillCuisinesHTML = (cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach((cuisine, idx) => {
    const option = document.createElement('option');
    option.id = "cuisine-" + idx;
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1Ijoic2RjcnVubmVyIiwiYSI6ImNqaWJyZXp5dTB4bWozbHM2YjZrdW43MjMifQ.EowtKHnQ02BnpcwWvnJNWA',
    maxZoom: 18,
    attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(self.newMap);

  newMap = self.newMap;

  updateRestaurants();
/*  else {
    document.getElementById()
  }
*/
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
//const updateRestaurants = () => {
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  restaurantDB.fetchRestaurantsByCuisineAndNeighborhood(cuisine, neighborhood)
    .then(restaurants => {
      resetRestaurants(restaurants);
      fillRestaurantsHTML(restaurants);
    });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(m => m.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
//const fillRestaurantsHTML = (restaurants = self.restaurants) => {
const fillRestaurantsHTML = () => {
  const ul = document.getElementById('restaurants-list');
  self.restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();

  // Don't include mapp attributions in the tab sequence
  removeMapAttributionsFromTabOrder();
}

/**
 * Don't include map attributions in the tab order
 */
const removeMapAttributionsFromTabOrder = () => {
  const linkList = document.querySelectorAll(".leaflet-control-attribution a");
  linkList.forEach(link => {
    link.setAttribute('tabindex', '-1');
  })
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant).replace(".jpg","-320_sm.jpg");

  // Add an alt attribute for images. Use "image_desc" if available, if not use
  // restaurant name.
  image.alt = restaurant.image_desc || restaurant.name;

  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  // Put the link text in a paragraph tag for vertiacl
  const more = document.createElement('a');
  more.setAttribute('aria-label', restaurant.name + ' Details');
  const moreP = document.createElement('p');
  moreP.innerHTML = 'View Details';
  more.append(moreP);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
//const addMarkersToMap = (restaurants = self.restaurants) => {
const addMarkersToMap = () => {
  self.restaurants.forEach(restaurant => {
    // Add marker to the map
    let marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
}
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

// Expose updateRestaurants for use in window events
window.updateRestaurants = updateRestaurants;

export { updateRestaurants };
