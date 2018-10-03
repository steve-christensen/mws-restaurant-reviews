/*
 * The list view class will render the restaurant details on the detail page.
 */

import BaseView from './base-view.js';
import DBHelper from './dbhelper.js';

class DetailView extends BaseView {
  constructor (map, db, bc) {
    super(map);     // Sets this.parent, this.content, and this.map

    this.db = db;

    // Breadcrumb control
    this.bc = bc;

    this.errorFile = '/app/no-restaurant.html';

/*    this.bcNav = this.buildBreadCrumbs();
    this.bcRestaurant = this.bcNav.querySelector('li:last-child')
*/

    this.favoriteButton = document.createElement('button');
    this.favoriteButton.name = 'is_favorite';
    this.favoriteButton.setAttribute('value','false');
    this.favoriteButton.innerHTML = '❤';
    this.favoriteButton.addEventListener('click', this.toggleFavorite);

    window.favoriteButton = this.favoriteButton;
  }

  /**
  * This is the method that will be called by the router to render the view.
  **/
  renderView() {
    super.renderView();

    this.parent.className = 'detail';

    const tag = this.getTagFromLocation();

    this.db.fetchRestaurantByTag(tag).then(restaurant => {
      if (restaurant) {
        this.bc.reset();
        this.bc.addCrumb(restaurant.name, '');
        this.bc.render();

        // Add map marker
        this.map.addMarker(restaurant.name, restaurant.latlng, DBHelper.urlForRestaurant(restaurant));
        this.map.resetView();

        this.appendRestaurantDetails(restaurant);

        this.appendReviews(restaurant.id, restaurant.tag);
      }
      else {
        this.renderError();
      }
    });
  }

  /**
  * Render an error page when the restaurant cannot be found.
  **/
  renderError() {
    this.parent.className = 'error';

    fetch(this.errorFile)
      .then(response => response.text())
      .then(text => {
        this.content.innerHTML = text;
      });
  }

  /**
  * Append restaurant details to content section
  **/
  appendRestaurantDetails(restaurant) {
    this.content.insertAdjacentHTML('beforeend',`<h2>${restaurant.name}</h2>`);

    this.content.append(this.getFigure(restaurant));

    this.content.append(this.getCuisineAndFavoriteDiv(restaurant));

    this.content.insertAdjacentHTML('beforeend', `<address>${restaurant.address}</address>`);

    this.content.append(this.getHoursTable(restaurant.operating_hours));
  }

  /**
  * Get reviews from db and display them
  **/
  appendReviews(restaurantId, restaurantTag) {
    const reviewContainer = document.createElement('div');
    reviewContainer.className='reviews-container';
    reviewContainer.insertAdjacentHTML('beforeend','<h3>Reviews</h3>');
    reviewContainer.insertAdjacentHTML('beforeend',`<a class="review-button" href="#/restaurant/${restaurantTag}/add_review">Add Review</a>`);

    const reviewList = document.createElement('ul');
    reviewContainer.append(reviewList);

    this.content.append(reviewContainer);

    db.fetchReviews(restaurantId).then(reviews => {
      reviews.forEach(review => {
        const li = document.createElement('li');
        const name = document.createElement('p');
        name.innerHTML = review.name;
        name.className = 'reviewer';
        li.appendChild(name);

        let rating = 0;
        if (typeof review.rating == 'string' && Number(review.rating)) {
          rating = Number(review.rating);
        }
        else if (typeof review.rating == 'number' && Number.isInteger(review.rating)){
          rating = review.rating;
        }

        const ratingP = document.createElement('p');
        if (Number.isInteger(rating) && 0 < rating && rating < 6) {
          const offscreenRating = document.createElement('p');
          offscreenRating.className = 'rating-offscreen';
          offscreenRating.innerHTML = 'Rating: ' + rating + ' stars';
          li.appendChild(offscreenRating);

          ratingP.setAttribute('rating', rating);
        }
        else {
          ratingP.innerHTML = 'unrated';
          ratingP.setAttribute('rating', 'invalid');
        }
        li.appendChild(ratingP);

        const date = document.createElement('p');
        date.className = 'review-date';
        if (review.createdAt) {
          date.innerHTML = new Date(review.createdAt).toDateString();
        }
        else {
          date.innerHTML = 'pending';
        }
        li.appendChild(date);

        const comments = document.createElement('p');
        comments.innerHTML = review.comments;
        comments.className = 'review-text';
        li.appendChild(comments);

        reviewList.append(li);
      });
    });
  }

