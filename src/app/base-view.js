/*
 * The base view class is intended only to be used as an extension
 * for building other classes.
 */

class BaseView {
  constructor (map) {
    this.parent = document.querySelector('main');
    this.map = map;
    this.content = document.querySelector('section.content');
  }

  /*
  * For base class, clear customizable elements.
  * Actual rendering will be performed by extending class.
  */
  renderView() {
    this.reset();
    window.scrollTo(0,0);
  }

  /*
   * The reset method should not need to be extended by children.
   */
  reset() {
    // Clear class name
    this.parent.className = '';

    // Clear map markers
    this.map.clearMarkers();

    // Clear the content section
    this.content.innerHTML = '';
  }
}

export { BaseView as default };
