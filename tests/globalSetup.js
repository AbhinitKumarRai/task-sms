const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  global.__MONGOD__ = mongoServer;
  process.env.MONGODB_URI = mongoUri;
  process.env.MONGO_URI = mongoUri;

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}; 