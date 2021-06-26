'use strict';

const os = require('os');
const child = require('child_process');
const util = require('util');
const exec = util.promisify(child.exec);
const { convertBytes } = require('./utils');

const diskInfoByPlatform = {
  darwin: {
    command: 'system_profiler SPNVMeDataType -json',
    getDisk: macInfo,
  },
  win32: {
    command: 'wmic diskdrive get Model, Size /format:value',
    getDisk: windowsInfo,
  },
  linux: {
    command: '',
  },
};

async function getInfo() {
  const platform = os.platform();
  const { command, getDisk } = diskInfoByPlatform[platform];
  const { stdout } = await exec(command);
  return getDisk(stdout);
}

function windowsInfo(stdout) {
  const disks = stdout.split('\r\r\n').slice(1, -1).filter(Boolean);
  const ssds = [];
  const unit = 'gb';
  const mapping = {
    model: 'Model',
    size: 'Size',
  };
  const numberOfParams = Object.keys(mapping).length;

  while (disks.length) {
    const disk = disks.splice(0, numberOfParams);
    const ssd = {};

    for (const diskInfo of disk) {
      let [name, value] = diskInfo.split('=');
      const key = Object.keys(mapping).find((k) => mapping[k] === name);

      if (mapping.size === name) {
        const memorySizeInBytes = +value;
        const memorySize = convertBytes({ bytes: memorySizeInBytes, unit });
        value = [memorySize, unit.toUpperCase()].join(' ');
      }

      ssd[key] = value;
    }
    ssds.push(ssd);
  }

  return ssds;
}

function macInfo(stdout) {
  const { SPNVMeDataType } = JSON.parse(stdout);
  const ssds = SPNVMeDataType.map(({ _items }) => _items)
    .flat()
    .map((ssd) => ({ model: ssd.device_model, size: ssd.size }));
  return ssds;
}

module.exports = { getInfo };
