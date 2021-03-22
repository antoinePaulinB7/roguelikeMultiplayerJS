const io = require('socket.io')({
  cors: {
    origin: '*',
  },
})

const { initGame, joinGame, gameLoop, handleInput } = require('./game')
const { FRAME_RATE, MAX_PLAYERS } = require('./constants')
const { makeid } = require('./utils')

const state = {}
const clientRooms = {}

io.on('connection', (client) => {
  client.on('keydown', handleKeydown)
  client.on('newGame', handleNewGame)
  client.on('joinGame', handleJoinGame)

  function handleJoinGame(gameCode) {
    console.log(`player attempting to join ${gameCode}`)

    console.log(
      io.sockets.adapter.rooms,
      io.sockets.adapter.rooms.get(gameCode),
    )

    const room = io.sockets.adapter.rooms.get(gameCode)

    console.log(room)

    let allUsers
    if (!room) {
      client.emit('unknownGame')
      return
    } else if (room.size > MAX_PLAYERS - 1) {
      client.emit('tooManyPlayers')
      return
    }

    clientRooms[client.id] = gameCode

    client.join(gameCode)
    client.number = 2
    client.emit('init', 2)

    client.emit('gameCode', gameCode)

    joinGame(state[gameCode], client.id)
  }

  function handleNewGame() {
    let roomName = makeid(5)
    clientRooms[client.id] = roomName
    client.emit('gameCode', roomName)

    state[roomName] = initGame(client.id)

    console.log(`player creating ${roomName}`)

    client.join(roomName)
    client.number = 1
    client.emit('init', 1)

    startGameInterval(roomName)
  }

  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id]

    if (!roomName) {
      return
    }

    try {
      keyCode = parseInt(keyCode)
    } catch (error) {
      console.log(error)
      return
    }

    console.log(client.id, keyCode)

    handleInput(state[roomName], client.id, keyCode)
  }
})

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName])

    if (!winner) {
      emitGameState(roomName, state[roomName])
    } else {
      emitGameOver(roomName, winner)
      state[roomName] = null
      clearInterval(intervalId)
    }
  }, 1000 / FRAME_RATE)
}

function emitGameState(roomName, state) {
  io.sockets.in(roomName).emit('gameState', JSON.stringify(state))
}

function emitGameOver(roomName, winner) {
  io.sockets.in(roomName).emit('gameOver', JSON.stringify({ winner }))
}

io.listen('3000')
