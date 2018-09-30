
// Import router for serving single page app
import Router from './router.js';

// Import list and detail views
import ListView from './list-view.js';
import DetailView from './detail-view.js';
import AddReviewView from './add-review-view.js';

// Import error view
import ErrorView from './error-view.js';

import Breadcrumb from './breadcrumb.js';

// Import map Control
import MapControl from './map-control.js';

import DBHelper from './dbhelper.js';

// Create one instance of DBHelper and pass to list and detail views.
const db = new DBHelper();

window.db = db;


// Initialize the router passing an instance of ErrorView.
const errorView = new ErrorView('/app/page404.html');
const router = new Router(errorView);


// Initialize map with latitude, longitude, and zoom
// Added router to allow internal navigation when clicking on markers
const map = new MapControl(40.722216, -73.987501, 12, router);

const bc = new Breadcrumb();

const listView = new ListView(map, db);
const detailView = new DetailView(map, db, bc);
const addReviewView = new AddReviewView(map, db, bc);


// Add the routes:
// Use a string to match the root page and display the list view.
router.addRoute('/', listView);

// Use a RegExp for matching detail pages.
router.addRoute(/^\/restaurant\/[^\/#?&]*$/, detailView);

router.addRoute(/^\/restaurant\/[^\/#?&]*\/add_review/, addReviewView);

// Call the render function directly to render the first view
router.render(location);
