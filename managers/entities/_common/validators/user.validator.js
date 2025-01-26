const Joi = require('joi');
const mongoose = require('mongoose');

const userSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character',
      'any.required': 'Password is required'
    }),

  role: Joi.string()
    .valid('super-admin', 'admin')
    .required()
    .messages({
      'any.only': 'Role must be either super-admin or admin',
      'any.required': 'Role is required'
    }),

  schoolId: Joi.alternatives().conditional('role', {
    is: 'admin',
    then: Joi.string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .required()
      .messages({
        'any.invalid': 'Invalid school ID format',
        'any.required': 'School ID is required for admin users'
      }),
    otherwise: Joi.string().optional()
  })
});

module.exports = {
  create: async (data) => {
    try {
      await userSchema.validateAsync(data, { abortEarly: false });
      return null;
    } catch (error) {
      return error.details;
    }
  }
}; 