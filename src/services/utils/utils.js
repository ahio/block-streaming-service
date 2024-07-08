function getBlockRange(blockNumber, maxBlocks) {
    const blockNumberStr = blockNumber.toString();
    const separatorStr = maxBlocks.toString();

    const unchangedBlockNumber = blockNumberStr.slice(0, blockNumberStr.length - separatorStr.length);
    const [firstDigit, ...restDigits] = blockNumberStr.slice(blockNumberStr.length - separatorStr.length, blockNumberStr.length);

    const min = firstDigit + restDigits.fill(0).join('');
    const max = firstDigit + restDigits.fill(9).join(''); // because min value is 0 instead of 1
    
    return {
        minBlockNumber: Number(unchangedBlockNumber + min),
        maxBlockNumber: Number(unchangedBlockNumber + max),
    };
}

module.exports = {
	getBlockRange,
};