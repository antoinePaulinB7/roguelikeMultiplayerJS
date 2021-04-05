const ROT = require('rot-js')

class Builder {
  constructor(width, height, depth) {
    this._width = width
    this._height = height
    this._depth = depth
    this._tiles = new Array(depth)
    this._regions = new Array(depth)
  }

  generateLevel = () => {
    let map = new Array(this._width)

    for (let i = 0; i < map.length; i++) {
      map[i] = new Array(this._height)
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

    // here

    return map
  }
}
