/*
 * The list view class will render the restaurant list on the home page.
 */

import BaseView from './base-view.js';
import DBHelper from './dbhelper.js';

class ListView extends BaseView {
  constructor (map, db) {

    super(map);     // Sets this.parent, this.content, and this.map

//    this.db = new DBHelper();
    this.db = db;

    this.refreshRestaurants = () => {
      console.log('Refresh restaurants');

      const cIndex = this.cuisineSelect.selectedIndex;
      const nIndex = this.neighborhoodSelect.selectedIndex;

      const cuisine = this.cuisineSelect[cIndex].value;
      const neighborhood = this.neighborhoodSelect[nIndex].value;

      console.log(`cuisine=${cuisine} / neighborhood=${neighborhood}`);
      // Clear restaurant list
      this.restaurantList.innerHTML = '';

      // Clear map markers
      this.map.clearMarkers();

      this.db.fetchRestaurantsByCuisineAndNeighborhood(cuisine, neighborhood)
        .then(restaurants => {
          restaurants.forEach(restaurant => this.addRestaurant(restaurant));
        });

        this.map.resetView();
    };

    window.updateRestaurants = this.refreshRestaurants;

    this.neighborhoodSelect = this.neighborhoodSelectInit();
    this.cuisineSelect = this.cuisineSelectInit();
//    this.favoriteButton = this.favoriteButtonInit();

    this.restaurantList = document.createElement('ul');
  }

  renderView() {
    super.renderView();   // Clear map markers and content section

    this.parent.className = 'list';

    this.renderFramework();

    this.refreshRestaurants();
  }

  addRestaurant(restaurant) {
    // Add map marker
    this.map.addMarker(restaurant.name, restaurant.latlng, DBHelper.urlForRestaurant(restaurant));

    // Create list item
    const li = document.createElement('li');

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant).replace(".jpg","-320_sm.jpg");
    image.alt = restaurant.image_desc || restaurant.name;
    li.append(image);

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    li.append(name);

    const favorite = document.createElement('p');
    favorite.setAttribute('favorite', restaurant.is_favorite && restaurant.is_favorite != "false");
    favorite.innerHTML = restaurant.is_favorite && restaurant.is_favorite != "false" ? '❤' : '♡';
    li.append(favorite);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    // Put the link text in a paragraph tag for vertiacl
    const more = document.createElement('a');
    more.setAttribute('aria-label', restaurant.name + ' Details');
    const moreP = document.createElement('p');
    moreP.innerHTML = 'View Details';
    more.append(moreP);
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more);

    this.restaurantList.append(li);
  }

  // Create the basic structure of the page.
  renderFramework() {
    // Create and populate filter div
    const filterDiv = document.createElement('div');
    filterDiv.className = 'filter-options';
    filterDiv.insertAdjacentHTML('beforeend','<h2>Filter Results</h2>');
    filterDiv.insertAdjacentHTML('beforeend','<label id="neighborhood-label" for="neighborhoods-select">Neighborhood</label>');
    filterDiv.append(this.neighborhoodSelect);
    filterDiv.insertAdjacentHTML('beforeend','<label id="cuisine-label" for="cuisines-select">Cuisine</label>');
    filterDiv.append(this.cuisineSelect);

    this.content.insertAdjacentElement('beforeend', filterDiv);

    this.content.insertAdjacentElement('beforeend', this.restaurantList);
  }

  neighborhoodSelectInit() {
    const select = document.createElement('select');
    select.id = 'neighborhoods-select';
    select.setAttribute('name','neighborhood');
    select.setAttribute('role', 'listbox');
    select.setAttribute('aria-labelledby', 'neighborhood-label');
    select.setAttribute('aria-activedescendant', 'neighborhood-all');
    select.setAttribute('onchange','updateRestaurants()');
    select.innerHTML = '<option id="neighborhood-all" value="all">All Neighborhoods</option>';

    // Fill select options from DB
//    this.db.fetchNeighborhoods().then(restaurants => this.fillOptions(select, restaurants));
    this.fillOptions(select, this.db.fetchNeighborhoods());

    return select;
  }

  cuisineSelectInit() {
    const select = document.createElement('select');
    select.id = 'cuisines-select';
    select.setAttribute('name','cuisine');
    select.setAttribute('role', 'listbox');
    select.setAttribute('aria-labelledby', 'cuisine-label');
    select.setAttribute('aria-activedescendant', 'cuisine-all');
    select.setAttribute('onchange','updateRestaurants()');
    select.innerHTML = '<option id="cuisine-all" value="all" selected aria-selected="true">All Cuisines</option>';

    // Fill select options from DB
//    this.db.fetchCuisines().then(restaurants => this.fillOptions(select, restaurants));
    this.fillOptions(select, this.db.fetchCuisines());

    return select;
  }

  fillOptions(select, list) {
    list.then(a => a.forEach((item, idx) => {
      const option = document.createElement('option');
      option.id = select.name + '-' + idx;
      option.innerHTML = item;
      option.value = item;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      select.append(option);
    }));
  }

/*  favoriteButtonInit() {
    const button = document.createElement('button');
    button.className = 'favorite-toggle';
    button.setAttribute('value', '');
    button.innerHTML = '';
  }
*/
}

export { ListView as default };
