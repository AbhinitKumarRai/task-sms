const bcrypt = require("bcrypt");
const {
  validationError,
  conflictError,
  notFoundError,
  nonAuthorizedError,
} = require("../errorHandlers");
const UserModel = require("./user.mongoModel");
const {hasScope, roles} = require("../_common/utils");
class User {
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
    this.name = "user";
    this.httpExposed = ["createUser", "login"];
    this.scopes = {
      get: [roles.SUPER_ADMIN],
      create: [roles.SUPER_ADMIN],
      update: [roles.SUPER_ADMIN],
      delete: [roles.SUPER_ADMIN],
    };
  }

  async createUser({ __longToken, email, password, role, schoolID }) {
    try {
        const userCount = await UserModel.countDocuments();
        
        if (userCount === 0) {
            role = 'super-admin';
        } else {
            const { role: myRole } = __longToken;
            if (!hasScope(this.scopes, myRole, "create")) {
                return nonAuthorizedError("Insufficient permissions");
            }
        }

        // Validate based on role
        const userData = { email, password, role, schoolID };
        const errors = role === 'admin' 
            ? await this.validators.user.createAdmin(userData)
            : await this.validators.user.createUser(userData);

        if (errors) {
            const messages = errors.map((error) => error.message);
            return validationError(messages);
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return conflictError(this.name);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new UserModel({
            email,
            password: passwordHash,
            role,
            school: schoolID // Store as school, not schoolId
        });

        const savedUser = await newUser.save();
        const longToken = this.tokenManager.genLongToken({
            userId: savedUser._id,
            role,
            schoolId: schoolID // Pass as schoolId for token
        });

        return { 
            ok: true,
            data: { 
                user: savedUser,
                token: longToken 
            }
        };
    } catch (err) {
        console.error("Error creating user:", err);
        throw err;
    }
  }

  async login({ email, password }) {
    try {
        const user = await UserModel.findOne({ email });
        const errors = await this.validators.user.login({ email, password });

        if (errors) {
            const messages = errors.map((error) => error.message);
            return validationError(messages);
        }
        
        if (!user) {
            return notFoundError(this.name);
        }

        const isMatchHash = await bcrypt.compare(password, user.password);
        if (!isMatchHash) {
            return nonAuthorizedError("Invalid credentials");
        }

        // Ensure schoolId is properly set for admin users
        const schoolId = user.role === 'admin' ? user.school : undefined;

        const token = this.tokenManager.genLongToken({
            userId: user._id,
            role: user.role,
            schoolId
        });

        return { 
            ok: true,
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                    school: user.school
                },
                token
            }
        };
    } catch (error) {
        console.error("Login Error", error);
        throw error;
    }
  }
}

module.exports = User;
