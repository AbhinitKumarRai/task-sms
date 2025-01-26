const {
  validationError,
  conflictError,
  notFoundError,
  forbiddenError,
} = require("../errorHandlers");
const _ = require("lodash");

const { roles, hasScope } = require("../_common/utils");
const SchoolModel = require("./school.mongoModel");
const ClassRoomModel = require("../classroom/classroom.mongoModel");
const UserModel = require("../user/user.mongoModel");
const { query } = require("express");
class School {
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
    this.name = "school";
    this.httpExposed = [
      "create",
      "put=update",
      "delete=delete",
      "get=getByID",
      "get=getAll",
    ];
    this.scopes = {
      get: [roles.SUPER_ADMIN],
      create: [roles.SUPER_ADMIN],
      update: [roles.SUPER_ADMIN],
      delete: [roles.SUPER_ADMIN],
      getAll: [roles.SUPER_ADMIN],
    };
  }
  async getByID({ __longToken, params: { id } }) {
    const { role } = __longToken;

    //check if the user has valid class scopes
    if (!hasScope(this.scopes, role, "get")) {
      return forbiddenError("Insufficient permissions");
    }
    const errors = await this.validators.school.getByID({ id });

    if (errors) {
      const messages = errors.map((error) => error.message);
      return validationError(messages);
    }

    return (await SchoolModel.findById(id)) || notFoundError(this.name);
  }

  async getAll({ __longToken }) {
    if (!__longToken) {
      return forbiddenError("No token provided");
    }

    const { role } = __longToken;

    //check if the user has valid class scopes
    if (!hasScope(this.scopes, role, "get")) {
      return forbiddenError("Insufficient permissions");
    }

    return await SchoolModel.find({});
  }

  async create({ __longToken, name, address }) {
    try {
      const { role } = __longToken;

      //check if the user has valid class scopes
      if (!hasScope(this.scopes, role, "create")) {
        return forbiddenError("Insufficient permissions");
      }
      const errors = await this.validators.school.create({ name, address });

      if (errors) {
        const messages = errors.map((error) => error.message);
        return validationError(messages);
      }

      const school = await SchoolModel.findOne({ name });
      if (school) {
        return conflictError("School with this name already exists");
      }
      return await SchoolModel.create({ name, address });
    } catch (err) {
      console.error(err);
      throw new Error("Internal server error");
    }
  }

  async update({ __longToken, name, address, params: { id } }) {
    try {
      const { role } = __longToken;

      //check if the user has valid class scopes
      if (!hasScope(this.scopes, role, "update")) {
        return forbiddenError("Insufficient permissions");
      }
      const errors = await this.validators.school.update({ id, name, address });

      if (errors) {
        const messages = errors.map((error) => error.message);
        return validationError(messages);
      }

      const school = await SchoolModel.findById(id);
      if (!school) {
        return notFoundError(this.name);
      }

      return SchoolModel.updateOne({ _id: id }, { $set: { name, address } });
    } catch (err) {
      console.log(err);
      throw new Error("Internal server error");
    }
  }

  async delete({ __longToken, params: { id } }) {
    try {
      const { role } = __longToken;

      //check if the user has valid class scopes
      if (!hasScope(this.scopes, role, "delete")) {
        return forbiddenError("Insufficient permissions");
      }
      const errors = await this.validators.school.delete({ id });

      if (errors) {
        const messages = errors.map((error) => error.message);
        return validationError(messages);
      }
      // the return await here is for one liner conclusion for operands evaluation to complete
      const relatedClassrooms = ClassRoomModel.find({ school: id });
      if (!_.isEmpty(relatedClassrooms)) {
        return conflictError(
          this.name,
          "Cannot delete school because dependent classrooms exist"
        );
      }
      const relatedUsers = UserModel.find({ school: id });
      if (!_.isEmpty(relatedUsers)) {
        return conflictError(
          this.name,
          "Cannot delete school because dependent users exist"
        );
      }

      return SchoolModel.findByIdAndDelete(id);
    } catch (err) {
      console.log(err);
      throw new Error("Internal server error");
    }
  }
}

module.exports = School;
