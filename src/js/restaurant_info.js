/*
 * 2018-06-15
 *  - Add code for alt attributes on images. Use image_desc if available.
 *    If not, use restaruant name.
 */

import { DBHelper } from '../lib/dbhelper.js';

const restaurantDB = new DBHelper();

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
  const id = getParameterByName('id');

  if (!id) {
    console.log('No restaurant id in URL');
  }
  else {
    restaurantDB.fetchRestaurantById(id).then(restaurant => {
      fillRestaurantHTML(restaurant);

      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoic2RjcnVubmVyIiwiYSI6ImNqaWJyZXp5dTB4bWozbHM2YjZrdW43MjMifQ.EowtKHnQ02BnpcwWvnJNWA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(self.newMap);

      fillBreadcrumb(restaurant);
      DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);

      // Take map attributions out of tab sequence
      removeMapAttributionsFromTabOrder();
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const imageURL = DBHelper.imageUrlForRestaurant(restaurant);

  const imageMd = document.getElementById('restaurant-img-md');
  imageMd.setAttribute('srcset', imageURL.replace('.jpg','-560_md.jpg'));

  const imageLg = document.getElementById('restaurant-img-lg');
  imageLg.setAttribute('srcset', imageURL.replace('.jpg','-800_lg.jpg'));

  const image = document.getElementById('restaurant-img');
  image.src = imageURL.replace('.jpg','-320_sm.jpg');

  // Add an alt attribute for images. Use "image_desc" if available, if not use
  // restaurant name.
  image.alt = restaurant.image_desc ? restaurant.image_desc : restaurant.name;

  const fig = document.querySelector('figure');
  const figCaption = document.createElement('figcaption');
  figCaption.innerHTML =  restaurant.image_desc ? restaurant.image_desc : restaurant.name;
  fig.append(figCaption);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML(restaurant.operating_hours);
  }
  // fill reviews
  fillReviewsHTML(restaurant.reviews);
}

/**
 * Don't include map attributions in the tab sequence
 */
const removeMapAttributionsFromTabOrder = () => {
  const linkList = document.querySelectorAll(".leaflet-control-attribution a");
  linkList.forEach(link => {
    link.setAttribute('tabindex', '-1');
  })
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.className = 'reviewer';
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  date.className = 'review-date'
  li.appendChild(date);

  const rating = document.createElement('p');
  if (Number.isInteger(review.rating) && 0 < review.rating && review.rating < 6) {
    const offscreenRating = document.createElement('p');
    offscreenRating.className = 'rating-offscreen';
    offscreenRating.innerHTML = 'Rating: ' + review.rating + ' stars';
    li.appendChild(offscreenRating);

    rating.setAttribute('rating', review.rating);
  }
  else {
    rating.innerHTML = 'unrated';
    rating.setAttribute('rating', 'invalid');
  }
  li.appendChild(rating);


  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'review-text';
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
