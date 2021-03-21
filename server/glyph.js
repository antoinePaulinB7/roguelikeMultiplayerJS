class Glyph {
  constructor(chr, foreground, background) {
    this._char = chr || ' '
    this._foreground = foreground || 'white'
    this._background = background || 'black'
  }

  getChar = () => this._char
  getForeground = () => this._foreground
  getBackground = () => this._background
}

module.exports = {
  Glyph,
}
