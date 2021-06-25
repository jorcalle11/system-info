'use strict';

const os = require('os');

function getInfo() {
  const cpus = os.cpus();
  const numberOfCores = cpus.length;
  const model = cpus[0].model;
  const response = [model, numberOfCores].join(' x ');
  return response;
}

module.exports = {
  getInfo,
};
