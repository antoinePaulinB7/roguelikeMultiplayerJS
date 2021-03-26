const { Tile } = require('./tile')

class Map {
  constructor(tiles) {
    this._tiles = tiles
    this._width = tiles.length
    this._height = tiles[0].length
  }

  getWidth = () => this._width
  getHeight = () => this._height
  getTile = (x, y) => {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return Tile.nullTile
    } else {
      return this._tiles[x][y] || Tile.nullTile
    }
  }
  getRandomFloorPosition = (state) => {
    let x, y

    do {
      x = Math.floor(Math.random() * this._width)
      y = Math.floor(Math.random() * this._height)
    } while (this.getTile(x, y) != (Tile.floorTile || state.getEntityAt(x, y)))

    return { x: x, y: y }
  }

  dig = (x, y) => {
    if (this.getTile(x, y).isDiggable()) {
      this._tiles[x][y] = Tile.floorTile
    }
  }
}

module.exports = {
  Map,
}
