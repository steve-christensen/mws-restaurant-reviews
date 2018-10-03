'use strict';

/**
* TODO:
*
* 1. Separate IndexedDB stores for restaurants and reviews
* 2. PUT/POST process:
*   a. Online state:
*     i. Write change to IndexedDB
*     ii. Attempt PUT/POST
*     iii. Success: done
*     iv. Fail:
*       1. Save request to pending store
*       2. Change state to offline state
*   b. Offline state:
*     i. Periodically retry pending requests
*       1. Fail: continue to retry
*       2. Success:
*         a. Process all pending requests
*         b. Remove requests from pending as they are processed
*         c. Change state to online after all requests processed.
*     ii. New requests
*       1. Update store
*       2. Add/update pending store
*
**/

import idb from 'idb';

const IDB_NAME = 'restaurant-reviews';
const IDB_VERSION = 1;
const restaurantStore = 'restaurants';
const reviewStore = 'reviews';
const reviewsByRestaurantIdx = 'restaurantIdIndex';
const pendingFavoriteStore = 'pendingFavorites';

const dbPromise = idb.open(IDB_NAME, IDB_VERSION, upgradeDB => {
  upgradeDB.createObjectStore(restaurantStore, { keyPath: 'id' });
  let rStore = upgradeDB.createObjectStore(reviewStore, { keyPath: 'id' });
  rStore.createIndex(reviewsByRestaurantIdx, 'restaurant_id', { unique: false });
  upgradeDB.createObjectStore(pendingFavoriteStore, { keyPath: 'id' });
});

/**
 * Use Network or Cachce Recipe from ServiceWorker Cookbook
 */

// Update the cache name to force replacement.
const CACHE = 'restaurant-reviews-v1';

const DATABASE_PORT = 1337;
const DATABASE_URL = `http://localhost:${DATABASE_PORT}`;

const RESTAURANTS_URL = `${DATABASE_URL}/restaurants`
const REVIEWS_URL = `${DATABASE_URL}/reviews`;


let online = true;

/**
* Local key generator
**/
class PendingKey {
  constructor() {
    this.n = 0;
  }

  next() {
    this.n += 1;
    return `pending.${this.n}`;
  }
}
let pendingKey = new PendingKey();

self.addEventListener('install', function(event) {
  console.log('The service worker is being installed.');

  event.waitUntil(precache());
  event.waitUntil(fetchRestaurantsFromAPI(new Request(RESTAURANTS_URL)));
});

