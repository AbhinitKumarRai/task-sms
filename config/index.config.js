require('dotenv').config({ path: process.env.DOTENV_PATH || '.env' })

// Add environment check
const checkEnvVariables = () => {
    const requiredVars = [
        'MONGO_URI',
        'LONG_TOKEN_SECRET',
        'SHORT_TOKEN_SECRET'
    ];
    
    const missing = requiredVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing);
        console.error('Current NODE_ENV:', process.env.NODE_ENV);
        console.error('Current working directory:', process.cwd());
        throw Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

// Call check at the start
checkEnvVariables();

const os                               = require('os');
const pjson                            = require('../package.json');
const utils                            = require('../libs/utils');
const SERVICE_NAME                     = (process.env.SERVICE_NAME)? utils.slugify(process.env.SERVICE_NAME):pjson.name;
const USER_PORT                        = process.env.USER_PORT || 5111;
const ADMIN_PORT                       = process.env.ADMIN_PORT || 5222;
const ADMIN_URL                        = process.env.ADMIN_URL || `http://localhost:${ADMIN_PORT}`;
const ENV                              = process.env.ENV || "development";
const REDIS_URI                        = process.env.REDIS_URI || "redis://127.0.0.1:6379";

const CORTEX_REDIS                     = process.env.CORTEX_REDIS || REDIS_URI;
const CORTEX_PREFIX                    = process.env.CORTEX_PREFIX || 'none';
const CORTEX_TYPE                      = process.env.CORTEX_TYPE || SERVICE_NAME;
const OYSTER_REDIS                     = process.env.OYSTER_REDIS || REDIS_URI;
const OYSTER_PREFIX                    = process.env.OYSTER_PREFIX || 'none';

const CACHE_REDIS                      = process.env.CACHE_REDIS || REDIS_URI;
const CACHE_PREFIX                     = process.env.CACHE_PREFIX || `${SERVICE_NAME}:ch`;

const MONGO_URI                        = process.env.MONGO_URI || `mongodb://localhost:27017/${SERVICE_NAME}`;
const LONG_TOKEN_SECRET                = process.env.LONG_TOKEN_SECRET || null;
const SHORT_TOKEN_SECRET               = process.env.SHORT_TOKEN_SECRET || null;

if(!LONG_TOKEN_SECRET || !SHORT_TOKEN_SECRET) {
    throw Error('missing .env variables check index.config');
}

// Initialize config object first
const config = {
    dotEnv: {},
    port: process.env.PORT || 5111,
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/school-api'
    },
    jwt: {
        longTokenSecret: process.env.LONG_TOKEN_SECRET,
        shortTokenSecret: process.env.SHORT_TOKEN_SECRET,
        longTokenExpiry: '7d',
        shortTokenExpiry: '1h'
    }
};

// Add environment variables to config.dotEnv
config.dotEnv = {
    SERVICE_NAME,
    ENV,
    CORTEX_REDIS,
    CORTEX_PREFIX,
    CORTEX_TYPE,
    OYSTER_REDIS,
    OYSTER_PREFIX,
    CACHE_REDIS,
    CACHE_PREFIX,
    MONGO_URI,
    USER_PORT,
    ADMIN_PORT,
    ADMIN_URL,
    LONG_TOKEN_SECRET,
    SHORT_TOKEN_SECRET,
};

// Export the complete config object
module.exports = config;
