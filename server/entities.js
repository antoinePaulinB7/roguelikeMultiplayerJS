class Mixins {}

Mixins.Moveable = {
  name: 'Moveable',
  tryMove: (x, y, map) => {
    let tile = map.getTile(x, y)

    if (tile.isWalkable()) {
      this._x = x
      this._y = y
      return true
    } else if (tile.isDiggable()) {
      map.dig(x, y)
      return true
    }
    return false
  },
}

Mixins.PlayerMoveable = {
  name: 'PlayerMoveable',
  groupName: 'Moveable',
  tryMove: (x, y, map) => {
    let tile = map.getTile(x, y)

    if (tile.isWalkable()) {
      this._x = x
      this._y = y
      return true
    } else if (tile.isDiggable()) {
      map.dig(x, y)
      return true
    }
    return false
  },
}

Mixins.ClientController = {
  name: 'Client Controller',
  init: function (properties) {
    this._clientId = properties['clientId']
  },
  getClientId: function () {
    return this._clientId
  },
}

class Entities {}

Entities.playerTemplate = {
  char: '@',
  foreground: 'white',
  background: 'black',
  mixins: [Mixins.PlayerMoveable, Mixins.ClientController],
}

module.exports = {
  Mixins,
  Entities,
}