self.addEventListener('activate', function(event) {
  console.log('The service worker is being activated.');

  // Purge old cache versions upon activation
  // Only purge if it is a 'restaurant-reviews' cache.
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName != CACHE && cacheName.startsWith('restaurant-reviews')) {
            console.log('Deleting out of date cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercept fetch events and serve from cache if available.
self.addEventListener('fetch', function(event) {
  const requestURL = new URL(event.request.url);

/*  if (requestURL.host === location.host && requestURL.pathname != '/' && requestURL.pathname.indexOf('.') == -1) {
    event.respondWith(caches.match('/'));
  }
  else
*/
  if (requestURL.host === new URL(DATABASE_URL).host) {
    event.respondWith(fetchData(event.request));
  } else {
//    console.log('The service worker is serving the asset: ' + event.request.url);

    event.respondWith(caches.match(event.request, {ignoreSearch: true}).then(function(response) {
//      console.log("Serving response from cache:",event.request.url)
      if (response && response != undefined && response.body) {
        return response;
      }
      else {
        return fetchFromNetwork(event.request);
      }
    }).catch(function() {
      return fetchFromNetwork(event.request);
    }));
  }
});

// Pre-cache the local files.
function precache() {
  console.log('Service worker precache.');
  return caches.open(CACHE).then(function (cache) {
    return cache.addAll([
      './',
      './css/styles.min.css',
      './app/page404.html',
      './app/no-restaurant.html',
      './app/app.js',
      './app/router.js',
      './app/dbhelper.js',
      './app/map-control.js',
      './app/base-view.js',
      './app/list-view.js',
      './app/detail-view.js',
      './app/breadcrumb.js',
      './app/add-review-view.js',
      './app/error-view.js'
    ]);
  });
}

// Fetch from the network if cache was not available.
function fetchFromNetwork(request) {
//  console.log('Fetching asset from network:', request.url);
  return fetch(request).then(function(response) {
    const r = response.clone();
    if (request.method == "GET") {
//      console.log('Caching response:', request.url);
      caches.open(CACHE).then(function(cache) {
//        console.log('Opened cache:', CACHE);
        cache.put(request, r);
      });
    }
    return response;
  });
}

/**
* Fetch restaurant or review data from appropriate source
**/
function fetchData(request) {
  console.log(`SW - fetching data: ${request.url}`);

  const requestURL = new URL(request.url);

  // Restaurant request
  if (-1 < requestURL.pathname.indexOf('restaurants')) {
    switch (request.method.toUpperCase()) {
      // Handle request for one or many restaurants
      case 'GET':
        let a = requestURL.pathname.split('/');

        if (a.length == 2 && 'restaurants' === a[1]) {
          return fetchAllRestaurants(request);
        }
        else {
          return fetchRestaurant(request);
        }
        break;

      // Handle requet to update is_favorite
      case 'PUT':
        return putFavorite(request);
        break;

      // no other methods supported at this time
      // build an error response
      default:
        const message = `Method, ${request.method}, is not supported for restaurants.`;
        console.log(message);
        return new Response(message, { status: 405, statusText: 'Method Not Allowed' });
    }
  }
  // Review request
  else {
    switch (request.method.toUpperCase()) {
      // Handle request for reviews for one restaurant
      case 'GET':
        return fetchReviews(request);
        break;

      // Handle requet to add a review
      case 'POST':
        return postReview(request);
        break;

      // no other methods supported at this time
      // build an error response
      default:
        const message = `Method, ${request.method}, is not supported for reviews.`;
        console.log(message);
        return new Response(message, { status: 405, statusText: 'Method Not Allowed' });
    }
  }
}

/**
* Fetch all restaurants populating IndexedDB if it is not already populated
**/
function fetchAllRestaurants(request) {
  console.log('SW - fetchAllRestaurants');
  // Return restaurants from indexedDB
  return dbPromise.then(db => {
    return db.transaction(restaurantStore)
      .objectStore(restaurantStore).getAll().then(restaurants => {
        if (restaurants && 0 < restaurants.length) {
          return new Response(JSON.stringify(restaurants), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) });
        }
        else {
          return fetchRestaurantsFromAPI(request);
        }
      })
      // return empty array
      .catch(() => new Response(JSON.stringify([]), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) }));
  });
};


/**
* Fetch all restaurants from API and cache to indexedDB
**/
function fetchRestaurantsFromAPI(request) {
  console.log('SW - fetchRestaurantsFromAPI');
  return fetch(request)
    .then(response => response.json())
    .then(restaurants => {
      restaurants.forEach(restaurant => {
        dbPromise.then(db => {
          const tx = db.transaction(restaurantStore, 'readwrite');
          tx.objectStore(restaurantStore).put(restaurant);
        });
      });
      return new Response(JSON.stringify(restaurants), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) });
    })
  .catch(err => {
    console.log(`Failed to retrieve restaurant data from API:\n${err.message}`);
    return new Response(JSON.stringify([]), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) });
  });
}

/**
* Fetch one restaurant, but populate IndexedDB with all restaurants if
* restaurant is not in indexedDB.
**/
function fetchRestaurant(request) {
  const requestURL = new URL(request.url);
  const id = requestURL.pathname.split('/')[2];
  console.log('SW - Fetching restaurant from IndexedDB by id: ', id);
  return dbPromise.then( db => {
    return db.transaction(restaurantStore)
      .objectStore(restaurantStore).get(id)
        .then(restaurant => {
          if (restaurant && restaurant.id) {
            return new Response(JSON.stringify(restaurant), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) });
          }
          else {
            return fetchRestaurantsFromAPI(request)
              .then(restaurants => new Response(JSON.stringify(restaurants.filter(restaurant => restaurant.id == id)[0]), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) }));
          }
        });
  });
}

