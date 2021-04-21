const { MAP_WIDTH, MAP_HEIGHT } = require('./constants')

const { Glyph } = require('./glyph')
const { Tile } = require('./tile')
const { Map } = require('./map')
const { Entities, Mixins } = require('./entities')
const { Items, ItemMixins } = require('./items')

const ROT = require('rot-js')
const { Entity } = require('./entity')
const { Builder } = require('./builder')
const ServerMessages = require('./server-messages')

const Utils = require('./utils')
const { Repository } = require('./repository')
const { Item } = require('./item')

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

    this.entityRepository = new Repository('entities', Entity)
    this.entityRepository.define('fungus', Entities.FungusTemplate(this))
    this.entityRepository.define('bat', Entities.BatTemplate(this))
    this.entityRepository.define('newt', Entities.NewtTemplate(this))

    this.itemRepository = new Repository('items', Item)
    this.itemRepository.define('apple', {
      name: 'apple',
      char: '%',
      foreground: 'red',
      mixins: [ItemMixins.Edible],
    })
    this.itemRepository.define('rock', {
      name: 'rock',
      char: '*',
      foreground: 'grey',
    })

    for (let z = 0; z < this.map.getDepth(); z++) {
      for (let i = 0; i < 15; i++) {
        this.addEntityAtRandomPosition(this.entityRepository.createRandom(), z)
      }

      for (let i = 0; i < 50; i++) {
        this.addItemAtRandomPosition(this.itemRepository.createRandom(), z)
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
    if (entity.hasMixin('PlayerActor')) {
      entity.desyncEntities()
    } else if (entity.hasMixin('Actor')) {
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
        message = ROT.Util.format(message, ...args)
      }
      recipient.receiveMessage(message)
    }
  }

  sendMessageNearby = (x, y, z, message, args) => {
    if (args) {
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

      range = clientEntity.hasMixin('Sight')
        ? clientEntity.getSightRadius()
        : range

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
        range,
      )
        .filter((entity) => visibleCells[entity.getX() + ',' + entity.getY()])
        .map((entity) => {
          return {
            _x: entity.getX(),
            _y: entity.getY(),
            _char: entity.getChar(),
            _foreground: entity.getForeground(),
            _background: entity.getBackground(),
          }
        })

      let sectionedItems = {}

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
          let key = `${x + sectionedMap._offsetX},${y + sectionedMap._offsetY}`
          if (visibleCells[key]) {
            sectionedMap._tiles[x].push(
              this.map.getTile(
                x + sectionedMap._offsetX,
                y + sectionedMap._offsetY,
                clientEntity.getZ(),
              ),
            )

            let items = this.getItemsAt(
              x + sectionedMap._offsetX,
              y + sectionedMap._offsetY,
              clientEntity.getZ(),
            )

            if (items) {
              sectionedItems[key] = items
            }
          } else {
            sectionedMap._tiles[x].push(null)
          }
        }
      }

      return JSON.stringify({
        map: sectionedMap,
        entities: compressedEntities,
        items: sectionedItems,
      })
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

      let mapItems = {}

      for (let x = 0; x < this.map.getWidth(); x++) {
        for (let y = 0; y < this.map.getHeight(); y++) {
          let key = `${x},${y}`

          let items = this.getItemsAt(x, y, clientEntity.getZ())

          if (items) {
            mapItems[key] = items
          }
        }
      }

      return JSON.stringify({
        map: this.map,
        entities: compressedEntities,
        items: mapItems,
      })
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
      player.tryMove(0, 0, 1, state)
      break
    case ROT.KEYS.VK_LESS_THAN:
      player.tryMove(0, 0, -1, state)
      break
    case ROT.KEYS.VK_G:
      let mapItems = state.getItemsAt(
        player.getX(),
        player.getY(),
        player.getZ(),
      )

      if (mapItems) {
        if (!player.pickupItems([0], state)) {
          state.sendMessage(player, 'Your inventory is full.')
        } else {
          console.log(player.getItems())
        }
      } else {
        state.sendMessage(player, 'There is nothing to take here.')
      }

      break
  }

  player._local_engine.unlock()
  state.engine.unlock()
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
