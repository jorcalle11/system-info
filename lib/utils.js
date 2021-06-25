'use strict';

function validateUnit(unit = throwErrorIfNotGiven('unit')) {
  const validUnits = ['mb', 'gb'];

  if (!validUnits.includes(unit)) {
    throw new Error(`invalid unit. Valid options are ${validUnits.join(',')}`);
  }
}

function convertBytes({ bytes = 0, unit = 'gb' }) {
  const kilobyte = 1024;
  const divide = (total) => total / kilobyte;

  const totalByUnit = {
    mb: divide(divide(bytes)),
    gb: divide(divide(divide(bytes))),
  };

  const total = totalByUnit[unit] || 0;
  return Math.ceil(total);
}

function throwErrorIfNotGiven(name = '') {
  throw new Error(`${name} parameter is required`);
}

module.exports = { validateUnit, convertBytes };
