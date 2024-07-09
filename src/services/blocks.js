const { pipeline } = require('node:stream/promises');
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { createWriteStream } = require("node:fs");
const { 
    pathToBlocksFiles,
    readFileStream, 
    readFileHeader, 
    getCompactedFileName, 
    readFile, 
    checkFileExist
} = require("./utils/file");
const { getBlockRange } = require("./utils/utils");

class BlockFactory {
    constructor({ cacheService, s3Client }) {
        this.cacheService = cacheService;
        this.s3Client = s3Client;
    }

    #downloadFileToLocalStorage(name) {
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

    #downloadAndParseFile(blockRange) {
        return new Promise(async (resolve, reject) => {
            const fileName = getCompactedFileName(blockRange);
            try {
                await this.#downloadFileToLocalStorage(fileName);
                const fileBuffer = await readFile(fileName);
                const blockMapping = readFileHeader(fileBuffer);
                this.cacheService.save(`${blockRange}-mapping`, blockMapping);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    async #getBlockPartFromLocalFile(blockRange, blockKey) {
        try {
            const fileName = getCompactedFileName(blockRange);
            const blockKeys = this.cacheService.retrieve(`${blockRange}-mapping`);
            const blockPosition = blockKeys.get(blockKey);
            return await readFileStream(fileName, blockPosition.start, blockPosition.end);
        } catch (err) {
            console.error('Failed to get block part from file');
            throw err;
        }
    }

    async getBlockData({ blockNumber, blockHash }) {
        const range = getBlockRange(blockNumber, 100);
        const blockRange = `${range.minBlockNumber}-${range.maxBlockNumber}`;

        // new request to the same file, but file still downloading
        if (this.cacheService.has(`${blockRange}-promise`)) {
            const fileDownloadPromise = this.cacheService.retrieve(`${blockRange}-promise`);
            await fileDownloadPromise;

            return this.#getBlockPartFromLocalFile(blockRange, `${blockNumber}-${blockHash}`);
        }


        if (this.cacheService.has(`${blockRange}-mapping`)) {
            const fileExist = await checkFileExist(getCompactedFileName(blockRange));
            if (fileExist) {
                return this.#getBlockPartFromLocalFile(blockRange, `${blockNumber}-${blockHash}`)
            }
        }

        try {
            const fileDownloadPromise = this.#downloadAndParseFile(blockRange);
            this.cacheService.save(`${blockRange}-promise`, fileDownloadPromise );
            await fileDownloadPromise;
            this.cacheService.delete(`${blockRange}-promise`);
        } catch (err) {
            console.error(err);
            throw Error('Failed to download file');
        }

        return this.#getBlockPartFromLocalFile(blockRange, `${blockNumber}-${blockHash}`);
    }
}

module.exports = BlockFactory;