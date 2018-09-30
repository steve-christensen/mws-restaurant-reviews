/**
* Common database helper functions.
**/

/**
*  TODO: Update as follows:
*    1. read reviews
*    X. Set/unset favorites
*    3. Add reviews
***/

/*DATABASE_URL()
const DATABASE_PORT = 1337;
const DATABASE_URL = `http://localhost:${DATABASE_PORT}/restaurants`;

const LOCAL_DB = 'restaurant-reviews';
const LOCAL_VERSION = 1;
*/

const DATABASE_PORT = 1337;
const DATABASE_URL = `http://localhost:${DATABASE_PORT}`;

const RESTAURANTS_URL = `${DATABASE_URL}/restaurants`
const REVIEWS_URL = `${DATABASE_URL}/reviews`;

class DBHelper {

  constructor () {

    this.restaurants =  fetch(RESTAURANTS_URL)
      .then(response => response.json())
      .then(data => {
        data.forEach(r => r.tag = this.makeTag(r.name));
        return data;
      });

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
    });  }

  /**
  * Fetch all restaurants.
  **/
  fetchRestaurants() {
    return this.restaurants;
  }

  /**
  * Fetch favorite restaurants
  **/
  fetchFavoriteRestaurants() {
    return this.restaurants.then(restaurants =>
      restaurants.filter(r => r.is_favorite));
  }

  /**
  * Fetch a restaurant by its ID.
  **/
   fetchRestaurantById(id) {
     return this.restaurants.then(restaurants =>
       restaurants.filter(r => r.id == id)[0]);
   }

  /**
  * Fetch a restaurant by its tag.
  **/
  fetchRestaurantByTag(tag) {
    return this.restaurants.then(restaurants =>
      restaurants.filter(r => r.tag == tag)[0]);
  }

  /**
  * Fetch restaurants by a cuisine type with proper error handling.
  **/
  fetchRestaurantsByCuisine(cuisine) {
    return this.restaurants.then(restaurants =>
      restaurants.filter(r => r.cuisine_type == cuisine));
  }

  /**
  * Fetch restaurants by a neighborhood with proper error handling.
  **/
  fetchNeighborhoods() {
    return this.neighborhoods;
  }

  /**
  * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
  **/
  fetchRestaurantsByCuisineAndNeighborhood(cuisine, neighborhood) {
    return this.restaurants.then(restaurants =>
      restaurants.filter(r =>
        (cuisine == 'all' || r.cuisine_type == cuisine) &&
        (neighborhood == 'all' || r.neighborhood == neighborhood)));
  }

  /**
  * Fetch all neighborhoods with proper error handling.
  **/
  fetchNeighborhoods() {
    return this.neighborhoods;
  }

  /**
  * Fetch all cuisines with proper error handling.
  **/
  fetchCuisines() {
    return this.cuisines;
  }

  fetchReviews(id) {
    const url = `${REVIEWS_URL}/?restaurant_id=${id}`;

    return fetch(url).then(response => response.json());
  }

  /**
  * Convert restaurant name to tag for use in URLs by converting spaces to
  * underscores, removing non-alphanumeric characters, and converting to
  * lower case.
  ***/
  makeTag(name) {
    return name.replace(/ /g,'_').replace(/[^_A-Za-z0-9]/g,'').toLowerCase();
  }

  /**
  * Restaurant page URL.
  **/
  static urlForRestaurant(restaurant) {
    return (`./restaurant/${restaurant.tag}`);
  }

  /**
  * Restaurant image URL.
  **/
  static imageUrlForRestaurant(restaurant) {
    return (`./img/${restaurant.photograph ? restaurant.photograph : restaurant.id}.jpg`);
  }

  /**
  * Map marker for a restaurant.
  **/
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

  /**
  * Set is_favorite for restaurant
  * Parameters:
  *   id - restaurant id
  *   value - true/false
  **/
  setFavorite(id, value) {
    const url = `${RESTAURANTS_URL}/${id}/?is_favorite=${value}`;

    console.log(`Updating favorite: ${url}`);
    fetch(url, { method: 'PUT' })
      .then(response => {
        console.log(`PUT response status: ${response.status}`);
        if (response.status == 200) {

          // Request was successful. Update is_favorite in local copy of restaurant
          this.restaurants.then(data => {
            data.filter(restaurant => restaurant.id == id)[0].is_favorite = value;
          })

          return response.json()
        }
        else {
          throw response.text();
        }
      })
      .catch(err => {
        console.log(`Failed to set is_favorite='${value}' for restaurant.id=${id}: ${err}`);
        return null;
      });
  }

  /**
  * Add a review
  **/
  addReview(review) {
    const url = `${REVIEWS_URL}/`;

    fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(review)
    })
    .then(response => response.json());
  }

}

export { DBHelper as default };
