'use strict';

const os = require('os');
const child = require('child_process');
const util = require('util');
const exec = util.promisify(child.exec);

const diskInfoByPlatform = {
  darwin: {
    command: 'system_profiler SPNVMeDataType -json',
    getDisk: macInfo,
  },
  win32: {
    command: 'wmic diskdrive get Model',
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
  const model = stdout
    .split('\r\r\n')
    .slice(1, -1)
    .filter(Boolean)
    .map((d) => d.trim());

  return model;
}

function macInfo(stdout) {
  const { SPNVMeDataType } = JSON.parse(stdout);
  const ssds = SPNVMeDataType.map(({ _items }) => _items)
    .flat()
    .map((ssd) => ({ model: ssd.device_model, size: ssd.size }));
  return ssds;
}

module.exports = { getInfo };
