// Define mock objects first
const mockConfig = {
  dotEnv: {
    MONGO_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
    NODE_ENV: 'test'
  }
};

const mockMongoDB = {
  connection: null,
  connect: jest.fn().mockResolvedValue(null),
  disconnect: jest.fn().mockResolvedValue(null)
};

// Then use them in the mock
jest.mock('../../app', () => ({
  config: mockConfig,
  mongoDB: mockMongoDB
}));

// Mock the mongo connect module
jest.mock('../../connect/mongo', () => () => mockMongoDB);

// Export the mocks for use in tests
module.exports = {
  mockConfig,
  mockMongoDB
}; 