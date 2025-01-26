// Load app mock first
require('./mocks/app.mock');

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock mongoose models
jest.mock('../managers/entities/school/school.mongoModel', () => 
  require('./mocks/mongoose.mock').SchoolModel
);
jest.mock('../managers/entities/classroom/classroom.mongoModel', () => 
  require('./mocks/mongoose.mock').ClassroomModel
);
jest.mock('../managers/entities/student/student.mongoModel', () => 
  require('./mocks/mongoose.mock').StudentModel
);
jest.mock('../managers/entities/user/user.mongoModel', () => 
  require('./mocks/mongoose.mock').UserModel
);

let mongoServer;

// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.LONG_TOKEN_SECRET = 'test-secret';
process.env.SHORT_TOKEN_SECRET = 'test-short-secret';
process.env.CORTEX_PREFIX = 'test';
process.env.CORTEX_REDIS = 'redis://localhost:6379';
process.env.CORTEX_TYPE = 'test';

// Mock Redis
jest.mock('ioredis', () => require('ioredis-mock'));

// Mock ion-cortex
jest.mock('ion-cortex', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    sub: jest.fn(),
    pub: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined)
  }));
});

// Global test helpers
global.generateToken = (role = 'super-admin', schoolId = null) => ({
  role,
  schoolId,
  userId: new mongoose.Types.ObjectId().toString()
});

// Mock console methods
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();
console.info = jest.fn();

// Setup MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  process.env.MONGO_URI = mongoUri;
  
  await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear database after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
}); 