'use strict';

const os = require('os');
const lib = require('./lib');

async function showSystemInfo() {
  const hostname = os.hostname();
  console.log(`--- System Info - ${hostname} ---`);

  return {
    CPU: lib.cpu.getInfo(),
    RAM: lib.ram.getInfo(),
    GPU: await lib.gpu.getInfo(),
    Disk: await lib.ssd.getInfo(),
  };
}

showSystemInfo()
  .then(console.log)
  .catch((error) => {
    console.error(error.message);
    console.error(error.stack);
  });
