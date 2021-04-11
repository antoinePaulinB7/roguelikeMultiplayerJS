const ROT = require('rot-js')

module.exports = {
  makeid,
  randomize,
  getNeighborPositions,
  distance,
}

function makeid(length) {
  var result = ''
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

function randomize(array) {
  let t,
    j,
    ret = array.slice(0),
    i = ret.length
  while (--i > 0) {
    t = ret[(j = Math.round(Math.random() * i))]
    ret[j] = ret[i]
    ret[i] = t
  }
  return ret
}

function getNeighborPositions(x, y) {
  let tiles = []
  let dirs = ROT.DIRS[8]

  for (let dir of dirs) {
    tiles.push({ x: x + dir[0], y: y + dir[1] })
  }

  return randomize(tiles)
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}
