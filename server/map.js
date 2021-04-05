const { Tile } = require('./tile')

class Map {
  constructor(tiles) {
    console.log(tiles.length, tiles[0].length, tiles[0][0].length)
    this._tiles = tiles
    this._depth = tiles.length
    this._width = tiles[0].length
    this._height = tiles[0][0].length
  }

  getWidth = () => this._width
  getHeight = () => this._height
  getDepth = () => this._depth
  getTile = (x, y, z = 0) => {
    if (
      x < 0 ||
      x >= this._width ||
      y < 0 ||
      y >= this._height ||
      z < 0 ||
      z >= this._depth
    ) {
      return Tile.nullTile
    } else {
      return this._tiles[z][x][y] || Tile.nullTile
    }
  }
  getRandomFloorPosition = (state, z) => {
    let x, y

    do {
      x = Math.floor(Math.random() * this._width)
      y = Math.floor(Math.random() * this._height)
    } while (!state.isEmptyFloor(x, y, z))

    return { x: x, y: y, z: z }
  }

  dig = (x, y, z) => {
    if (this.getTile(x, y, z).isDiggable()) {
      this._tiles[z][x][y] = Tile.floorTile
    }
  }
}

module.exports = {
  Map,
}
