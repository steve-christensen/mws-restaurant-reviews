//import idb from 'idb';

/**
 * Common database helper functions.
 */

/*DATABASE_URL()
const DATABASE_PORT = 1337;
const DATABASE_URL = `http://localhost:${DATABASE_PORT}/restaurants`;

const LOCAL_DB = 'restaurant-reviews';
const LOCAL_VERSION = 1;
*/

export class DBHelper {

  constructor () {
    const DATABASE_PORT = 1337;
    const DATABASE_URL = `http://localhost:${DATABASE_PORT}/restaurants`;

    const LOCAL_DB = 'restaurant-reviews';
    const LOCAL_VERSION = 1;

    this.url = DATABASE_URL;
  }


  /**
   * Fetch all restaurants.
   */
  fetchRestaurants(callback) {
    fetch(this.url)
      .then(response => {
        // TODO: write restaurants to localDb
        callback(null,response.json());
      })
      .catch(error => {
        // TODO: Return error
        callback(error,null)}
      );
  }

  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById(id, callback) {
    let idUrl = `${this.url}/${id}`;
    // fetch all restaurants with proper error handling.
    fetch(idUrl)
      .then (response => callback(null,response.json()))
      .catch(error => callback(error,null));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    this.fetchRestaurants((error, results) => {
      if (error) {
        error.then(e => callback(error, null));
      } else {
        // Filter restaurants to have only given cuisine type
        results.then(restaurants => callback(null,restaurants.filter(r => r.cuisine_type == cuisine)));
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, results) => {
      if (error) {
        error.then(e => callback(error, null));
      } else {
        // Filter restaurants to have only given cuisine type
        results.then(restaurants => callback(null,restaurants.filter(r => r.neighborhood == neighborhood)));
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, results) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null,
          results.then(restaurants =>
            restaurants.filter(r => (cuisine == 'all' || r.cuisine_type == cuisine) &&
                              (neighborhood == 'all' || r.neighborhood == neighborhood))));
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  fetchNeighborhoods(callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, results) => {
      if (error) {
        error.then(e => callback(error, null));
      } else {
        results.then(restaurants => {
          // Get all neighborhoods from all restaurants
          const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
          // Remove duplicates from neighborhoods
          const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
          callback(null, uniqueNeighborhoods);
        });
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  fetchCuisines(callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, results) => {
      if (error) {
        error.then(e => callback(error, null));
      } else {
        results.then(restaurants => {
          // Get all cuisines from all restaurants
          const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
          // Remove duplicates from cuisines
          const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
          callback(null, uniqueCuisines);
        });
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  imageUrlForRestaurant(restaurant) {
    return (`./img/${restaurant.photograph ? restaurant.photograph : restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: this.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}
