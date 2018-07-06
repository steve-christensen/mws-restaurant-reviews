/**
 * This script will check to see if service workers are available and if so, load the serviceworker.
 */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js', {scope: location.path}).then(function(registration) {

    var serviceWorker;
    if (registration.installing) {
      serviceWorker = registration.installing;
    } else if (registration.waiting) {
      serviceWorker = registration.waiting;
    } else if (registration.active) {
      serviceWorker = registration.active;
    }

    if (serviceWorker) {
      console.log('ServiceWorker state: ' + serviceWorker.state);
      serviceWorker.addEventListener('statechange', function(e) {
        console.log('ServiceWorker state: ' + serviceWorker.state);
      });
    }
  }).catch(function(error) {
    // Something went wrong during registration. The service-worker.js file
    // might be unavailable or contain a syntax error.
    console.log('ServiceWorker registration failed: ' + error);
  });
} else {
  // The current browser doesn't support service workers.
  console.log('ServiceWorkers are not available in this browser');
}