/**
* Send put request to update is_favorite for a restaurant
**/
function putFavorite(request) {
  const requestURL = new URL(request.url);
  const restaurantId = Number(requestURL.pathname.split('/')[2]);
  const isFavorite = requestURL.search == '?is_favorite=true';

  // First, update IndexedDB
  dbPromise.then(async (db,id=restaurantId,favorite=isFavorite) => {
    const tx = db.transaction(restaurantStore, 'readwrite');
    const store = tx.objectStore(restaurantStore);
    let restaurant = await store.get(id);
    restaurant.is_favorite = favorite;
    store.put(restaurant);
    return tx.complete;
  });

  return fetch(request)
    .catch((err, id=restaurantId, favorite=isFavorite) => {
      const pendingRequest = {
        id: restaurantId,
        is_favorite: favorite
      };
      dbPromise.then((db, pending=pendingRequest) => {
        const tx = db.transaction(pendingFavoriteStore, 'readwrite')
          .objectStore(pendingFavoriteStore).put(pending);
      });
      return new Response(JSON.stringify(pendingRequest),
          {
            status: 201,
            statusText: 'UpdatePending',
            headers: new Headers({ 'Content-Type': 'application/json' })
          });
    });
}

/**
* Fetch reviews. We should always receive a restaurant ID to fetch
* all reviews for that restaurant.
**/
function fetchReviews(request) {
  const requestURL = new URL(request.url);
  const idExp = /^\?restaurant_id=(.*)$/;
  const restaurantId = Number(idExp.exec(requestURL.search)[1]);
  console.log('SW - fetchReviews: ' + restaurantId);
  if (restaurantId != NaN && 0 < restaurantId) {
    // Return from indexedDB if possible
    return dbPromise.then(db => {
      return db.transaction(reviewStore)
        .objectStore(reviewStore).index(reviewsByRestaurantIdx).getAll(restaurantId).then(reviews => {
          if (reviews && 0 < reviews.length) {
            return new Response(JSON.stringify(reviews), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) });
          }
          else {
            return fetchReviewsFromAPI(request);
          }
        })
        // Fetch restaurants from API
        .catch(() =>  new Response(JSON.stringify([]), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) }));
    });
  }
  else {
    return new Response(JSON.stringify([]), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) });
  }
}

/**
* Fetch all reviews from API and cache to indexedDB
**/
function fetchReviewsFromAPI(request) {
  return fetch(request)
    .then(response => response.json())
    .then(reviews => {
      reviews.forEach(review => {
        dbPromise.then(db => {
          const tx = db.transaction(reviewStore, 'readwrite');
          tx.objectStore(reviewStore).put(review);
        });
      });
      return new Response(JSON.stringify(reviews), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) });
    })
  .catch(err => {
    console.log(`Failed to retrieve restaurant data from API:\n${err.message}`);
    return new Response(JSON.stringify([]), { status: 200, statusText: 'OK', headers: new Headers({ 'Content-Type' : 'application/json' }) });
  });
}


/**
* Post a new review
**/
function postReview(request) {
  const request2 = request.clone();
  return fetch(request).then((response, req=request) => {
    if (response.status == 201) {
      const r = response.clone();
      r.json().then(review => {
        dbPromise.then((db) => {
          const tx = db.transaction(reviewStore, 'readwrite');
          tx.objectStore(reviewStore).put(review);
        });
      });
    }
    return response;
  })
  .catch((err, req=request2) => {
    // Put the review in the store with a temporary ID that we can find and process later.
    req.json().then(review => {
      review.id = pendingKey.next();
      dbPromise.then((db, r=review) => {
        const tx = db.transaction(reviewStore, 'readwrite');
        tx.objectStore(reviewStore).put(review);
      });

      return new Response (JSON.stringify(review),
        {
          status: 201,
          statusText: 'UpdatePending',
          headers: new Headers({ 'Content-Type': 'application/json' })
        });
    })

    });
}

