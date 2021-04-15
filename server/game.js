const { MAP_WIDTH, MAP_HEIGHT } = require('./constants')

const { Glyph } = require('./glyph')
const { Tile } = require('./tile')
const { Map } = require('./map')
const { Entities, Mixins } = require('./entities')

const ROT = require('rot-js')
const { Entity } = require('./entity')
const { Builder } = require('./builder')
const ServerMessages = require('./server-messages')

const Utils = require('./utils')

module.exports = {
  initGame,
  joinGame,
  gameLoop,
  handleInput,
}

function initGame(clientId) {
  const state = createGameState(clientId)
  return state
}

function joinGame(state, clientId) {
  let properties = Entities.PlayerTemplate(state)
  properties.clientId = clientId

  let player = new Entity(properties)
  player.setName('Player 2')

  state.addEntityAtRandomPosition(player, 0)
}

class State {
  constructor() {
    this.builder = new Builder(MAP_WIDTH, MAP_HEIGHT, 3)
    this.map = new Map(this.builder.getTiles())
    this.entities = {}
    this.items = {}
    this.scheduler = new ROT.Scheduler.Simple()
    this.engine = new ROT.Engine(this.scheduler)

    this.scheduler.add(new Entity(Entities.Stopper(this)), true)

    let templates = [
      Entities.FungusTemplate(this),
      Entities.BatTemplate(this),
      Entities.NewtTemplate(this),
    ]

    for (let z = 0; z < this.map.getDepth(); z++) {
      for (let i = 0; i < 10; i++) {
        this.addEntityAtRandomPosition(
          new Entity(templates[Math.floor(Math.random() * templates.length)]),
          z,
        )
      }
    }
  }

  getEntityAt = (x, y, z) => {
    return this.entities[`${x},${y},${z}`]
  }

  getItemsAt = (x, y, z) => {
    return this.items[`${x},${y},${z}`]
  }

  setItemsAt = (x, y, z, itemList) => {
    let key = `${x},${y},${z}`
    if (itemList.length === 0) {
      if (this.items[key]) {
        delete this.items[key]
      }
    } else {
      this.items[key] = itemList
    }
  }

  addItem = (x, y, z, item) => {
    let key = `${x},${y},${z}`
    if (this.items[key]) {
      this.items[key].push(item)
    } else {
      this.items[key] = [item]
    }
  }

  addItemAtRandomPosition = (item, z) => {
    let position = this.map.getRandomFloorPosition(this, z)
    this.addItem(position.x, position.y, position.z, item)
  }

  isEmptyFloor = (x, y, z) => {
    return (
      this.map.getTile(x, y, z) == Tile.floorTile && !this.getEntityAt(x, y, z)
    )
  }

  addEntity = (entity) => {
    this.updateEntityPosition(entity)

    if (entity.hasMixin('Actor') && !entity.hasMixin('PlayerActor')) {
      this.scheduler.add(entity, true)
    }
  }

  removeEntity = (entity) => {
    let key = `${entity.getX()},${entity.getY()},${entity.getZ()}`

    if (this.entities[key] == entity) {
      delete this.entities[key]
    }

    if (entity.hasMixin('Actor')) {
      if (entity.hasMixin('TurnSyncer')) {
        entity.syncRemove()
      } else {
        this.scheduler.remove(entity)
      }
    }

    if (entity.hasMixin('ClientController')) {
      // handle disconnection ?
    }
  }

  addEntityAtRandomPosition = (entity, z) => {
    let { x, y } = this.map.getRandomFloorPosition(this, z)
    entity.setX(x)
    entity.setY(y)
    entity.setZ(z)
    this.addEntity(entity)
  }

  sendMessage = (recipient, message, args) => {
    if (recipient.hasMixin('MessageRecipient')) {
      if (args) {
        // console.log(...args)
        message = ROT.Util.format(message, ...args)
      }
      recipient.receiveMessage(message)
    }
  }

  sendMessageNearby = (x, y, z, message, args) => {
    if (args) {
      // console.log(...args)
      message = ROT.Util.format(message, ...args)
    }

    let entitiesNearby = this.getEntitiesWithin(x, y, z, 5)
    for (let entity of entitiesNearby) {
      if (entity.hasMixin('MessageRecipient')) {
        entity.receiveMessage(message)
      }
    }
  }

  updateEntityPosition(entity, oldX, oldY, oldZ) {
    if (oldX != undefined) {
      let oldKey = `${oldX},${oldY},${oldZ}`
      if (this.entities[oldKey] == entity) {
        delete this.entities[oldKey]
      }
    }

    if (
      entity.getX() < 0 ||
      entity.getX() >= this.map.getWidth() ||
      entity.getY() < 0 ||
      entity.getY() >= this.map.getHeight() ||
      entity.getZ() < 0 ||
      entity.getZ() >= this.map.getDepth()
    ) {
      console.log(entity)
      throw new Error('Entity position out of bounds.')
    }

    let key = `${entity.getX()},${entity.getY()},${entity.getZ()}`
    if (this.entities[key]) {
      console.log(key)
      throw new Error('Tried to add an entity at an occupied position.')
    }

    this.entities[key] = entity
  }

