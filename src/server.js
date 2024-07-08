require('dotenv').config();
const checkConfig = require('./check_config');
const appStart = require('./app');

checkConfig()
  .then(appStart)
  .catch((error) => {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  });