const { GameObject } = require('./game-object')

class Entity extends GameObject {
  constructor(properties) {
    properties = properties || {}
    super(properties)
    this._x = properties['x'] || 0
    this._y = properties['y'] || 0
    this._z = properties['z'] || 0
  }

  setX = (value) => (this._x = value)
  setY = (value) => (this._y = value)
  setZ = (value) => (this._z = value)

  getX = () => this._x
  getY = () => this._y
  getZ = () => this._z

  setPosition = (state, x, y, z) => {
    let oldX = this._x
    let oldY = this._y
    let oldZ = this._z

    this._x = x
    this._y = y
    this._z = z

    state.updateEntityPosition(this, oldX, oldY, oldZ)
  }
}

module.exports = {
  Entity,
}
