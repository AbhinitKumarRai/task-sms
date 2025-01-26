const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classroomSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    alias: 'schoolID'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
// Unique constraint on name within a school
classroomSchema.index({ name: 1, schoolId: 1 }, { unique: true });

const ClassroomModel = mongoose.model('Classroom', classroomSchema);

module.exports = { ClassroomModel };
