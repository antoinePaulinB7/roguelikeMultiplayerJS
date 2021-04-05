const { MAP_WIDTH, MAP_HEIGHT } = require('./constants')

const { Glyph } = require('./glyph')
const { Tile } = require('./tile')
const { Map } = require('./map')
const { Entities, Mixins } = require('./entities')

const ROT = require('rot-js')
const { Entity } = require('./entity')
const ServerMessages = require('./server-messages')

const { randomize } = require('./utils')

const sprintf = require('sprintf-js').sprintf
const vsprintf = require('sprintf-js').vsprintf

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

  state.addEntityAtRandomPosition(player)
}

function generateMap() {
  let map = []
  for (let x = 0; x < MAP_WIDTH; x++) {
    map.push([])
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[x].push(Tile.nullTile)
    }
  }

  const generator = new ROT.Map.Cellular(MAP_WIDTH, MAP_HEIGHT)
  generator.randomize(0.5)
  const totalIterations = 3

  for (let i = 0; i < totalIterations - 1; i++) {
    generator.create()
  }

  function callback(x, y, v) {
    if (v === 1) {
      map[x][y] = Tile.floorTile
    } else {
      map[x][y] = Tile.wallTile
    }
  }

  generator.create(callback)

  return new Map(map)
}

class State {
  constructor() {
    this.map = generateMap()
    this.entities = []
    this.scheduler = new ROT.Scheduler.Simple()
    this.engine = new ROT.Engine(this.scheduler)

    for (let i = 0; i < 10; i++) {
      this.addEntityAtRandomPosition(new Entity(Entities.FungusTemplate(this)))
    }
  }

  getEntityAt = (x, y) => {
    for (let entity of this.entities) {
      if (entity.getX() == x && entity.getY() == y) {
        return entity
      }
    }

    return null
  }

  isEmptyFloor = (x, y) => {
    return this.map.getTile(x, y) == Tile.floorTile && !this.getEntityAt(x, y)
  }

  addEntity = (entity) => {
    if (
      entity.getX() < 0 ||
      entity.getX() >= this.map.getWidth() ||
      entity.getY() < 0 ||
      entity.getY() >= this.map.getHeight()
    ) {
      throw new Error('Adding entity out of bounds.')
    }

    this.entities.push(entity)

    if (entity.hasMixin('Actor')) {
      this.scheduler.add(entity, true)
    }
  }

  removeEntity = (entity) => {
    this.entities = this.entities.filter((en) => en != entity)

    if (entity.hasMixin('Actor')) {
      this.scheduler.remove(entity)
    }

    if (entity.hasMixin('ClientController')) {
    }
  }

  addEntityAtRandomPosition = (entity) => {
    let { x, y } = this.map.getRandomFloorPosition(this)
    entity.setX(x)
    entity.setY(y)
    this.addEntity(entity)
  }

  sendMessage = (recipient, message, args) => {
    if (recipient.hasMixin('MessageRecipient')) {
      if (args) {
        message = vsprintf(message, args)
      }
      recipient.receiveMessage(message)
    }
  }

  sendMessageNearby = (x, y, message, args) => {
    if (args) {
      message = vsprintf(message, args)
    }

    let entitiesNearby = this.getEntitiesWithin(x, y, 5)
    for (let entity of entitiesNearby) {
      if (entity.hasMixin('MessageRecipient')) {
        entity.receiveMessage(message)
      }
    }
  }

  getNeighborPositions = (x, y) => {
    let tiles = []
    let dirs = ROT.DIRS[8]

    for (let dir of dirs) {
      tiles.push({ x: x + dir[0], y: y + dir[1] })
    }

    return randomize(tiles)
  }

  getEntitiesWithin = (x, y, range) => {
    let entitiesWithin = this.entities.filter(
      (entity) =>
        entity.getX() >= x - range &&
        entity.getX() <= x + range &&
        entity.getY() >= y - range &&
        entity.getY() <= y + range,
    )

    return entitiesWithin
  }

  getJSON = (clientId, range = 4) => {
    if (clientId) {
      let clientEntity = this.entities.find(
        (entity) =>
          entity.hasMixin('ClientController') &&
          entity.getClientId() == clientId,
      )

      if (!clientEntity) {
        return ServerMessages.PLAYER_DIED
      }

      let compressedEntities = this.getEntitiesWithin(
        clientEntity.getX(),
        clientEntity.getY(),
        range,
      ).map((entity) => {
        return {
          _x: entity.getX(),
          _y: entity.getY(),
          _char: entity.getChar(),
          _foreground: entity.getForeground(),
          _background: entity.getBackground(),
        }
      })

      let sectionedMap = {
        _width: this.map.getWidth(),
        _height: this.map.getHeight(),
        _tiles: [],
        _offsetX: clientEntity.getX() - range,
        _offsetY: clientEntity.getY() - range,
      }

      for (let x = 0; x < 9; x++) {
        sectionedMap._tiles.push([])
        for (let y = 0; y < 9; y++) {
          sectionedMap._tiles[x].push(
            this.map.getTile(
              x + sectionedMap._offsetX,
              y + sectionedMap._offsetY,
            ),
          )
        }
      }

      return JSON.stringify({ map: sectionedMap, entities: compressedEntities })
    } else {
      let compressedEntities = this.entities.map((entity) => {
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

  state.addEntityAtRandomPosition(player)

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
  let player = state.entities
    .filter((entity) => entity.hasMixin('ClientController'))
    .find((entity) => entity.getClientId() == clientId)

  switch (keyCode) {
    case ROT.KEYS.VK_LEFT:
      player.tryMove(-1, 0, state)
      break
    case ROT.KEYS.VK_RIGHT:
      player.tryMove(1, 0, state)
      break
    case ROT.KEYS.VK_UP:
      player.tryMove(0, -1, state)
      break
    case ROT.KEYS.VK_DOWN:
      player.tryMove(0, 1, state)
      break
  }

  state.engine.unlock()
  console.log(state.entities.length)
  console.log(state.getNeighborPositions(player.getX(), player.getY()))
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
