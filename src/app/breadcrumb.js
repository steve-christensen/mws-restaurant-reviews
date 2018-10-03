/*
 * The breadcrumb class will build and display the breadcrumb nav.
 */

class Breadcrumb {
  constructor () {
    this.crumbs = [];

    this.nav = document.querySelector('.breadcrumb');
    this.crumbList = document.createElement('ul');
    this.nav.append(this.crumbList);
  }

  /*
  * For base class, clear customizable elements.
  * Actual rendering will be performed by extending class.
  */
  render() {
    this.crumbs.forEach(crumb => {
      const li = document.createElement('li');
      li.innerHTML = crumb.link ? `<a href="${crumb.link}">${crumb.crumb}</a>` : crumb.crumb;
      this.crumbList.append(li);
    });
  }

  /**
  * Add a breadcrumb to the list.
  **/
  addCrumb(name, url) {
    this.crumbs.push({ crumb: name, link: url });
  }

  /*
   * Reset the breadcrumb list to to have only home.
   */
  reset() {
    // empty the crumbs array
    this.crumbs.length = 0;

    this.crumbList.innerHTML = '';

    // Restore 'Home' to the crumb array
    this.addCrumb('Home', '/');
  }
}

export { Breadcrumb as default };
