const errorHandlers = require('../../../../managers/entities/errorHandlers');

describe('Error Handlers', () => {
  describe('Conflict Error', () => {
    it('should generate conflict error with default message', () => {
      const error = errorHandlers.conflictError('School');
      expect(error.code).toBe(409);
      expect(error.ok).toBe(false);
      expect(error.message).toBe('This School already exists');
    });

    it('should generate conflict error with custom message', () => {
      const customMessage = 'Custom conflict message';
      const error = errorHandlers.conflictError('School', customMessage);
      expect(error.code).toBe(409);
      expect(error.ok).toBe(false);
      expect(error.message).toBe(customMessage);
    });
  });

  describe('Validation Error', () => {
    it('should generate validation error with messages array', () => {
      const messages = ['Field 1 is required', 'Field 2 is invalid'];
      const error = errorHandlers.validationError(messages);
      expect(error.code).toBe(400);
      expect(error.ok).toBe(false);
      expect(error.errors).toEqual(messages);
      expect(error.message).toBe('Validation Error');
    });
  });

  describe('Not Found Error', () => {
    it('should generate not found error with default message', () => {
      const error = errorHandlers.notFoundError('School');
      expect(error.code).toBe(404);
      expect(error.ok).toBe(false);
      expect(error.message).toBe('School not found');
    });

    it('should generate not found error with custom message', () => {
      const customMessage = 'Custom not found message';
      const error = errorHandlers.notFoundError('School', customMessage);
      expect(error.code).toBe(404);
      expect(error.ok).toBe(false);
      expect(error.message).toBe(customMessage);
    });
  });

  describe('Non Authorized Error', () => {
    it('should generate unauthorized error with default message', () => {
      const error = errorHandlers.nonAuthorizedError();
      expect(error.code).toBe(403);
      expect(error.ok).toBe(false);
      expect(error.message).toBe('Unauthorized');
    });

    it('should generate unauthorized error with custom message', () => {
      const customMessage = 'Custom unauthorized message';
      const error = errorHandlers.nonAuthorizedError(customMessage);
      expect(error.code).toBe(403);
      expect(error.ok).toBe(false);
      expect(error.message).toBe(customMessage);
    });
  });

  describe('Error Response Structure', () => {
    it('should maintain consistent error response structure', () => {
      const errors = [
        errorHandlers.conflictError('School'),
        errorHandlers.validationError(['Error']),
        errorHandlers.notFoundError('School'),
        errorHandlers.nonAuthorizedError()
      ];

      errors.forEach(error => {
        expect(error).toHaveProperty('ok');
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('data');
        expect(error).toHaveProperty('message');
        expect(error.ok).toBe(false);
        expect(error.data).toEqual({});
      });
    });
  });
}); 