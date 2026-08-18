const { validateSchema } = require('../utils/validator');
const { UnprocessableEntityError } = require('../utils/appError');

/**
 * Express middleware for request validation
 * @param {Object} schemas - Validation schema configurations: { body?: Object, query?: Object, params?: Object }
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    const allErrors = [];

    // Validate req.body
    if (schemas.body) {
      const result = validateSchema(req.body, schemas.body);
      if (!result.isValid) {
        allErrors.push(...result.errors.map((err) => ({ source: 'body', ...err })));
      }
    }

    // Validate req.query
    if (schemas.query) {
      const result = validateSchema(req.query, schemas.query);
      if (!result.isValid) {
        allErrors.push(...result.errors.map((err) => ({ source: 'query', ...err })));
      }
    }

    // Validate req.params
    if (schemas.params) {
      const result = validateSchema(req.params, schemas.params);
      if (!result.isValid) {
        allErrors.push(...result.errors.map((err) => ({ source: 'params', ...err })));
      }
    }

    if (allErrors.length > 0) {
      return next(new UnprocessableEntityError('Validation failed for request data', allErrors));
    }

    next();
  };
};

module.exports = {
  validate
};
