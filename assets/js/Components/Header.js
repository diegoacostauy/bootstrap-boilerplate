export default class Header {
  constructor() {
    this.el = document.querySelector('header');
  }

  message() {
    console.log(this.el);
  }
}