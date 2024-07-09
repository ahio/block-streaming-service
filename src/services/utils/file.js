const path = require("node:path");
const fs = require('node:fs');

// FileHeader
// <header start> [8 bytes, uint64, header total length] [2 bytes, uint16, number of blocks] [2 bytes, uint16, hash lenght] {[32 bytes, BlockPosition]* N blocks}<header end>

// BlockPosition
// [8 bytes, uint64, block number] [8 bytes, block hash] [8 bytes, uint64, byte for block start offset] [8 bytes, uint64, byte for block end offset]


//bytes
const HEADER_DATA_SIZE = {
    HEADER_LENGTH: 8,
    NUMBER_OF_BLOCKS: 2,
    BLOCK_HASH_LENGTH: 2,
    BLOCK_NUMBER_LENGTH: 8,
    BLOCK_START_POSITION_LENGTH: 8,
    BLOCK_END_POSITION_LENGTH: 8,
  };
  
function readFileHeader(buffer) {
    // Read the header length (first 8 bytes), number of blocks (next 2 bytes) and block hash length (next 2 bytes)
    const headerStartLength = HEADER_DATA_SIZE.HEADER_LENGTH + HEADER_DATA_SIZE.NUMBER_OF_BLOCKS + HEADER_DATA_SIZE.BLOCK_HASH_LENGTH
    const headerBuffer = buffer.subarray(0, headerStartLength);

    const numberOfBlocks = headerBuffer.readUInt16LE(8);
    const blockHashLength = headerBuffer.readUInt16LE(10);

    // Read the block positions length
    const blockPositionLength =
    HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH +
    blockHashLength +
    HEADER_DATA_SIZE.BLOCK_START_POSITION_LENGTH +
    HEADER_DATA_SIZE.BLOCK_END_POSITION_LENGTH;

    // Read the block positions buffer
    const blockPositionsBuffer = buffer.subarray(headerStartLength, headerStartLength + numberOfBlocks * blockPositionLength);

    const blockPositions = new Map();

    // Read each block position
    for (let i = 0; i < numberOfBlocks; i++) {
        const blockOffset = i * blockPositionLength;

        // Read the block number, hash, start and end positions
        const blockNumber = Number(blockPositionsBuffer.readBigUInt64LE(blockOffset));
        const blockHash = blockPositionsBuffer
            .subarray(
                blockOffset + HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH,
                blockOffset + HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH + blockHashLength,
            )
            .toString();
        const blockStartOffset = Number(
                blockPositionsBuffer.readBigUInt64LE(
                blockOffset + HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH + blockHashLength,
            ),
        );
        const blockEndOffset = Number(
            blockPositionsBuffer.readBigUInt64LE(
            blockOffset +
                HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH +
                blockHashLength +
                HEADER_DATA_SIZE.BLOCK_START_POSITION_LENGTH,
            ),
        );

        // Store the block position in the map
        blockPositions.set(`${blockNumber}-${blockHash}`, { start: blockStartOffset, end: blockEndOffset });
    }

    return blockPositions;
}

function pathToBlocksFiles() {
    return path.join(__dirname, '../../..', 'files/blocks');
}

async function readFile(name) {
    const filePath = `${pathToBlocksFiles()}/${name}`;
    const fileDataBuffer = fs.promises.readFile(filePath);
    return fileDataBuffer;
}

async function readFileStream(name, startBytes, endBytes) {
    const filePath = `${pathToBlocksFiles()}/${name}`;
    const fileReadStream = fs.createReadStream(filePath, {
        start: startBytes,
        end: endBytes,
    });

    fileReadStream.once('error', (err) => {
        fileReadStream.destroy();
    });

    return fileReadStream;
}

async function checkFileExist(fileName) {
    const pathToFile = `${pathToBlocksFiles()}/${fileName}`;
    
    try {
        await fs.promises.access(pathToFile, fs.constants.F_OK);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') {
            return false;
        }
        console.error(err);
        throw err;
    }
}

function getCompactedFileName(blockRange) {
    return `compacted-${blockRange}.json.gz`;
}

module.exports = {
    pathToBlocksFiles,
    readFileStream,
    readFileHeader,
    getCompactedFileName,
    readFile,
    checkFileExist,
}