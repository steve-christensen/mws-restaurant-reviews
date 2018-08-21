'use strict';

import idb from 'idb';

const IDB_NAME = 'restaurant-reviews';
const IDB_VERSION = 1;
const restaurantStore = 'restaurants';

const dbPromise = idb.open(IDB_NAME, IDB_VERSION, upgradeDB => {
  upgradeDB.createObjectStore(restaurantStore, { keyPath: 'id' });
});

/**
 * Use Network or Cachce Recipe from ServiceWorker Cookbook
 */

// Update the cache name to force replacement.
const CACHE = 'restaurant-reviews-v3';

const DATABASE_PORT = 1337;
const DATABASE_URL = new URL(`http://localhost:${DATABASE_PORT}/restaurants`);

let restaurants = [];

self.addEventListener('install', function(event) {
  console.log('The service worker is being installed.');

  event.waitUntil(precache());
  event.waitUntil(fetchAllData());
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
  let requestURL = new URL(event.request.url);

  if (requestURL.host === DATABASE_URL.host) {
    event.respondWith(fetchData(event.request));
  } else if (!event.request.url.includes('browser-sync')) {
    console.log('The service worker is serving the asset: ' + event.request.url);

    event.respondWith(caches.match(event.request, {ignoreSearch: true}).then(function(response) {
      console.log("Serving response from cache:",event.request.url)
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
  else {
    return fetch(event.request);
  }
});

// Pre-cache the local files.
function precache() {
  console.log('Service worker precache.');
  return caches.open(CACHE).then(function (cache) {
    return cache.addAll([
      './',
      './restaurant.html',
      './css/styles.min.css',
      './index.min.js',
      './js/main.min.js',
      './js/restaurant_info.min.js'
    ]);
  });
}

// Fetch from the network if cache was not available.
function fetchFromNetwork(request) {
  console.log('Fetching asset from network:', request.url);
  return fetch(request).then(function(response) {
    const r = response.clone();
    if (request.method == "GET") {
      console.log('Caching response:', request.url);
      caches.open(CACHE).then(function(cache) {
        console.log('Opened cache:', CACHE);
        cache.put(request, r);
      });
    }
    return response;
  });
}

// Fetch all restaurants using variable, IndexedDB, or API.
const fetchAllData = () => {

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
