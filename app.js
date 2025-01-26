// Load environment variables first
require('dotenv').config({ path: process.env.DOTENV_PATH || '.env' });

const config = require('./config/index.config.js');
const Cortex = require('ion-cortex');
const ManagersLoader = require('./loaders/ManagersLoader.js');

// Validate required connections
if (!config.dotEnv.MONGO_URI) {
    throw new Error('MongoDB URI is required');
}

if (!config.dotEnv.CACHE_REDIS || !config.dotEnv.CACHE_PREFIX) {
    throw new Error('Redis cache configuration is required');
}

if (!config.dotEnv.CORTEX_REDIS || !config.dotEnv.CORTEX_PREFIX || !config.dotEnv.CORTEX_TYPE) {
    throw new Error('Cortex configuration is required');
}

// Initialize MongoDB connection
const mongoDB = require('./connect/mongo')({
    uri: config.dotEnv.MONGO_URI
});

// Initialize cache
const cache = require('./cache/cache.dbh')({
    prefix: config.dotEnv.CACHE_PREFIX,
    url: config.dotEnv.CACHE_REDIS
});

// Initialize Cortex
const cortex = new Cortex({
    prefix: config.dotEnv.CORTEX_PREFIX,
    url: config.dotEnv.CORTEX_REDIS,
    type: config.dotEnv.CORTEX_TYPE,
    state: () => ({}),
    activeDelay: "50ms",
    idlDelay: "200ms",
});

const managersLoader = new ManagersLoader({config, cache, cortex});
const managers = managersLoader.load();

// Add health check endpoint
managers.userServer.app.get('/', (_req, res) => {
    res.json({
        status: 'API Working!',
        environment: config.dotEnv.ENV,
        service: config.dotEnv.SERVICE_NAME
    });
});

// Only start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    const port = config.dotEnv.USER_PORT || 5111;
    managers.userServer.run();
    console.log(`Server running on port ${port} in ${config.dotEnv.ENV} mode`);
}

// Export for testing
module.exports = managers.userServer.app;
