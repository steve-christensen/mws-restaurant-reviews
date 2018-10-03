/*
 * The list view class will render the restaurant list on the home page.
 */

import BaseView from './base-view.js';
import DBHelper from './dbhelper.js';

class AddReviewView extends BaseView {
  constructor (map, db, bc) {

    super(map);     // Sets this.parent, this.content, and this.map

//    this.db = new DBHelper();
    this.db = db;

    this.bc = bc;

    this.errorFile = '/app/no-restaurant.html';

    this.form = document.createElement('form');

    this.name = document.createElement('input');
    this.name.setAttribute('type', 'text');
    this.name.setAttribute('required', true);
    this.name.setAttribute('size', 25);
    this.name.setAttribute('minlength', 2)
    this.name.setAttribute('maxlength', 25);
    this.name.setAttribute('pattern', "(\\w+\\s?)*\\w+")
    this.name.setAttribute('title', 'Up to 25 alpha characters with single spaces between names.')

  /*  this.nameStatus = document.createElement('p');
    this.nameStatus.innerHTML = 'too short - Enter 2-25 characters';
    */

    this.star = '★';

    this.stars = document.createElement('p');
    this.stars.className = 'stars';
    this.stars.innerHTML = this.star.repeat(3);


    this.rating = document.createElement('input');
    this.rating.setAttribute('type', 'range');
    this.rating.setAttribute('min', 1);
    this.rating.setAttribute('max', 5);
    this.rating.value = 3;
    this.rating.addEventListener('change', event => {
      this.stars.innerHTML = this.star.repeat(event.target.value);
    });

    this.comments = document.createElement('textarea');
    this.comments.setAttribute('rows', 5);
    this.comments.setAttribute('cols', 50);
    this.comments.setAttribute('maxlength', 500);
    this.comments.setAttribute('required', true);
    this.comments.setAttribute('preload', 'up to 500 characters');

    this.submit = document.createElement('input');
    this.submit.type = 'submit';
    this.submit.value='Save';

    this.resetButton = document.createElement('input');
    this.resetButton.type = 'reset';
    this.resetButton.addEventListener('click', event => {
      this.stars.innerHTML = this.star.repeat(3);
    });

    this.form.addEventListener('submit', event => {
      event.preventDefault();

      const review = {
        restaurant_id: Number(this.form.getAttribute('restaurant_id')),
        name: this.name.value,
        rating: Number(this.rating.value),
        comments: this.comments.value
      };

      this.db.addReview(review);

      console.log('Form submitted: ' + JSON.stringify(review));

      this.resetForm();
    });

  }

  renderView() {
    super.renderView();   // Clear map markers and content section

    this.parent.className = 'add-review';

    const tag = this.getTagFromLocation();

    db.fetchRestaurantByTag(tag).then(restaurant => {
      if (restaurant) {
        this.bc.reset();
        this.bc.addCrumb(restaurant.name, `#/restaurant/${restaurant.tag}`);
        this.bc.addCrumb('add_review', '');
        this.bc.render();

        this.renderForm(restaurant);
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
  * Add the form to the content section
  **/
  renderForm(restaurant) {
    this.form.innerHTML = '';
    this.content.insertAdjacentHTML('beforeend',`<h2>Enter review for ${restaurant.name}</h2>`);

    this.form.setAttribute('restaurant_id', restaurant.id);

    this.content.append(this.form);

    this.form.insertAdjacentHTML('beforeend','<p>All fields are required.</p>')

    this.form.insertAdjacentHTML('beforeend', '<label for="name">Name:</label><br>');
    this.form.append(this.name);
    this.form.insertAdjacentHTML('beforeend', '<span class="validity"></span>');

    this.form.insertAdjacentHTML('beforeend', '<br><br><label for="rating">Rating:</label><br>');
    this.form.append(this.rating);
    this.form.append(this.stars);

    this.form.insertAdjacentHTML('beforeend', '<br><br><label for="comments">Comments:</label><br>');
    this.form.append(this.comments);
    this.form.insertAdjacentHTML('beforeend', '<span class="validity"></span><br><br>');

    this.form.append(this.submit);

    this.form.append(this.resetButton);
  }

  /**
  * reset form values to defaults
  **/
  resetForm() {
    this.name.value = '';
    this.rating.value = 3;
    this.stars.innerHTML = this.star.repeat(3);
    this.comments.value = '';
  }

  /**
  * Parse the name out of the location.
  * The router should insure that the pathname is of the form /fruit/[name],
  * so we just need to split the pathname by '/' and return the last element
  * from the resulting array
  **/
  getTagFromLocation() {
    let a = location.hash.slice(1).split('/')
    return a[a.length-2];
  }
}

export { AddReviewView as default };
