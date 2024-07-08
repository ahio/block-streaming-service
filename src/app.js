const process = require('node:process');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const router = express.Router();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

require('./routes/block')(router);
app.use(router);

app.use((err, req, res, next) => {
	console.error(err);
	res.sendStatus(500);
});

process.on('unhandledRejection', (reason, promise) => {
	console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

const appStart = async (APP_PORT = 3001) => {
	return new Promise((resolve, reject) => {
		app.listen(APP_PORT)
			.once('listening', () => {
				console.log(`The application is running on localhost:${APP_PORT}`);
				resolve();
			})
			.once('error', reject);
	});
}

module.exports = appStart;
