const { Readable } = require("node:stream");
const { pipeline } = require('node:stream/promises');
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { createWriteStream } = require("node:fs");
const { getBlockPartBuffer, readFromFile, saveFile, pathToBlocksFiles } = require("./utils/file");
const { getBlockRange } = require("./utils/utils");

class BlockFactory {
    constructor({ cacheService, s3Client }) {
        this.cacheService = cacheService;
        this.s3Client = s3Client;
    }

    #downloadFileFromS3ToLocal(name) {
        return new Promise(async (resolve, reject) => {
            const getObjectRequest = {
                Bucket: process.env.AWS_BUCKET,
                Key: `${process.env.AWS_PREFIX}/${name}`,
            };
    
            try {
                const response = await this.s3Client.send(new GetObjectCommand(getObjectRequest));
                const dataStream = response.Body;
                const writeFileStream = createWriteStream(`${pathToBlocksFiles()}/${name}`);
    
                await pipeline(dataStream, writeFileStream);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    async #getBlockPartFromLocalFile(fileName, blockPartName) {
        try {
            const fileBuffer = await readFromFile(fileName);
            const blockBuffer = getBlockPartBuffer(fileBuffer, blockPartName);
            return Readable.from(blockBuffer);
        } catch (err) {
            console.error(err);
            throw Error('Failed to get block part from file');
        }
    }

    async getBlockData({ blockNumber, blockHash }) {
        const blockRange = getBlockRange(blockNumber, 100);
        const fileName = `compacted-${blockRange.minBlockNumber}-${blockRange.maxBlockNumber}.json.gz`;

        if (this.cacheService.has(fileName)) {
            const blocksFile = this.cacheService.retrieve(fileName);

            if (!!blocksFile.localFilePromise) {
                await blocksFile.localFilePromise;
            }

            return this.#getBlockPartFromLocalFile(fileName, `${blockNumber}-${blockHash}`);
        }

        try {
            const localFilePromise = this.#downloadFileFromS3ToLocal(fileName);
            this.cacheService.save(fileName, { date: new Date(), localFilePromise });

            await localFilePromise;
            this.cacheService.save(fileName, { date: new Date(), localFilePromise: null });

            return this.#getBlockPartFromLocalFile(fileName, `${blockNumber}-${blockHash}`);
        } catch (err) {
            console.error(err);
            throw Error(err);
        }
    }
}

module.exports = BlockFactory;