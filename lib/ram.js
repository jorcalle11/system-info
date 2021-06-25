'use strict';

const os = require('os');
const { convertBytes, validateUnit } = require('./utils');

function getInfo(unit = 'gb') {
  validateUnit(unit);

  const totalOfMemoryInBytes = os.totalmem();
  const totalOfMemory = convertBytes({ bytes: totalOfMemoryInBytes, unit });
  const response = [totalOfMemory, unit.toUpperCase()].join(' ');
  return response;
}

module.exports = { getInfo };
