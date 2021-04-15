const { Entity } = require('./entity')
const { Tile } = require('./tile')
const ROT = require('rot-js')
const { randomize, distance } = require('./utils')

class Mixins {}

Mixins.Moveable = {
  name: 'Moveable',
  tryMove: function (x, y, z, state) {
    x = this._x + x
    y = this._y + y
    z = this._z + z

    let tile = state.map.getTile(x, y, this._z)
    let target = state.getEntityAt(x, y, this._z)

    if (z < this.getZ()) {
      if (tile != Tile.stairsUp) {
        state.sendMessage(this, "You can't go up here!")
        return false
      } else {
        state.sendMessage(this, 'You ascend to level %s!', [z + 1])
        this.setPosition(state, x, y, z)
        return true
      }
    } else if (z > this.getZ()) {
      if (tile != Tile.stairsDown) {
        state.sendMessage(this, "You can't go down here!")
        return false
      } else {
        state.sendMessage(this, 'You descend to level %s!', [z + 1])
        this.setPosition(state, x, y, z)
        return true
      }
    } else if (target) {
      if (this.hasMixin('Attacker')) {
        this.attack(target, state)
        return true
      } else {
        return false
      }
    } else if (tile.isWalkable()) {
      this.setPosition(state, x, y, this.getZ())
      return true
    }

    return false
  },
}

Mixins.PlayerMoveable = {
  name: 'PlayerMoveable',
  groupName: 'Moveable',
  tryMove: function (x, y, z, state) {
    x = this._x + x
    y = this._y + y
    z = this._z + z

    let tile = state.map.getTile(x, y, this._z)
    let target = state.getEntityAt(x, y, this._z)

    if (z < this.getZ()) {
      if (tile != Tile.stairsUp) {
        state.sendMessage(this, "You can't go up here!")
        return false
      } else if (state.getEntityAt(x, y, z)) {
        state.sendMessage(this, "You can't go up here! Space is occupied")
      } else {
        state.sendMessage(this, 'You ascend to level %s!', [z + 1])
        this.setPosition(state, x, y, z)
        return true
      }
    } else if (z > this.getZ()) {
      if (tile != Tile.stairsDown) {
        state.sendMessage(this, "You can't go down here!")
        return false
      } else if (state.getEntityAt(x, y, z)) {
        state.sendMessage(this, "You can't go down here! Space is occupied")
      } else {
        state.sendMessage(this, 'You descend to level %s!', [z + 1])
        this.setPosition(state, x, y, z)
        return true
      }
    } else if (target) {
      if (this.hasMixin('Attacker')) {
        this.attack(target, state)
        return true
      } else {
        return false
      }
    } else if (tile.isWalkable()) {
      this.setPosition(state, x, y, this.getZ())
      return true
    } else if (tile.isDiggable()) {
      state.map.dig(x, y, z)
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

      state.sendMessage(this, 'You strike the %s for %s damage!', [
        target.getName(),
        damage,
      ])

      state.sendMessage(target, 'The %s strikes you for %s damage!', [
        this.getName(),
        damage,
      ])

      target.takeDamage(this, damage, state)
    }
  },
}

Mixins.Sight = {
  name: 'Sight',
  groupName: 'Sight',
  init: function (properties) {
    this._sightRadius = properties['sightRadius'] || 5
  },
  getSightRadius: function () {
    return this._sightRadius
  },
}

Mixins.PlayerActor = {
  name: 'PlayerActor',
  groupName: 'Actor',
  init: function (properties) {
    this._global_engine = properties['state'].engine
    this._scheduler = new ROT.Scheduler.Simple()
    this._local_engine = new ROT.Engine(this._scheduler)
    this._scheduler.add(this, true)
    this._local_engine.start()
  },
  act: function () {
    this._local_engine.lock()
  },
}

