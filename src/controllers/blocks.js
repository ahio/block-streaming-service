const { pipeline } = require('node:stream/promises');
const zlib = require("zlib");
const BlockService = require('../services/blocks');
const CacheService = require('../cache/cacheService');
const S3Client = require('../services/s3/client');

async function getBlockData(req, res) {
    const blockNumber = req.params.blockNumber;
    const blockHash = req.params.blockHash;
    const blockService = new BlockService({
        cacheService: CacheService,
        s3Client: S3Client
    });

    try {
        const fileStream = await blockService.getBlockData({ blockNumber, blockHash }, CacheService);
        const gunzipStream = zlib.createGunzip();

        await pipeline(fileStream, gunzipStream, res);
    } catch (err) {
        console.error('Pipeline failed', err);
        res.writeHead(500);
        res.end('Internal Server Error');
    }
}

module.exports = {
    getBlockData,
}