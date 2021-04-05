module.exports = {
  makeid,
  randomize,
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
