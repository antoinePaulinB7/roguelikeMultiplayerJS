const ROT = require('rot-js')
const { Tile } = require('./tile')
const Utils = require('./utils')

class Builder {
  constructor(width, height, depth) {
    this._width = width
    this._height = height
    this._depth = depth
    this._tiles = []
    this._regions = []

    for (let z = 0; z < depth; z++) {
      this._tiles.push(this.generateLevel())
      this._regions.push([])

      for (let x = 0; x < width; x++) {
        this._regions[z].push([])

        for (let y = 0; y < height; y++) {
          this._regions[z][x].push(0)
        }
      }
    }

    for (let z = 0; z < depth; z++) {
      this.setupRegions(z)
    }
    this.connectAllRegions()
  }

  getTiles = () => {
    return this._tiles
  }

  getDepth = () => {
    return this._depth
  }

  getWidth = () => {
    return this._width
  }

  getHeight = () => {
    return this._height
  }

  canFillRegion = (x, y, z) => {
    if (
      x < 0 ||
      y < 0 ||
      z < 0 ||
      x >= this._width ||
      y >= this._height ||
      z >= this._depth
    ) {
      return false
    }

    if (this._regions[z][x][y] != 0) {
      return false
    }

    return this._tiles[z][x][y].isWalkable()
  }

  fillRegion = (region, x, y, z) => {
    let tilesFilled = 1
    let tiles = [{ x: x, y: y }]
    let tile
    let neighbors

    this._regions[z][x][y] = region

    while (tiles.length > 0) {
      tile = tiles.pop()

      neighbors = Utils.getNeighborPositions(tile.x, tile.y)

      while (neighbors.length > 0) {
        tile = neighbors.pop()
        if (this.canFillRegion(tile.x, tile.y, z)) {
          this._regions[z][tile.x][tile.y] = region
          tiles.push(tile)
          tilesFilled++
        }
      }
    }

    return tilesFilled
  }

  removeRegion = (region, z) => {
    for (let x = 0; x < this._width; x++) {
      for (let y = 0; y < this._height; y++) {
        if (this._regions[z][x][y] == region) {
          this._regions[z][x][y] = 0
          this._tiles[z][x][y] = Tile.wallTile
        }
      }
    }
  }

  setupRegions = (z) => {
    let region = 1
    let tilesFilled

    for (let x = 0; x < this._width; x++) {
      for (let y = 0; y < this._height; y++) {
        if (this.canFillRegion(x, y, z)) {
          tilesFilled = this.fillRegion(region, x, y, z)

          if (tilesFilled <= 20) {
            this.removeRegion(region, z)
          } else {
            region++
          }
        }
      }
    }
  }

  findRegionOverlaps = (z, r1, r2) => {
    let matches = []

    for (let x = 0; x < this._width; x++) {
      for (let y = 0; y < this._height; y++) {
        if (
          this._tiles[z][x][y] == Tile.floorTile &&
          this._tiles[z + 1][x][y] == Tile.floorTile &&
          this._regions[z][x][y] == r1 &&
          this._regions[z + 1][x][y] == r2
        ) {
          matches.push({ x: x, y: y })
        }
      }
    }

    return Utils.randomize(matches)
  }

  connectRegions = (z, r1, r2) => {
    let overlap = this.findRegionOverlaps(z, r1, r2)

    if (overlap.length == 0) {
      return false
    }

    let point = overlap[0]
    this._tiles[z][point.x][point.y] = Tile.stairsDown
    this._tiles[z + 1][point.x][point.y] = Tile.stairsUp

    return true
  }

  connectAllRegions = () => {
    for (let z = 0; z < this._depth - 1; z++) {
      let connected = {}
      let key

      for (let x = 0; x < this._width; x++) {
        for (let y = 0; y < this._height; y++) {
          key = this._regions[z][x][y] + ',' + this._regions[z + 1][x][y]

          if (
            this._tiles[z][x][y] == Tile.floorTile &&
            this._tiles[z + 1][x][y] == Tile.floorTile &&
            !connected[key]
          ) {
            this.connectRegions(
              z,
              this._regions[z][x][y],
              this._regions[z + 1][x][y],
            )
            connected[key] = true
          }
        }
      }
    }
  }

  generateLevel = () => {
    let map = []
    for (let x = 0; x < this._width; x++) {
      map.push([])
      for (let y = 0; y < this._height; y++) {
        map[x].push(Tile.nullTile)
      }
    }

    const generator = new ROT.Map.Cellular(this._width, this._height)
    generator.randomize(0.5)
    const totalIterations = 3

    for (let i = 0; i < totalIterations - 1; i++) {
      generator.create()
    }

    function callback(x, y, v) {
      if (v == 1) {
        map[x][y] = Tile.floorTile
      } else {
        map[x][y] = Tile.wallTile
      }
    }

    generator.create(callback)

    return map
  }
}

module.exports = {
  Builder,
}
