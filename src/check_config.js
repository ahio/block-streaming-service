const checkConfig = async () => {
	return new Promise((resolve, reject) => {
        if (!process.env.AWS_REGION) {
            reject('AWS_REGION env variable is missing');
        }

        if (!process.env.AWS_ACCESS_KEY_ID) {
            reject('AWS_ACCESS_KEY_ID env variable is missing');
        }

        if (!process.env.AWS_SECRET_ACCESS_KEY) {
            reject('AWS_SECRET_ACCESS_KEY env variable is missing');
        }

        if (!process.env.AWS_BUCKET) {
            reject('AWS_BUCKET env variable is missing');
        }

        if (!process.env.AWS_PREFIX) {
            reject('AWS_PREFIX env variable is missing');
        }

        resolve();
	});
}

module.exports = checkConfig;