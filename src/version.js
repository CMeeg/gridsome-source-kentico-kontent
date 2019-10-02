const fs = require('fs');
const path = require('path');

function getVersion() {
  let version = '0.0.0';

  const genversionPath = path.resolve(__dirname, './genversion.js');

  if (fs.existsSync(genversionPath)) {
    version = require('./genversion');
  }

  return version;
}

module.exports = getVersion();
