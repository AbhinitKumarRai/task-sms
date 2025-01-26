const {
  validationError,
  notFoundError,
  forbiddenError,
  nonAuthorizedError,
} = require("../errorHandlers");
const _ = require("lodash");

const {roles, hasScope} = require("../_common/utils");
const { StudentModel } = require("./student.mongoModel");
const { ClassroomModel } = require("../classroom/classroom.mongoModel");
const UserModel = require("../user/user.mongoModel");
const { isAllowedAdmin } = require("./student.helper");

class Student {
  constructor({
    utils,
    cache,
    config,
    cortex,
    managers,
    validators,
    mongomodels,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.mongomodels = mongomodels;
    this.tokenManager = managers.token;
    this.name = "student";
    this.httpExposed = [
      "create",
      "put=update",
      "delete=delete",
      "get=getByID",
      "get=getAll",
    ];
    this.scopes = {
      get: [roles.SUPER_ADMIN, roles.ADMIN],
      create: [roles.SUPER_ADMIN, roles.ADMIN],
      update: [roles.SUPER_ADMIN, roles.ADMIN],
      delete: [roles.SUPER_ADMIN, roles.ADMIN],
    };
  }

  async getByID({ __longToken, params: { id } }) {
    if (!__longToken) {
      return forbiddenError("No token provided");
    }

    const { role } = __longToken;

    if (!hasScope(this.scopes, role, "get")) {
      return forbiddenError("Insufficient permissions");
    }

    const errors = await this.validators.student.getByID({ id });

    if (errors) {
      const messages = errors.map((error) => error.message);
      return validationError(messages);
    }

    return (await StudentModel.findById(id)) || notFoundError(this.name);
  }

  async getAll({ __longToken, classroomID }) {
    try {
      if (!__longToken || !__longToken.role) {
        return {
          ok: false,
          code: 401,
          errors: ['Invalid token'],
          message: 'Authentication failed'
        };
      }

      const { role, schoolId: userSchoolId } = __longToken;

      // Build query
      let query = {};
      if (classroomID) {
        query.classroomId = classroomID;
      }

      // For admin users, filter by their school
      if (role === 'admin' && userSchoolId) {
        const classrooms = await ClassroomModel.find({ schoolId: userSchoolId });
        const classroomIds = classrooms.map(c => c._id);
        query.classroomId = { $in: classroomIds };
      }

      const students = await StudentModel.find(query)
        .populate({
          path: 'classroomId',
          select: 'name schoolId',
          populate: {
            path: 'schoolId',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 });

      return {
        ok: true,
        data: students,
        message: `Retrieved ${students.length} students`
      };
    } catch (error) {
      console.error('Error getting students:', error);
      return {
        ok: false,
        code: 500,
        errors: [error.message],
        message: 'Failed to get students'
      };
    }
  }

  async create({ __longToken, name, age, classroomID }) {
    try {
      console.log('Create Student Input:', { name, age, classroomID, token: __longToken });

      // Check if token exists and has required fields
      if (!__longToken || !__longToken.role) {
        console.log('Invalid token data:', __longToken);
        return {
          ok: false,
          code: 401,
          errors: ['Invalid token'],
          message: 'Authentication failed'
        };
      }

      const { role, schoolId: userSchoolId } = __longToken;
      console.log('Token Data:', { role, userSchoolId });

      // Validate input
      const validationErrors = await this.validators.student.create({ 
        name, 
        age,
        classroomID 
      });
      
      if (validationErrors) {
        console.log('Validation errors:', validationErrors);
        return {
          ok: false,
          code: 400,
          errors: validationErrors,
          message: 'Validation failed'
        };
      }

      // Check if classroom exists and belongs to admin's school
      const classroom = await ClassroomModel.findById(classroomID);
      if (!classroom) {
        return {
          ok: false,
          code: 404,
          errors: ['Classroom not found'],
          message: 'Classroom does not exist'
        };
      }

      // For admin users, verify they're creating student in their school's classroom
      if (role === 'admin') {
        if (!userSchoolId) {
          return {
            ok: false,
            code: 403,
            errors: ['School ID not found in token'],
            message: 'Unauthorized'
          };
        }

        if (classroom.schoolId.toString() !== userSchoolId.toString()) {
          return {
            ok: false,
            code: 403,
            errors: ['Cannot create student in different school'],
            message: 'Unauthorized'
          };
        }
      }

      // Create student
      const student = new StudentModel({
        name,
        age,
        classroomId: classroomID
      });

      const savedStudent = await student.save();
      console.log('Student created:', savedStudent);

      return {
        ok: true,
        code: 201,
        data: savedStudent,
        message: 'Student created successfully'
      };

    } catch (error) {
      console.error('Error creating student:', error);
      return {
        ok: false,
        code: 500,
        errors: [error.message || 'Internal server error'],
        message: 'Failed to create student'
      };
    }
  }

  async update({ __longToken, name, age, classroomID, params: { id } }) {
    try {
      const { userId, role } = __longToken;

      //check if the user has valid class scopes
      if (!hasScope(this.scopes,role, "update")) {
        return forbiddenError("Insufficient permissions");
      }
      //check if this is admin then check if they have access
      if (role !== roles.SUPER_ADMIN && !(await isAllowedAdmin(userId, id))) {
        return forbiddenError(
          "This admin doesn't have access to this student"
        );
      }

      const errors = await this.validators.student.update({
        id,
        name,
        age,
        classroomID,
      });

      if (errors) {
        const messages = errors.map((error) => error.message);
        return validationError(messages);
      }

      return (
        (await StudentModel.findByIdAndUpdate(
          id,
          { name, age, classroom: classroomID },
          { new: true }
        )) || notFoundError(this.name)
      );
    } catch (err) {
      console.log(err);
      throw new Error("Internal server error");
    }
  }

  async delete({ __longToken, params: { id } }) {
    try {
      const { userId, role } = __longToken;

    //check if the user has valid class scopes
    if (!hasScope(this.scopes,role, "delete")) {
        return forbiddenError("Insufficient permissions");
      }
      //check if this is admin then check if they have access
      if (role !== roles.SUPER_ADMIN && !(await isAllowedAdmin(userId, id))) {
        return forbiddenError(
          "This admin doesn't have access to this student"
        );
      }
      const errors = await this.validators.student.delete({ id });

      if (errors) {
        const messages = errors.map((error) => error.message);
        return validationError(messages);
      }
      // the return await here is for one liner conclusion for operands evaluation to complete

      return (
        (await StudentModel.findByIdAndDelete(id)) || notFoundError(this.name)
      );
    } catch (err) {
      console.log(err);
      throw new Error("Internal server error");
    }
  }


}

module.exports = Student;
