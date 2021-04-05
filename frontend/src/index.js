import './style.css'
import * as Constants from './constants'
import * as Utils from './utils'
import * as ROT from 'rot-js'
import { io } from 'socket.io-client'
import tilesheet from './data/Tilesheet/monochrome_transparent_packed.png'

console.log(tilesheet)

const myImage = new Image()

myImage.src = tilesheet

var fontOptions = {
  bg: 'black',
  width: Constants.mapWidth,
  height: Constants.mapHeight,
}

var options = {
  layout: 'tile-gl',
  bg: 'transparent',
  tileWidth: 16,
  tileHeight: 16,
  tileSet: myImage,
  tileColorize: true,
  tileMap: Constants.tileMap,
  width: Constants.mapWidth,
  height: Constants.mapHeight,
}

var display = new ROT.Display(options)

options.bg = '#030303'

var backgroundDisplay = new ROT.Display(options)

window.display = display

document
  .querySelector('#game-container')
  .append(backgroundDisplay.getContainer())
document.querySelector('#game-container').append(display.getContainer())

myImage.onload = function () {
  // display.draw(0, 1, 'broken_ground_4', 'rgba(255, 255, 255, 1)')
  // display.draw(0, 2, 'grass_1', 'rgba(255, 0, 255, 1.0)')
  // display.draw(1, 2, 'grass_2', 'rgba(255, 0, 255, 1.0)')
  // display.draw(1, 1, 'road_1_two_way', 'rgba(255, 255, 255, 1)')
  // display.draw(1, 0, 'blank', 'rgba(255, 255, 255, 1)')
  // display.draw(2, 2, 'road_1_three_way', 'rgba(255, 0, 255, 1.0)')
}

myImage.classList.add('tilesheet-image')
myImage.id = 'tilesheet-image'

window.myImage = myImage

document.querySelector('#tilesheet-selection').appendChild(myImage)

window.Constants = Constants

let tileX, tileY

myImage.addEventListener('mousemove', (event) => {
  let rect = myImage.getBoundingClientRect()

  let xValue = Utils.mapNumber(event.layerX, rect.left, rect.right, 0, 1.0)
  let yValue = Utils.mapNumber(event.layerY, rect.top, rect.bottom, 0, 1.0)

  tileX = Math.floor(xValue * (Constants.tileSheetWidth / Constants.tileWidth))
  tileY = Math.floor(
    yValue * (Constants.tileSheetHeight / Constants.tileHeight),
  )

  let name = Object.keys(Constants.tilesheetData).find((key) => {
    let value = Constants.tilesheetData[key]

    return value.x === tileX && value.y === tileY
  })
})

const tilesheetElement = document.querySelector('#tilesheet')
tilesheetElement.addEventListener('change', handleTilesheet)

function handleTilesheet() {
  const fileList = this.files
  const file = fileList[0]

  if (!file.type.startsWith('image/png')) {
    return
  }

  console.log(file)
}

document.querySelectorAll('[data-toggle]').forEach((element) => {
  element.addEventListener('click', (event) => {
    document
      .querySelector(`#${event.currentTarget.dataset.toggle}`)
      .classList.toggle('is-active')
  })
})

const socket = io('http://192.168.0.34:3000')

socket.on('init', handleInit)
socket.on('gameState', handleGameState)
socket.on('gameOver', handleGameOver)
socket.on('gameCode', handleGameCode)
socket.on('unknownGame', handleUnknownGame)
socket.on('tooManyPlayers', handleTooManyPlayers)

const gameScreen = document.querySelector('#game-screen')
const initialScreen = document.querySelector('#initial-screen')
const newGameButton = document.querySelector('#new-game-button')
const joinGameButton = document.querySelector('#join-game-button')
const gameCodeInput = document.querySelector('#game-code-input')
const gameCodeDisplay = document.querySelector('#game-code-display')

newGameButton.addEventListener('click', newGame)
joinGameButton.addEventListener('click', joinGame)

function newGame() {
  socket.emit('newGame')
  init()
}

function joinGame() {
  const code = gameCodeInput.value
  socket.emit('joinGame', code)
  init()
}

let canvas, ctx
let playerNumber
let gameActive = false

function init() {
  initialScreen.style.display = 'none'
  gameScreen.style.display = 'block'

  document.addEventListener('keydown', keydown)
  document.addEventListener('keypress', keypress)
  gameActive = true
}

function keydown(event) {
  socket.emit('keydown', event.keyCode)
}

function keypress(event) {
  socket.emit('keypress', event.charCode)
}

function clearDisplay() {
  console.log(display.getOptions().width, display.getOptions().height)

  for (let x = 0; x < display.getOptions().width; x++) {
    for (let y = 0; y < display.getOptions().height; y++) {
      display.draw(x, y, 'blank', 'transparent', 'transparent')
    }
  }
}

function paintGame(state) {
  const map = state.map

  display.clear()

  for (let x = 0; x < map._tiles.length; x++) {
    for (let y = 0; y < map._tiles[x].length; y++) {
      backgroundDisplay.draw(
        x + (map._offsetX || 0),
        y + (map._offsetY || 0),
        map._tiles[x][y]._char,
        '#222222',
        'transparent',
      )
      display.draw(
        x + (map._offsetX || 0),
        y + (map._offsetY || 0),
        map._tiles[x][y]._char,
        map._tiles[x][y]._foreground,
        map._tiles[x][y]._background,
      )
    }
  }

  const entities = state.entities

  for (let entity of entities) {
    display.draw(
      entity._x,
      entity._y,
      entity._char,
      entity._foreground,
      entity._background,
    )
  }
}

function handleInit(number) {
  playerNumber = number
}

function handleGameState(gameState) {
  if (!gameActive) {
    return
  }

  gameState = JSON.parse(gameState)

  requestAnimationFrame(() => paintGame(gameState))
}

function handleGameOver(data) {
  if (!gameActive) {
    return
  }

  // data = JSON.parse(data)

  // if (data.winner === playerNumber) {
  //   alert('You win')
  // } else {
  //   alert('You lose')
  // }

  gameActive = false

  alert('Game Over!')

  reset()
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode
}

function handleUnknownGame() {
  reset()
  alert('Unknown game code')
}

function handleTooManyPlayers() {
  reset()
  alert('This game is already in progress')
}

function reset() {
  playerNumber = null
  gameCodeInput.value = ''
  gameCodeDisplay.innerText = ''
  initialScreen.style.display = 'block'
  gameScreen.style.display = 'none'
}
