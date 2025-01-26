const mongoose = require("mongoose");
const paginationSchema = require("../_common/pagination.schema");

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("School", schoolSchema);
