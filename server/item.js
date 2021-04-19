const { GameObject } = require('./game-object')

class Item extends GameObject {
  constructor(properties) {
    properties = properties || {}
    super(properties)
  }
}

module.exports = {
  Item,
}
