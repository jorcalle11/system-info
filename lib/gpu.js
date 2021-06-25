'use strict';

const os = require('os');
const child = require('child_process');
const util = require('util');
const exec = util.promisify(child.exec);

const { convertBytes } = require('./utils');

const videoCardsByPlatform = {
  darwin: {
    command: 'system_profiler SPDisplaysDataType -json',
    getVideoCards: macInfo,
  },
  win32: {
    command:
      'wmic path Win32_VideoController get AdapterRAM, Name /format:value',
    getVideoCards: windowsInfo,
  },
  linux: { command: 'sudo lshw -C display' },
};

async function getInfo() {
  const platform = os.platform();
  const { command, getVideoCards } = videoCardsByPlatform[platform];
  const { stdout } = await exec(command);
  return getVideoCards(stdout);
}

function macInfo(stdout) {
  const { SPDisplaysDataType = [] } = JSON.parse(stdout);
  const videoCards = SPDisplaysDataType.map((card) => ({
    model: card.sppci_model,
    vendor: card.spdisplays_vendor,
    memory: card?._spdisplays_vram || card.spdisplays_vram,
  }));
  return videoCards;
}

async function windowsInfo(stdout) {
  let displayAdapters = stdout.split('\r\r\n').slice(1, -1).filter(Boolean);

  const videoCards = [];

  while (displayAdapters.length) {
    const videoCard = displayAdapters.splice(0, 2).reverse();
    const card = [];

    for (const cardInfo of videoCard) {
      let [, value] = cardInfo.split('=');

      if (Number.isInteger(+value)) {
        const memorySize = convertBytes({
          bytes: +value,
          unit: 'gigabytes',
        });

        value = `${memorySize}GB`;
      }

      card.push(value);
    }

    videoCards.push(card.join(' '));
  }

  return videoCards;
}

module.exports = { getInfo };
