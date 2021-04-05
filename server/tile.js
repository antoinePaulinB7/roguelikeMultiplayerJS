const { Glyph } = require('./glyph')

class Tile extends Glyph {
  constructor(properties) {
    properties = properties || {}
    super(properties)
    this._isWalkable = properties['isWalkable'] || false
    this._isDiggable = properties['isDiggable'] || false
  }

  isWalkable = () => this._isWalkable
  isDiggable = () => this._isDiggable
}

Tile.nullTile = new Tile()

Tile.floorTile = new Tile({
  char: '.',
  foreground: 'darkgrey',
  isWalkable: true,
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
})

Tile.stairsDown = new Tile({
  char: '>',
  foreground: 'white',
  isWalkable: true,
})

module.exports = {
  Tile,
}
