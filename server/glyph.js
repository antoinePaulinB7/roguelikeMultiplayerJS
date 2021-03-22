class Glyph {
  constructor(properties) {
    properties = properties || {}
    this._char = properties['char'] || ' '
    this._foreground = properties['foreground'] || 'white'
    this._background = properties['background'] || 'black'
  }

  getChar = () => this._char
  getForeground = () => this._foreground
  getBackground = () => this._background
}

module.exports = {
  Glyph,
}