  getCuisineAndFavoriteDiv(restaurant) {
    //    this.content.insertAdjacentHTML('beforeend', `<div><div></div><p class="cuisine">${restaurant.cuisine_type}</p><button>❤</button></div>`);
    const div = document.createElement('div');
    // Add empty div to help center cuisine
    div.append(document.createElement('div'));

    div.insertAdjacentHTML('beforeend'
      ,`<p class="cuisine">${restaurant.cuisine_type}</p>`);

    this.favoriteButton.setAttribute('restaurant_id',restaurant.id);
    this.favoriteButton.setAttribute('value', restaurant.is_favorite && restaurant.is_favorite != "false" ? 'true' : 'false');

    div.append(this.favoriteButton);

    return div;
  }

  /**
  * Toggle favorite when button is clicked
  **/
  toggleFavorite() {
    let is_favorite = self.favoriteButton.getAttribute('value');

    // is_favorite may be boolean or text value
    is_favorite = is_favorite && is_favorite != 'false' ? false : true;

    self.favoriteButton.setAttribute('value', is_favorite);

    console.log('toggle favorite: ' + is_favorite );

    const restaurant_id = self.favoriteButton.getAttribute('restaurant_id');
    self.db.setFavorite(restaurant_id, is_favorite);
  }

  /**
  * Build operating hours table
  **/
  getHoursTable(operatingHours) {
    const hours = document.createElement('table');

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

    return hours;
  }

  /**
  * Build the figure
  **/
  getFigure(restaurant) {
    const fig = document.createElement('figure');
    const pic = document.createElement('picture');
    const imageURL = DBHelper.imageUrlForRestaurant(restaurant);
    pic.insertAdjacentHTML('beforeend',`<source media="(min-width: 561px)" srcset="${imageURL.replace('.jpg','-800_lg.jpg')}">`)
    pic.insertAdjacentHTML('beforeend',`<source media="(min-width: 321px)" srcset="${imageURL.replace('.jpg','-560_md.jpg')}">`)
    pic.insertAdjacentHTML('beforeend', `<img src="${imageURL.replace('.jpg','-320_sm.jpg')}" alt="${restaurant.name}">`)
    fig.append(pic);
    fig.insertAdjacentHTML('beforeend',`<figcaption>${restaurant.name}</figcaption>`);

    return fig;
  }

  /**
  * Build the breadcrumb nav with no restaurant name
  **/
  buildBreadCrumbs() {
    const nav = document.createElement('nav');
    nav.className='breadcrumb';
    const ul = document.createElement('ul');
    const liHome = document.createElement('li');
    liHome.innerHTML = '<a href="/">Home</a>'
    ul.append(liHome);
    ul.append(document.createElement('li'));
    nav.append(ul);

    return nav;
  }

  /**
  * Set name portion of bread crumb to empty string.
  **/
  clearBreadCrumb() {
    this.bcRestaurant.innerHTML = '';
  }

  setBreadCrumb(name) {
    this.bcRestaurant.innerHTML = name;
  }


  /**
  * Parse the name out of the location.
  * The router should insure that the pathname is of the form /fruit/[name],
  * so we just need to split the pathname by '/' and return the last element
  * from the resulting array
  **/
  getTagFromLocation() {
    let a = location.hash.slice(1).split('/')
    return a[a.length-1];
  }


}

export { DetailView as default };
