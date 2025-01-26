const _ = require("lodash");

const conflictError = (model, message) => ({
  ok: false,
  code: 409,
  data: {},
  message: message || `This ${model} already exists`,
});

const validationError = (messages) => ({
  ok: false,
  code: 400,
  data: {},
  errors: messages,
  message: 'Validation Error',
});

const notFoundError = (model, message) => ({
  ok: false,
  code: 404,
  data: {},
  message: message || `${model} not found`,
});

const nonAuthorizedError = (message) => ({
  ok: false,
  code: 403,
  data: {},
  message: message || 'Unauthorized',
});

const forbiddenError = (message) => ({
  ok: false,
  code: 403,
  data: {},
  message: message || 'Insufficient permissions',
});

module.exports = {
  conflictError,
  validationError,
  notFoundError,
  nonAuthorizedError,
  forbiddenError,
};
