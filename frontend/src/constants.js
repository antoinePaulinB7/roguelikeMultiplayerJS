const TILE_WIDTH = 16
const TILE_HEIGHT = 16

const tilesheetData = require('./data/tilesheet_data.json')

const tileMap = {}

for (const [key, value] of Object.entries(tilesheetData)) {
  tileMap[key] = [value.x * TILE_WIDTH, value.y * TILE_HEIGHT]
}

console.log(tileMap)

module.exports = {
  tileWidth: TILE_WIDTH,
  tileHeight: TILE_HEIGHT,
  tileSheetWidth: 768,
  tileSheetHeight: 352,
  tilesheetData,
  tileMap,
}
