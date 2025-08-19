/**
 * @typedef {Object} MarqueeOptions
 * @property {NodeListOf<Element> | HTMLDivElement} marquees - элемент(ы) бегущей(их) строк(и)
 * @property {string} text - текст внутри бегущей(их) строк(и)
 */

export default class {
  /**
   * @param {MarqueeOptions} options
   */
  constructor(options) {
    this.options = options;
    this.marquees = this.options.marquees || [];

    this.render()
  }

  createContent = (parent) => {
    const div = document.createElement('div');

    div.dataset.jsMarqueeText = this.options.text

    parent.appendChild(div);
  }


  render() {
    if (!this.options.marquees) return

    if (this.marquees.length) {
      this.marquees.forEach(this.createContent)
      return
    }

    this.createContent(this.marquees)
  }
}