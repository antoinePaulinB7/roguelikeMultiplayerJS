const { Glyph } = require('./glyph')

class Tile {
  constructor(tile) {
    this._tile = tile
  }

  getGlyph = () => this._tile
}

Tile.nullTile = new Tile(new Glyph())
Tile.floorTile = new Tile(new Glyph('.'))
Tile.wallTile = new Tile(new Glyph('#', 'goldenrod'))

module.exports = {
  Tile,
}
