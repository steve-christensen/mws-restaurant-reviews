
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

    this.url = DATABASE_URL;

    this.restaurants =  fetch(this.url).then(response => response.json());

    this.neighborhoods = this.restaurants.then(data => {
      let a = [];
      data.forEach(r => {
        if (!a.includes(r.neighborhood)) a.push(r.neighborhood);
      });
      return a;
    });

    this.cuisines = this.restaurants.then(data => {
      let a = [];
      data.forEach(r => {
        if (!a.includes(r.cuisine_type)) a.push(r.cuisine_type);
      });
      return a;
    });
  }


  /**
   * Fetch all restaurants.
   */
   fetchRestaurants() {
     return this.restaurants;
   }

  /**
   * Fetch a restaurant by its ID.
   */
   fetchRestaurantById(id) {
     return this.restaurants.then(restaurants =>
       restaurants.filter(r => r.id == id)[0])
   }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
   fetchRestaurantsByCuisine(cuisine) {
     return this.restaurants.then(restaurants =>
       restaurants.filter(r => r.cuisine_type == cuisine));
   }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
   fetchNeighborhoods() {
     return this.neighborhoods;
   }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
   fetchRestaurantsByCuisineAndNeighborhood(cuisine, neighborhood) {
     return this.restaurants.then(restaurants =>
       restaurants.filter(r =>
         (cuisine == 'all' || r.cuisine_type == cuisine) &&
         (neighborhood == 'all' || r.neighborhood == neighborhood)));
   }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
   fetchNeighborhoods() {
     return this.neighborhoods;
   }

  /**
   * Fetch all cuisines with proper error handling.
   */
   fetchCuisines() {
     return this.cuisines;
   }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`./img/${restaurant.photograph ? restaurant.photograph : restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: this.urlForRestaurant(restaurant)
      })
      marker.addTo(map);
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
