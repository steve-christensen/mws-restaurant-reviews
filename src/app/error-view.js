class ErrorView {
  constructor (file) {
    this.file = file;

    this.main = document.querySelector('main');
    this.content = document.querySelector('.content');
  }

  renderView() {

    this.main.className = 'error';

    fetch(this.file)
      .then(response => response.text())
      .then(text => {
        this.content.innerHTML = text;

        const path = location.pathname;

        document.querySelector('#path').innerHTML = path;

//        history.replaceState(null,'','/');
      });
  }
}

export { ErrorView as default };
