const mongoose = require("mongoose");
const { roles } = require("../_common/roles");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(roles),
    required: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
  },
});

module.exports = mongoose.model("User", userSchema);
