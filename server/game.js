const { GRID_SIZE } = require('./constants')

const { Glyph } = require('./glyph')
const { Tile } = require('./tile')
const { Map } = require('./map')
const { Entities, Mixins } = require('./entities')

const ROT = require('rot-js')
const { Entity } = require('./entity')

let a = new Glyph('b', 'red', 'black')

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
  for (let x = 0; x < 80; x++) {
    map.push([])
    for (let y = 0; y < 50; y++) {
      map[x].push(Tile.nullTile)
    }
  }

  const generator = new ROT.Map.Cellular(80, 50)
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
      this.addEntityAtRandomPosition(new Entity(Entities.FungusTemplate))
    }
  }

  getEntityAt = (x, y) => {
    for (let entity of this.entities) {
      if (entity.getX() == x && entity.getY() == y) {
        return entity
      }
    }
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

  addEntityAtRandomPosition = (entity) => {
    let { x, y } = this.map.getRandomFloorPosition(this)
    entity.setX(x)
    entity.setY(y)
    this.addEntity(entity)
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
  // console.log(ROT.DIRS[4])

  let player = state.entities
    .filter((entity) => entity.hasMixin('ClientController'))
    .find((entity) => entity.getClientId() == clientId)

  // player.tryMove()

  // console.log(player)

  // player.tryMove(1, 0, state)

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
