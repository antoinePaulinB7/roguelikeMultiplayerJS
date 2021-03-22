const { GRID_SIZE } = require('./constants')

const { Glyph } = require('./glyph')
const { Tile } = require('./tile')
const { Map } = require('./map')
const { Entities, Mixins } = require('./entities')

const ROT = require('rot-js')
const { Entity } = require('./entity')

let a = new Glyph('b', 'red', 'black')

console.log(ROT)

console.log(a)

console.log(Tile.floorTile)

module.exports = {
  initGame,
  gameLoop,
  handleInput,
}

function initGame(clientId) {
  const state = createGameState(clientId)
  return state
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

function createGameState(clientId) {
  const map = generateMap()

  const entities = []

  let properties = Entities.playerTemplate
  properties.clientId = clientId

  let player = new Entity(properties)
  player.setName('Player 1')

  let { x, y } = map.getRandomFloorPosition()

  player.setX(x)
  player.setY(y)

  console.log(player)

  entities.push(player)

  return {
    map,
    entities,
  }
}

function gameLoop(state) {
  if (!state) {
    return
  }

  // Do stuff with the state

  return false
}

function handleInput(state, clientId, keyCode) {
  console.log(ROT.DIRS[4])

  let player = state.entities.find((entity) => entity.getClientId() == clientId)

  // player.tryMove()
  console.log(player)
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