  getEntitiesWithin = (x, y, z, range) => {
    let entitiesWithin = Object.values(this.entities).filter(
      (entity) =>
        entity.getX() >= x - range &&
        entity.getX() <= x + range &&
        entity.getY() >= y - range &&
        entity.getY() <= y + range &&
        entity.getZ() == z,
    )

    return entitiesWithin
  }

  getJSON = (clientId, range = 4) => {
    if (clientId) {
      let clientEntity = Object.values(this.entities).find(
        (entity) =>
          entity.hasMixin('ClientController') &&
          entity.getClientId() == clientId,
      )

      if (!clientEntity) {
        return ServerMessages.PLAYER_DIED
      }

      range = clientEntity.getSightRadius()

      let visibleCells = {}

      this.map
        .getFov(clientEntity.getZ())
        .compute(
          clientEntity.getX(),
          clientEntity.getY(),
          range,
          function (x, y, radius, visibility) {
            visibleCells[x + ',' + y] = true
          },
        )

      let compressedEntities = this.getEntitiesWithin(
        clientEntity.getX(),
        clientEntity.getY(),
        clientEntity.getZ(),
        50,
      )
        .filter((entity) => entity) //visibleCells[entity.getX() + ',' + entity.getY()])
        .map((entity) => {
          return {
            _x: entity.getX(),
            _y: entity.getY(),
            _char: entity.getChar(),
            _foreground:
              entity == clientEntity
                ? entity.getBackground()
                : entity.getForeground(),
            _background:
              entity == clientEntity
                ? entity.getForeground()
                : entity.getBackground(),
          }
        })

      let sectionedMap = {
        _width: this.map.getWidth(),
        _height: this.map.getHeight(),
        _tiles: [],
        _offsetX: clientEntity.getX() - range,
        _offsetY: clientEntity.getY() - range,
      }

      for (let x = 0; x < 2 * range + 1; x++) {
        sectionedMap._tiles.push([])
        for (let y = 0; y < 2 * range + 1; y++) {
          if (
            visibleCells[
              `${x + sectionedMap._offsetX},${y + sectionedMap._offsetY}`
            ]
          ) {
            sectionedMap._tiles[x].push(
              this.map.getTile(
                x + sectionedMap._offsetX,
                y + sectionedMap._offsetY,
                clientEntity.getZ(),
              ),
            )
          } else {
            sectionedMap._tiles[x].push(null)
          }
        }
      }

      return JSON.stringify({ map: sectionedMap, entities: compressedEntities })
    } else {
      let compressedEntities = Object.values(this.entities).map((entity) => {
        return {
          _x: entity.getX(),
          _y: entity.getY(),
          _char: entity.getChar(),
          _foreground: entity.getForeground(),
          _background: entity.getBackground(),
        }
      })
      return JSON.stringify({ map: this.map, entities: compressedEntities })
    }
  }
}

function createGameState(clientId) {
  const state = new State()

  let properties = Entities.PlayerTemplate(state)
  properties.clientId = clientId

  console.log(properties)

  let player = new Entity(properties)
  player.setName('Player 1')

  state.addEntityAtRandomPosition(player, 0)

  state.engine.start()

  return state
}

function gameLoop(state) {
  if (!state) {
    return
  }

  // Do stuff with the state

  return false
}

function handleInput(state, clientId, keyCode) {
  let player = Object.values(state.entities)
    .filter((entity) => entity.hasMixin('ClientController'))
    .find((entity) => entity.getClientId() == clientId)

  switch (keyCode) {
    case ROT.KEYS.VK_LEFT:
      player.tryMove(-1, 0, 0, state)
      break
    case ROT.KEYS.VK_RIGHT:
      player.tryMove(1, 0, 0, state)
      break
    case ROT.KEYS.VK_UP:
      player.tryMove(0, -1, 0, state)
      break
    case ROT.KEYS.VK_DOWN:
      player.tryMove(0, 1, 0, state)
      break
    case ROT.KEYS.VK_GREATER_THAN:
      console.log('>')
      player.tryMove(0, 0, 1, state)
      break
    case ROT.KEYS.VK_LESS_THAN:
      console.log('<')
      player.tryMove(0, 0, -1, state)
      break
  }

  console.log('handle input', keyCode)

  console.log('before', player._local_engine._lock, player._global_engine._lock)

  player._local_engine.unlock()
  state.engine.unlock()

  console.log('after', player._local_engine._lock, player._global_engine._lock)
}

function getUpdatedVelocity(keyCode) {
  switch (keyCode) {
    case 37: {
      return { x: -1, y: 0 }
    }
    case 38: {
      return { x: 0, y: -1 }
    }
    case 39: {
      return { x: 1, y: 0 }
    }
    case 40: {
      return { x: 0, y: 1 }
    }
  }
}
