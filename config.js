/*
* CONFIG FILE
* */

const enviroments = {};

// STAGE
enviroments.staging = {
	port: '8000',
	envName: 'staging',
};

// PROD
enviroments.production = {
	port: '8001',
	envName: 'production',
};

// Current ENV
const currentEnvironemnt = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

const envToExport = typeof enviroments[currentEnvironemnt] === 'object' ? enviroments[currentEnvironemnt] : enviroments.staging;

module.exports = envToExport;