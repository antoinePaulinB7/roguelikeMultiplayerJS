import './style.css';
import * as ROT from 'rot-js' ;
import tilesheet from './data/Tilesheet/monochrome_transparent_packed.png';

console.log(tilesheet);

const myImage = new Image();

myImage.src = tilesheet;

var options = {
  layout: "tile", //layout: "tile-gl", need to figure out why this doesn't work
  bg: "transparent",
  tileWidth: 16,
  tileHeight: 16,
  tileSet: myImage,
  tileColorize: true,
  tileMap: {
      "@": [0, 0],
      "#": [0, 16],
      "a": [0, 32],
      "!": [0, 48]
  },
  width: 3,
  height: 3
}

var display = new ROT.Display(options);

document.querySelector('#game-container').appendChild(display.getContainer());

myImage.onload = function() {
  display.draw(0, 1, "!", "rgba(255, 255, 255, 1)");
  display.draw(0, 2, "#", "rgba(255, 0, 255, 1.0)");
}

document.querySelector('#game-container').appendChild(myImage);

// let tilesheet;

const tilesheetElement = document.querySelector('#tilesheet');
tilesheetElement.addEventListener('change', handleTilesheet);

function handleTilesheet() {
  const fileList = this.files;
  const file = fileList[0];

  if (!file.type.startsWith('image/png')){ return; }

  console.log(file);
}

const GAME_WIDTH = 512;
const BG_COLOR = "#333333";

let gameActive = false;

function init() {
  document.addEventListener('keydown', keydown);
  gameActive = true;
}

function keydown(event) {

}

init();