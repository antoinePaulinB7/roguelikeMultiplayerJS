const io = require('socket.io')({
  cors: {
    origin: '*',
  },
})

const { initGame, joinGame, gameLoop, handleInput } = require('./game')
const { FRAME_RATE, MAX_PLAYERS } = require('./constants')
const { makeid } = require('./utils')
const ServerMessages = require('./server-messages')

const state = {}
const clientRooms = {}

const logMemory = process.argv.includes('memory')

const port = process.env.PORT || 3000

if (logMemory) {
  setInterval(() => {
    const used = process.memoryUsage()
    console.log('Memory Usage')
    for (let key in used) {
      console.log(
        `${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`,
      )
    }
    console.log(' ')
  }, 1000)
}

io.on('connection', (client) => {
  client.on('keydown', handleKeypress)
  client.on('keypress', handleKeypress)
  client.on('newGame', handleNewGame)
  client.on('joinGame', handleJoinGame)

  function handleJoinGame(gameCode) {
    console.log(`player attempting to join ${gameCode}`)

    console.log(
      io.sockets.adapter.rooms,
      io.sockets.adapter.rooms.get(gameCode),
    )

    const room = io.sockets.adapter.rooms.get(gameCode)

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

  function handleKeypress(keyCode) {
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

    handleInput(state[roomName], client.id, keyCode)
  }
})

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName])

    let clients = io.sockets.adapter.rooms.get(roomName)

    if (!clients) {
      clearInterval(intervalId)
      return
    }

    for (const clientId of clients ? clients : []) {
      if (!winner) {
        emitGameState(clientId, state[roomName])
      } else {
        emitGameOver(clientId, winner)
        state[roomName] = null
        clearInterval(intervalId)
      }
    }
  }, 1000 / FRAME_RATE)
}

function emitGameState(clientId, state) {
  const clientSocket = io.sockets.sockets.get(clientId)
  let stateData = state.getJSON(clientId)

  if (stateData == ServerMessages.PLAYER_DIED) {
    clientSocket.emit('gameOver', '')
    clientSocket.leave(clientRooms[clientSocket.id])
  }
  clientSocket.emit('gameState', state.getJSON(clientId))
}

function emitGameOver(clientId, winner) {
  const clientSocket = io.sockets.sockets.get(clientId)
  clientSocket.emit('gameOver', JSON.stringify({ winner }))
}

io.listen(port)
