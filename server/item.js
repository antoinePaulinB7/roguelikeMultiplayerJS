const { Glyph } = require('./glyph')

class Item extends Glyph {
  constructor(properties) {
    properties = properties || {}
    super(properties)
    this._name = properties['name'] || ''
  }

  setName = (name) => (this._name = name)

  getName = () => this._name
}

module.exports = {
  Item,
}
