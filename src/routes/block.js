const { blocksController } = require("../controllers");

module.exports = (router) => {
	router.get('/block/:blockNumber/:blockHash', blocksController.getBlockData);
}