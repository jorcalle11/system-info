'use strict';

const os = require('os');
const child = require('child_process');
const util = require('util');
const exec = util.promisify(child.exec);

async function showSystemInfo() {
  const hostname = os.hostname();
  console.log(`--- System Info - ${hostname} ---`);
  console.log({
    CPU: getCpuInfo(),
    Memory: getMemoryInfo(),
    GPU: await getGpuInfo(),
    Disk: await getDiskInfo(),
  });
}

function getCpuInfo() {
  const cpus = os.cpus();
  const numberOfCores = cpus.length;
  const reference = cpus[0].model;
  return `${reference} x ${numberOfCores}`;
}

function getMemoryInfo(unit = 'gigabytes') {
  const totalOfMemoryInBytes = os.totalmem();
  const totalOfMemory = convertBytes({ bytes: totalOfMemoryInBytes, unit });
  const suffix = unit === 'megabytes' ? 'MB' : 'GB';
  return `${totalOfMemory}${suffix}`;
}

function convertBytes({ bytes = 0, unit = 'gigabytes' }) {
  const kilobyte = 1024;
  const divide = (total) => total / kilobyte;
  let total = 0;

  if (unit === 'megabytes') {
    total = divide(divide(bytes));
  } else {
    total = divide(divide(divide(bytes)));
  }

  return Math.ceil(total);
}

async function getGpuInfo() {
  const platform = os.platform();
  const videoCardsByPlatform = {
    darwin: {
      command: 'system_profiler SPDisplaysDataType -json',
      getVideoCards: getVideoCardsFromMac,
    },
    win32: {
      comand:
        'wmic path Win32_VideoController get AdapterRAM, Name /format:value',
      getVideoCards: getVideoCardsFromWindows,
    },
    linux: { comand: 'sudo lshw -C display' },
  };

  const { command, getVideoCards } = videoCardsByPlatform[platform];
  const { stdout } = await exec(command);
  return getVideoCards(stdout);

  function getVideoCardsFromMac(stdout) {
    const { SPDisplaysDataType = [] } = JSON.parse(stdout);
    const videoCards = SPDisplaysDataType.map((card) => ({
      model: card.sppci_model,
      vendor: card.spdisplays_vendor,
      memory: card?._spdisplays_vram || card.spdisplays_vram,
    }));
    return videoCards;
  }

  async function getVideoCardsFromWindows(stdout) {
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
}

async function getDiskInfo() {
  const platform = os.platform();
  const diskInfoByPlatform = {
    darwin: {
      command: 'system_profiler SPNVMeDataType -json',
      getDisk: getDiskFromMac,
    },
    win32: {
      command: 'wmic diskdrive get Model',
      getDisk: getDiskInfoFromWindows,
    },
    linux: {
      comand: '',
    },
  };

  const { command, getDisk } = diskInfoByPlatform[platform];
  const { stdout } = await exec(command);
  return getDisk(stdout);

  function getDiskInfoFromWindows(stdout) {
    const model = stdout
      .split('\r\r\n')
      .slice(1, -1)
      .filter(Boolean)
      .map((d) => d.trim());

    return model;
  }

  function getDiskFromMac(stdout) {
    const { SPNVMeDataType } = JSON.parse(stdout);
    const ssds = SPNVMeDataType.map(({ _items }) => _items)
      .flat()
      .map((ssd) => ({ model: ssd.device_model, size: ssd.size }));
    return ssds;
  }
}

showSystemInfo();
