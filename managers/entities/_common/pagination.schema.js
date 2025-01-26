const mongoose = require("mongoose");
//TODO to be added to schemas
const paginationSchema = new mongoose.Schema({
  page: {
    type: Number,
    default: 1,
    min: 1,
  },
  pageSize: {
    type: Number,
    default: 10,
    min: 1,
    max: 100, // Adjust maximum page size as needed
  },
});
module.exports = paginationSchema;
