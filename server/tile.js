const { Glyph } = require('./glyph')

class Tile extends Glyph {
  constructor(properties) {
    properties = properties || {}
    super(properties)
    this._isWalkable = properties['isWalkable'] || false
    this._isDiggable = properties['isDiggable'] || false
    this._blocksLight =
      properties['blocksLight'] !== undefined ? properties['blocksLight'] : true
  }

  isWalkable = () => this._isWalkable
  isDiggable = () => this._isDiggable
  isBlockingLight = () => this._blocksLight
}

Tile.nullTile = new Tile()

Tile.floorTile = new Tile({
  char: '.',
  foreground: 'darkgrey',
  isWalkable: true,
  blocksLight: false,
})

Tile.wallTile = new Tile({
  char: '#',
  foreground: 'goldenrod',
  isDiggable: true,
})

Tile.stairsUp = new Tile({
  char: '<',
  foreground: 'white',
  isWalkable: true,
  blocksLight: false,
})

Tile.stairsDown = new Tile({
  char: '>',
  foreground: 'white',
  isWalkable: true,
  blocksLight: false,
})

Tile.clearTile = new Tile({
  char: ' ',
  foreground: 'transparent',
  background: 'transparent',
})

module.exports = {
  Tile,
}
