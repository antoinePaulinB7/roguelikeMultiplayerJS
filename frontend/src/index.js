import './style.css';
import * as Constants from './constants';
import * as Utils from './utils';
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
  tileMap: Constants.tileMap,
  width: 32,
  height: 24
}

var display = new ROT.Display(options);

window.display = display;

document.querySelector('#game-container').append(display.getContainer());

myImage.onload = function() {
  display.draw(0, 1, "broken_ground_4", "rgba(255, 255, 255, 1)");
  display.draw(0, 2, "grass_1", "rgba(255, 0, 255, 1.0)");
  display.draw(1, 2, "grass_2", "rgba(255, 0, 255, 1.0)");
  display.draw(1, 1, "road_1_two_way", "rgba(255, 255, 255, 1)");
  display.draw(1, 0, "blank", "rgba(255, 255, 255, 1)");
  display.draw(2, 2, "road_1_three_way", "rgba(255, 0, 255, 1.0)");
}

myImage.classList.add('tilesheet-image');
myImage.id = 'tilesheet-image';

window.myImage = myImage;

document.querySelector('#tilesheet-selection').appendChild(myImage);

window.Constants = Constants;

let tileX, tileY

myImage.addEventListener('mousemove', (event) => {
  let rect = myImage.getBoundingClientRect();

  let xValue = Utils.mapNumber(event.layerX, rect.left, rect.right, 0, 1.0);
  let yValue = Utils.mapNumber(event.layerY, rect.top, rect.bottom, 0, 1.0);

  tileX = Math.floor(xValue * (Constants.tileSheetWidth / Constants.tileWidth));
  tileY = Math.floor(yValue * (Constants.tileSheetHeight / Constants.tileHeight));

  let name = Object.keys(Constants.tilesheetData).find((key) => {
    let value = Constants.tilesheetData[key];
    
    return value.x === tileX && value.y === tileY;
  });
});

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

document.querySelectorAll('[data-toggle]').forEach((element) => {
  element.addEventListener('click', (event) => {
    document.querySelector(`#${event.currentTarget.dataset.toggle}`).classList.toggle('is-active');
  });
});