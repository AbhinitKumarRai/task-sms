const mongoose = require('mongoose');
const { roles } = require('../managers/entities/_common/roles');
const SchoolModel = require('../managers/entities/school/school.mongoModel');
const ClassroomModel = require('../managers/entities/classroom/classroom.mongoModel');
const UserModel = require('../managers/entities/user/user.mongoModel');
const StudentModel = require('../managers/entities/student/student.mongoModel');
const bcrypt = require('bcrypt');

/**
 * Create a test school
 * @param {Object} overrides - Override default school data
 * @returns {Promise<Object>} Created school document
 */
const createTestSchool = async (overrides = {}) => {
  const defaultSchool = {
    name: 'Test School',
    address: 'Test Address'
  };

  return SchoolModel.create({ ...defaultSchool, ...overrides });
};

/**
 * Create a test classroom
 * @param {Object} overrides - Override default classroom data
 * @param {string} schoolId - School ID for the classroom
 * @returns {Promise<Object>} Created classroom document
 */
const createTestClassroom = async (schoolId, overrides = {}) => {
  const defaultClassroom = {
    name: 'Test Classroom',
    school: schoolId
  };

  return ClassroomModel.create({ ...defaultClassroom, ...overrides });
};

/**
 * Create a test student
 * @param {Object} overrides - Override default student data
 * @param {string} classroomId - Classroom ID for the student
 * @returns {Promise<Object>} Created student document
 */
const createTestStudent = async (classroomId, overrides = {}) => {
  const defaultStudent = {
    name: 'Test Student',
    age: 15,
    classroom: classroomId
  };

  return StudentModel.create({ ...defaultStudent, ...overrides });
};

/**
 * Create a test user
 * @param {Object} overrides - Override default user data
 * @param {string} schoolId - School ID for admin users
 * @returns {Promise<Object>} Created user document
 */
const createTestUser = async (overrides = {}, schoolId = null) => {
  const defaultUser = {
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
    role: roles.ADMIN
  };

  if (schoolId && defaultUser.role === roles.ADMIN) {
    defaultUser.school = schoolId;
  }

  return UserModel.create({ ...defaultUser, ...overrides });
};

/**
 * Clean up test data
 * @returns {Promise<void>}
 */
const cleanupTestData = async () => {
  await Promise.all([
    SchoolModel.deleteMany({}),
    ClassroomModel.deleteMany({}),
    StudentModel.deleteMany({}),
    UserModel.deleteMany({})
  ]);
};

/**
 * Generate a valid MongoDB ObjectId
 * @returns {string} Valid ObjectId
 */
const generateObjectId = () => new mongoose.Types.ObjectId().toString();

/**
 * Create complete test hierarchy (school -> classroom -> student)
 * @returns {Promise<Object>} Object containing all created entities
 */
const createTestHierarchy = async () => {
  const school = await createTestSchool();
  const classroom = await createTestClassroom(school._id);
  const student = await createTestStudent(classroom._id);
  const admin = await createTestUser({ role: roles.ADMIN }, school._id);

  return {
    school,
    classroom,
    student,
    admin
  };
};

module.exports = {
  createTestSchool,
  createTestClassroom,
  createTestStudent,
  createTestUser,
  cleanupTestData,
  generateObjectId,
  createTestHierarchy
}; 