// This is a simple JavaScript router. The router will route to views based
// upon the value in the location. At this time, the router only handles the
// routing for the pathname portion of the URL. search and hash portions of the
// URL are ignored as I'm not using them in my use case.
//
// For the purposes of this router, a view is simply an object with a renderView
// method. The renderView method takes no parameters.
//
// The router also includes a list of routes which are added by the application
// via the addRoute method. A route consists of a path (either a string or
// RegExp) and a view object.
//
// Methods:
//
// Router(errorView) as mentioned, the constructor takes a view object to render
// when no matching route is found.
//
// addRoute(path, view)
//  path: string or regular expression representing the pathname portion of
//    the URL
//  view: object with a renderView method that requires no arguments
//
// render(next, current)
//  next: URL to transition to
//  current (optional): current URL
//
// Limitations: The router only handles internal navigation and navigation using
// the forward and back buttons of the browser. Navigating to an internal link
// directly via the address bar or from an external site will not work unless
// the web server is configured to route such links through the index.html page.
// If the web server does that, then those links too will be handled by this
// router.

class Router {
  // constructor takes a view to render when no route is found
  constructor (errorView) {
    this.routes = [];

    // Use this view in the event that there is no matching route
    this.errorView = errorView;

    // When the 'popstate' event occurs, render the display for the
    // current location.
    window.addEventListener('popstate', (event) => {
      this.render(location);
    });
  }

  // This method will be used to call the appropriate function to render the
  // view
  render(url, current) {
    let newPath = url.pathname;

    if (url.pathname == '/') {
      // Handle the case where navigation is returning from external site
      // using browser forward or back button
      if (history.state && history.state.path && (!current || history.state.path != current.pathname)) {
        newPath =  history.state.path;
        history.replaceState(null, '', newPath);
      }
    }

    // Check the route against the routes array.
    let route = this.findRoute(newPath);
    if (route) {
      // Render the appropriate view
      route.view.renderView();
    }
    else {
      // When no route matches, render the errorView.
      this.errorView.renderView();
    }

    // After the view has been rendered, create a listener to handle click
    // events for all internal links.
    document.querySelectorAll('a').forEach((el => {
      let url = new URL(el.href);
      if (url.origin === location.origin && !location.hash) {
        el.addEventListener('click', (event) => {
          let target = event.currentTarget;

          // Do nothing if ctrl, meta, alt, or shift keys were pressed
          if (!event.ctrlKey &&
              !event.metaKey &&
              !event.altKey &&
              !event.shiftKey) {
            event.preventDefault();
            let next = new URL(target.href);

            history.pushState(null,'',next.pathname);

            this.render(next, location);
          }
        });
      }
    }));
  }

  // Add routes. Order will matter. First match will be used.
  //    path: string or RegExp representing the route
  //    viewObject: object with a renderView method
  addRoute(path, viewObject) {
    let r = {
      'path': path,
      'view': viewObject
    }

    this.routes.push(r);

    return r;
  }

  // Check the path (key) against the routes and return the first match.
  //    key: string representing the URL pathname for the target location
  findRoute(key) {
    // Filter to get a list of matching routes
    let a = this.routes.filter(r => (typeof r.path === 'string' && r.path === key) || (typeof r.path === 'object' && key.match(r.path)));

    // Return the first match or null if there is no match.
    return a && 0 < a.length ? a[0] : null;
  }

  // Takes URL object and navigates to new URL. Use render method for internal
  // navigation or assign to location for external navigation.
  goTo(url) {
    if (url.orign === location.origin) {
      this.render(url);
    }
    else {
      location = url;
    }
  }
}

export { Router as default };