Mixins.FungusActor = {
  name: 'FungusActor',
  groupName: 'Actor',
  init: function (properties) {
    this._growthsRemaining = 5
    this._state = properties['state'] || this._state
  },
  act: function () {
    if (this._growthsRemaining > 0) {
      if (Math.random() <= 0.02) {
        let xOffset = Math.floor(Math.random() * 3) - 1
        let yOffset = Math.floor(Math.random() * 3) - 1

        if (xOffset != 0 || yOffset != 0) {
          let x = this.getX() + xOffset
          let y = this.getY() + yOffset

          if (this._state.isEmptyFloor(x, y, this.getZ())) {
            let entity = new Entity(Entities.FungusTemplate(this._state))
            entity.setX(x)
            entity.setY(y)
            entity.setZ(this.getZ())

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

Mixins.StopperActor = {
  name: 'StopperActor',
  groupName: 'Actor',
  init: function (properties) {
    this._global_engine = properties['state'].engine
  },
  act: function () {
    this._global_engine.lock()
  },
}

Mixins.WanderActor = {
  name: 'WanderActor',
  groupName: 'Actor',
  init: function (properties) {
    this._state = properties['state'] || this._state
  },
  act: function () {
    let [x, y] = randomize(ROT.DIRS[4])[0]
    this.tryMove(x, y, 0, this._state)
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
  groupName: 'Controller',
  init: function (properties) {
    this._clientId = properties['clientId']
  },
  getClientId: function () {
    return this._clientId
  },
}

Mixins.TurnSyncer = {
  name: 'TurnSyncer',
  init: function (properties) {
    this._state = properties['state']
    this._syncRange = properties['syncRange'] || 10
    this._syncTime = properties['syncTime'] || 5

    if (!this.hasMixin('Actor')) {
      throw new Error(
        `This ${this.getName()} requires error Actor mixin for TurnSyncer to work`,
      )
    }

    if (this.hasMixin('ClientController')) {
      throw new Error(
        `This ${this.getName()} cannot have both a ClientController and a TurnSyncer`,
      )
    }

    this.turnsTilDesync = this._syncTime

    this.oldAct = this.act

    this.syncedPlayer = null

    this.act = () => {
      let position = { x: this.getX(), y: this.getY() }

      if (this.syncedPlayer) {
        let entityPosition = {
          x: this.syncedPlayer.getX(),
          y: this.syncedPlayer.getY(),
        }
        let dist = distance(position, entityPosition)

        if (this.syncedPlayer.getZ() != this.getZ()) {
          this.desync()
        } else if (dist > this._syncRange) {
          this.turnsTilDesync--

          if (this.turnsTilDesync <= 0) {
            this.desync()
          }
        } else {
          this.turnsTilDesync = this._syncTime
        }
      } else {
        let clientEntities = Object.values(this._state.entities).filter(
          (entity) => {
            return (
              entity.getZ() == this.getZ() &&
              entity.hasMixin('ClientController')
            )
          },
        )

        let minDistance = Infinity
        let closest = null

        clientEntities.forEach((entity) => {
          let entityPosition = { x: entity.getX(), y: entity.getY() }

          let dist = distance(position, entityPosition)

          // console.log(dist)

          if (dist < minDistance) {
            minDistance = dist
            closest = entity
          }
        })

        if (minDistance <= this._syncRange) {
          this.sync(closest)
        }
      }

      this.oldAct()
    }
  },
  sync: function (clientEntity) {
    this._state.scheduler.remove(this)
    clientEntity._scheduler.add(this, true)
    this.syncedPlayer = clientEntity
    this.turnsTilDesync = this._syncTime

    console.log(this.getName(), 'syncing with', clientEntity.getName())
  },
  desync: function () {
    if (this.syncedPlayer) {
      this.syncedPlayer._scheduler.remove(this)
    }
    this._state.scheduler.add(this, true)
    this.syncedPlayer = null
  },
  syncRemove: function () {
    if (this.syncedPlayer) {
      this.syncedPlayer._scheduler.remove(this)
    } else {
      this._state.scheduler.remove(this)
    }
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
      Mixins.Sight,
      Mixins.MessageRecipient,
    ],
    state: state,
  }
}

Entities.Stopper = (state) => {
  return {
    mixins: [Mixins.StopperActor],
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

Entities.BatTemplate = (state) => {
  return {
    name: 'bat',
    char: 'B',
    foreground: 'purple',
    maxHp: 5,
    attackValue: 4,
    mixins: [
      Mixins.Moveable,
      Mixins.WanderActor,
      Mixins.TurnSyncer,
      Mixins.Attacker,
      Mixins.Destructible,
    ],
    state: state,
  }
}

Entities.NewtTemplate = (state) => {
  return {
    name: 'newt',
    char: ':',
    foreground: 'yellow',
    maxHp: 3,
    attackValue: 2,
    mixins: [
      Mixins.Moveable,
      Mixins.WanderActor,
      Mixins.TurnSyncer,
      Mixins.Attacker,
      Mixins.Destructible,
    ],
    state: state,
  }
}

module.exports = {
  Mixins,
  Entities,
}