setInterval(processPending, 30000);

function processPending() {
  // Try processing the pending favorites
  dbPromise.then( async db => {
    const tx = db.transaction(pendingFavoriteStore);
    const store = tx.objectStore(pendingFavoriteStore);
    const requests = await store.getAll();
    requests.forEach( async (req) => {
      const url = `${RESTAURANTS_URL}/${req.id}/?is_favorite=${req.is_favorite}`;
      let request = new Request(url, { method: 'PUT' });
      const response = await fetch(request);
      const restaurant = await response.json().
      then(restaurant => {
        dbPromise.then(db => {
          const tx = db.transaction(pendingFavoriteStore, 'readwrite');
          const store = tx.objectStore(pendingFavoriteStore);
          store.delete(restaurant.id);
          return tx.complete;
        })
      });
    });
  });

  // Process pending reviews
  dbPromise.then(async db => {
    const tx = db.transaction(reviewStore);
    const store = tx.objectStore(reviewStore);
    const keys = await store.getAllKeys();
    keys.filter(key => typeof key == 'string' && key.split('.')[0] == 'pending').forEach(async key => {
      dbPromise.then(async db => {
        const tx = db.transaction(reviewStore, 'readwrite');
        const store = tx.objectStore(reviewStore);
        let review = await store.get(key);
        if (review.id) {
          const id = review.id;
          delete(review.id);
          const url = REVIEWS_URL + '/';
          fetch(url, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(review)
          })
          .then(response => response.json())
          .then(review => {
            dbPromise.then(async db => {
              const tx = db.transaction(reviewStore, 'readwrite');
              const store = tx.objectStore(reviewStore);
              store.delete(id);
              store.put(review);
              return tx.complete;
            });
          })
          .catch(() => null);
        }
        return tx.complete;
      });
    });
  });
}


/* old code beyond this point

// Fetch all restaurants using variable, IndexedDB, or API.
const fetchAllRestaurants = () => {

  if (0 < restaurants.length) {
    return restaurants;
  }
  else {
    // First, check IndexedDB
    return dbPromise.then(db => {
      return db.transaction(restaurantStore)
        .objectStore(restaurantStore).getAll().then(r => {
          if (r && 0 < r.length) {
            restaurants = r;
            return restaurants;
          }
          else {
            return fetchDataFromAPI();
          }
        })
        // Fetch restaurants from API
        .catch(() => fetchDataFromAPI());
    });
  }
};

const fetchDataFromAPI = () => {
    return fetch(DATABASE_URL).then(response => {
      if (!response) {
        return {
          status: 500,
          error: 'Null response returned from restaurant API'
        };
      }
      else if (response.status !== 200) {
        return response.text().then(text => {
          return {
            status: response.status,
            error: text
          };
        });
      }
      else {
        return response.json().then(data => {
          restaurants = data;
          restaurants.forEach(restaurant => {
            dbPromise.then(db => {
              const tx = db.transaction(restaurantStore, 'readwrite');
              tx.objectStore(restaurantStore).put(restaurant);
            });
          });
          return restaurants;
        });
      }
    })
    .catch(err => {
      return {
        status: 500,
        error: `Failed to retrieve restaurant data from API:\n${err.message}`
      };
    });
  };

const fetchData = (request) => {
  console.log('Fetching data: ', request.url);

  let requestURL = new URL(request.url);

  if (requestURL.pathname == '/restaurants') {
    console.log('Fetching all restaurants');
    if (0 < restaurants.length) {
      console.log('ServiceWorker fetching restaurants from variable.');
      return new Response(JSON.stringify(restaurants), { status: 200, statusText: 'OK' });
    }
    else {
      return new Response(JSON.stringify(fetchAllData()), { status: 200, statusText: 'OK' });
    }
  }
  else {
    let id = requestURL.pathname.split[2];
    console.log('ServiceWorker Fetching restaurant from IndexedDB by id: ', id);
    return dbPromise.then( db => {
      return db.transaction(restaurantStore)
        .objectStore(restaurantStore).get(id);
    });
  }
};

*/
