import './style.css';
import { Display } from 'rot-js';
import tilesheet from './data/Tilesheet/monochrome_transparent_packed.png';

console.log(tilesheet);

const myImage = new Image();

myImage.src = tilesheet;

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

let canvas, ctx;
let gameActive = false;

function init() {
  canvas = document.querySelector('#canvas');
  ctx = canvas.getContext('2d');

  canvas.width = canvas.height = GAME_WIDTH;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener('keydown', keydown);
  gameActive = true;
}

function keydown(event) {

}

init();