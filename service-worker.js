/**
 * Use Network or Cachce Recipe from ServiceWorker Cookbook
 */

// Update the cache name to force replacement.
const CACHE = 'restaurant-reviews-v2';

self.addEventListener('install', function(event) {
  console.log('The service worker is being installed.');

  event.waitUntil(precache());
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
});

// Pre-cache the local files.
function precache() {
  return caches.open(CACHE).then(function (cache) {
    return cache.addAll([
      './',
      './restaurant.html',
      './css/styles.css',
      './data/restaurants.json',
      './js/dbhelper.js',
      './js/main.js',
      './js/restaurant_info.js'
    ]);
  });
}

// Fetch from the network if cache was not available.
function fetchFromNetwork(request) {
  console.log('Fetching asset from network:', request.url);
  return fetch(request).then(function(response) {
    const r = response.clone();
    console.log('Caching response:', request.url);
    caches.open(CACHE).then(function(cache) {
      console.log('Opened cache:', CACHE);
      cache.put(request, r);
    });
    return response;
  });
}
