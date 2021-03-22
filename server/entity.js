const { Glyph } = require('./glyph')

class Entity extends Glyph {
  constructor(properties) {
    properties = properties || {}
    super(properties)
    this._name = properties['name'] || ''
    this._x = properties['x'] || 0
    this._y = properties['y'] || 0

    this._attachedMixins = {}

    let mixins = properties['mixins'] || []

    for (let mixin of mixins) {
      for (let key in mixin) {
        console.log(key)

        if (key != 'init' && key != 'name' && !this.hasOwnProperty(key)) {
          this[key] = mixin[key]
        }
      }

      this._attachedMixins[mixin.name] = true

      if (mixin.init) {
        mixin.init.call(this, properties)
      }
    }
  }

  setName = (name) => (this._name = name)
  setX = (value) => (this._x = value)
  setY = (value) => (this._y = value)

  getName = () => this._name
  getX = () => this._x
  getY = () => this._y

  hasMixin = (mixin) => {
    if (typeof mixin === 'object') {
      return this._attachedMixins[mixin.name]
    } else {
      return this._attachedMixins[mixin]
    }
  }
}

module.exports = {
  Entity,
}
