const { Entity } = require('./entity')

class Mixins {}

Mixins.Moveable = {
  name: 'Moveable',
  tryMove: function (x, y, state) {
    x = this._x + x
    y = this._y + y

    let tile = state.map.getTile(x, y)
    let target = state.getEntityAt(x, y)

    if (target) {
      if (this.hasMixin('Attacker')) {
        this.attack(target, state)
        return true
      } else {
        return false
      }
    } else if (tile.isWalkable()) {
      this._x = x
      this._y = y
      return true
    } else if (tile.isDiggable()) {
      state.map.dig(x, y)
      return true
    }
    return false
  },
}

Mixins.PlayerMoveable = {
  name: 'PlayerMoveable',
  groupName: 'Moveable',
  tryMove: function (x, y, state) {
    x = this._x + x
    y = this._y + y

    let tile = state.map.getTile(x, y)
    let target = state.getEntityAt(x, y)

    if (target) {
      if (this.hasMixin('Attacker')) {
        this.attack(target, state)
        return true
      } else {
        return false
      }
    } else if (tile.isWalkable()) {
      this._x = x
      this._y = y
      return true
    } else if (tile.isDiggable()) {
      state.map.dig(x, y)
      return true
    }
    return false
  },
}

Mixins.MoleratMoveable = {
  name: 'MoleratMoveable',
  groupName: 'Moveable',
  tryMove: function (x, y, state) {
    x = this._x + x
    y = this._y + y

    let tile = state.map.getTile(x, y)
    let target = state.getEntityAt(x, y)

    if (target) {
      return false
    } else if (tile.isWalkable()) {
      this._x = x
      this._y = y
      return true
    } else if (tile.isDiggable()) {
      state.map.dig(x, y)
      return true
    }
    return false
  },
}

Mixins.GhostMoveable = {
  name: 'GhostMoveable',
  groupName: 'Moveable',
  tryMove: function (x, y, state) {
    x = this._x + x
    y = this._y + y

    let tile = state.map.getTile(x, y)
    let target = state.getEntityAt(x, y)

    if (target) {
      return false
    } else if (tile.isWalkable()) {
      this._x = x
      this._y = y
      return true
    } else if (tile.isDiggable()) {
      state.map.dig(x, y)
      return true
    }
    return false
  },
}

Mixins.Destructible = {
  name: 'Destructible',
  init: function (template) {
    this._maxHp = template['maxHp'] || 10
    this._hp = template['hp'] || this._maxHp
    this._defenseValue = template['defenseValue'] || 0
  },
  getHp: function () {
    return this._hp
  },
  getMaxHp: function () {
    return this._maxHp
  },
  getDefenseValue: function () {
    return this._defenseValue
  },
  takeDamage: function (attacker, damage, state) {
    this._hp -= damage
    if (this._hp <= 0) {
      state.sendMessage(attacker, 'You kill the %s!', [this.getName()])
      state.sendMessage(this, 'You die!')
      state.removeEntity(this)
    }
  },
}

Mixins.Attacker = {
  name: 'Attacker',
  groupName: 'Attacker',
  init: function (template) {
    this._attackValue = template['attackValue'] || 1
  },
  getAttackValue: function () {
    return this._attackValue
  },
  attack: function (target, state) {
    if (target.hasMixin('Destructible')) {
      let attackValue = this.getAttackValue()
      let defense = target.getDefenseValue()
      let max = Math.max(0, attackValue - defense)
      let damage = 1 + Math.floor(Math.random() * max)

      state.sendMessage(this, 'You strike the %s for %d damage!', [
        target.getName(),
        damage,
      ])

      state.sendMessage(target, 'The %s strikes you for %d damage!', [
        this.getName(),
        damage,
      ])

      target.takeDamage(this, damage, state)
    }
  },
}

Mixins.PlayerActor = {
  name: 'PlayerActor',
  groupName: 'Actor',
  init: function (properties) {
    this._engine = properties['state'].engine
  },
  act: function () {
    this._engine.lock()
  },
}

Mixins.FungusActor = {
  name: 'FungusActor',
  groupName: 'Actor',
  init: function (properties) {
    this._growthsRemaining = 5
    this._state = properties['state']
  },
  act: function () {
    if (this._growthsRemaining > 0) {
      if (Math.random() <= 0.02) {
        let xOffset = Math.floor(Math.random() * 3) - 1
        let yOffset = Math.floor(Math.random() * 3) - 1

        if (xOffset != 0 || yOffset != 0) {
          let x = this.getX() + xOffset
          let y = this.getY() + yOffset
          if (this._state.isEmptyFloor(x, y)) {
            let entity = new Entity(Entities.FungusTemplate(this._state))
            entity.setX(x)
            entity.setY(y)
            this._state.addEntity(entity)
            this._growthsRemaining--

            this._state.sendMessageNearby(
              entity.getX(),
              entity.getY(),
              'The fungus is spreading!',
            )
          }
        }
      }
    }
  },
}

Mixins.MessageRecipient = {
  name: 'MessageRecipient',
  init: function (template) {
    this._messages = []
  },
  receiveMessage: function (message) {
    this._messages.push(message)
    console.log(this.getName(), message)
  },
  getMessages: function () {
    return this._messages
  },
  clearMessages: function () {
    this._messages = []
  },
}

Mixins.ClientController = {
  name: 'ClientController',
  init: function (properties) {
    this._clientId = properties['clientId']
  },
  getClientId: function () {
    return this._clientId
  },
}

class Entities {}

Entities.PlayerTemplate = (state) => {
  return {
    char: '@',
    foreground: 'white',
    maxHp: 40,
    attackValue: 10,
    mixins: [
      Mixins.PlayerMoveable,
      Mixins.PlayerActor,
      Mixins.ClientController,
      Mixins.Attacker,
      Mixins.Destructible,
      Mixins.MessageRecipient,
    ],
    state: state,
  }
}

Entities.FungusTemplate = (state) => {
  return {
    name: 'fungus',
    char: 'F',
    foreground: 'green',
    maxHp: 2,
    mixins: [Mixins.FungusActor, Mixins.Destructible],
    state: state,
  }
}

module.exports = {
  Mixins,
  Entities,
}
