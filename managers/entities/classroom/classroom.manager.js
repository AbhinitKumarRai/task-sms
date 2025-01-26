const {
  validationError,
  conflictError,
  notFoundError,
  nonAuthorizedError,
  forbiddenError,
} = require("../errorHandlers");
const _ = require("lodash");

const {roles, hasScope} = require("../_common/utils");
const { ClassroomModel } = require("./classroom.mongoModel");
const SchoolModel = require("../school/school.mongoModel");
const StudentModel = require("../student/student.mongoModel");
const {
  isAllowedAdminCreate,
  isAllowedAdminUpdate,
} = require("./classroom.helper");
const UserModel = require("../user/user.mongoModel");

class Classroom {
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
    this.name = "classroom";
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

  async getAll({ __longToken }) {
    try {
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
      console.log('GetAll Token Data:', { role, userSchoolId });

      // Build query based on role
      let query = {};
      if (role === 'admin' && userSchoolId) {
        query.schoolId = userSchoolId;
      }

      console.log('Classroom Query:', query);

      const classrooms = await ClassroomModel.find(query)
        .populate('schoolId', 'name')
        .sort({ createdAt: -1 });

      console.log(`Found ${classrooms.length} classrooms`);

      return {
        ok: true,
        data: classrooms,
        message: `Retrieved ${classrooms.length} classrooms`
      };
    } catch (error) {
      console.error('Error getting classrooms:', error);
      return {
        ok: false,
        code: 500,
        errors: [error.message || 'Internal server error'],
        message: 'Failed to get classrooms'
      };
    }
  }

  async getByID({ __longToken, params: { id } }) {
    try {
      const { role, schoolId } = __longToken;
      if (!hasScope(this.scopes, role, 'get')) {
        return nonAuthorizedError('Insufficient permissions');
      }

      const classroom = await ClassroomModel.findById(id);
      if (!classroom) {
        return notFoundError(this.name);
      }

      if (role === roles.ADMIN && classroom.schoolId.toString() !== schoolId) {
        return nonAuthorizedError('Cannot access classroom from different school');
      }

      return {
        ok: true,
        data: classroom,
        errors: [],
        message: ''
      };
    } catch (error) {
      console.error('Error getting classroom:', error);
      return {
        ok: false,
        data: {},
        errors: ['Failed to get classroom'],
        message: error.message
      };
    }
  }

  async create({ __longToken, name, schoolId, schoolID }) {
    try {
      console.log('Create Classroom Input:', { 
        name, 
        schoolId, 
        schoolID,
        token: __longToken 
      });

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

      const { role, userId, schoolId: userSchoolId } = __longToken;
      console.log('Token Data:', { role, userId, userSchoolId });

      // Use schoolID if provided, otherwise use schoolId
      const targetSchoolId = schoolID || schoolId;
      console.log('Target School ID:', targetSchoolId);

      if (!targetSchoolId) {
        return {
          ok: false,
          code: 400,
          errors: ['School ID is required'],
          message: 'Missing school ID'
        };
      }

      // Check if school exists
      const school = await SchoolModel.findById(targetSchoolId);
      if (!school) {
        console.log('School not found:', targetSchoolId);
        return {
          ok: false,
          code: 404,
          errors: ['School not found'],
          message: 'School does not exist'
        };
      }

      // For admin users, verify they're creating classroom for their school
      if (role === 'admin') {
        if (!userSchoolId) {
          console.log('No school ID in token for admin user');
          return {
            ok: false,
            code: 403,
            errors: ['School ID not found in token'],
            message: 'Unauthorized'
          };
        }

        console.log('School ID comparison:', {
          userSchoolId: userSchoolId.toString(),
          targetSchoolId: targetSchoolId.toString(),
          match: userSchoolId.toString() === targetSchoolId.toString()
        });

        if (userSchoolId.toString() !== targetSchoolId.toString()) {
          return {
            ok: false,
            code: 403,
            errors: ['Cannot create classroom for different school'],
            message: 'Unauthorized'
          };
        }
      }

      // Validate input
      const validationErrors = await this.validators.classroom.create({ 
        name, 
        schoolID: targetSchoolId 
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

      // Create classroom
      const classroom = new ClassroomModel({
        name,
        schoolId: targetSchoolId
      });

      const savedClassroom = await classroom.save();
      console.log('Classroom created:', savedClassroom);

      return {
        ok: true,
        code: 201,
        data: savedClassroom,
        message: 'Classroom created successfully'
      };

    } catch (error) {
      console.error('Error creating classroom:', error);
      return {
        ok: false,
        code: 500,
        errors: [error.message || 'Internal server error'],
        message: 'Failed to create classroom'
      };
    }
  }

  async update({ __longToken, name, params: { id } }) {
    try {
      const { userId, role } = __longToken;
      if (
        role !== roles.SUPER_ADMIN &&
        !(await isAllowedAdminUpdate(userId, id))
      ) {
        return forbiddenError(
          "This admin doesn't have access to this school"
        );
      }
      //check if the user has valid class scopes
      if (!hasScope(this.scopes,role, "update")) {
        return forbiddenError("Insufficient permissions");
      }
      const errors = await this.validators.classroom.update({ id, name });

      if (errors) {
        const messages = errors.map((error) => error.message);
        return validationError(messages);
      }
      const classroom = await ClassroomModel.findById(id);
      if (!classroom) {
        return notFoundError(this.name);
      }

      return ClassroomModel.updateOne({ _id: id }, { $set: { name } });
    } catch (err) {
      console.error(err);
      throw new Error("Internal server error");
    }
  }

  async delete({ __longToken, params: { id } }) {
    try {
      const {userId, role } = __longToken;
      if (
        role !== roles.SUPER_ADMIN &&
        !(await isAllowedAdminUpdate(userId, id))
      ) {
        return forbiddenError(
          "This admin doesn't have access to this school"
        );
      }
      //check if the user has valid class scopes
      if (!hasScope(this.scopes,role, "delete")) {
        return forbiddenError("Insufficient permissions");
      }
      const errors = await this.validators.classroom.delete({ id });

      if (errors) {
        const messages = errors.map((error) => error.message);
        return validationError(messages);
      }

      const relatedStudents = await StudentModel.find({ classroomID: id });
      if (!_.isEmpty(relatedStudents)) {
        return conflictError(
          "Cannot delete classroom because dependent students exist"
        );
      }

      const classroom = await ClassroomModel.findByIdAndDelete(id);
      if (!classroom) {
        return notFoundError(this.name);
      }
      return { ok: true, data: classroom };
    } catch (err) {
      console.error(err);
      throw new Error("Internal server error");
    }
  }

  async getStudents({ __longToken, params: { id } }) {
    if (!__longToken) {
      return forbiddenError("No token provided");
    }

    const { role } = __longToken;

    if (!hasScope(this.scopes, role, "get")) {
      return forbiddenError("Insufficient permissions");
    }

    const classroom = await ClassroomModel.findById(id);
    if (!classroom) {
      return notFoundError(this.name);
    }

    const students = await StudentModel.find({ classroomID: id });
    return { ok: true, data: students };
  }
}

module.exports = Classroom;
