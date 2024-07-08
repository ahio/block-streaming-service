require('dotenv').config();
const fs = require('node:fs');
const checkConfig = require('./check_config');
const appStart = require('./app');
const path = require('node:path');

checkConfig()
  .then(() => {
    const pathToDir = path.join(__dirname, '../', 'files/blocks')
    if (!fs.existsSync(pathToDir)) {
      fs.mkdirSync(pathToDir, { recursive: true });
    }
  })
  .then(appStart)
  .catch((error) => {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  });