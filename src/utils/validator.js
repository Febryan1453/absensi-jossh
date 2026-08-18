const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Validate a data object against a schema definition
 * @param {Object} data - Input payload (body, query, or params)
 * @param {Object} schema - Schema rules
 * @returns {{ isValid: boolean, errors: Array<{ field: string, message: string }> }}
 */
const validateSchema = (data = {}, schema = {}) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const isPresent = value !== undefined && value !== null && value !== '';

    // Check required
    if (rules.required && !isPresent) {
      errors.push({
        field,
        message: rules.message || `${field} is required`
      });
      continue;
    }

    // If optional and not present, skip further checks
    if (!isPresent) {
      continue;
    }

    // Type checking
    if (rules.type) {
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push({ field, message: `${field} must be a string` });
          }
          break;
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push({ field, message: `${field} must be a number` });
          }
          break;
        case 'integer':
          if (!Number.isInteger(Number(value))) {
            errors.push({ field, message: `${field} must be an integer` });
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== 1 && value !== 0) {
            errors.push({ field, message: `${field} must be a boolean` });
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push({ field, message: `${field} must be an array` });
          }
          break;
        case 'email':
          if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) {
            errors.push({ field, message: `${field} must be a valid email address` });
          }
          break;
        case 'uuid':
          if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
            errors.push({ field, message: `${field} must be a valid UUID` });
          }
          break;
        case 'date':
          if (typeof value !== 'string' || !DATE_REGEX.test(value) || isNaN(new Date(value).getTime())) {
            errors.push({ field, message: `${field} must be a valid date in YYYY-MM-DD format` });
          }
          break;
        case 'time':
          if (typeof value !== 'string' || !TIME_REGEX.test(value)) {
            errors.push({ field, message: `${field} must be a valid time in HH:MM or HH:MM:SS format` });
          }
          break;
        default:
          break;
      }
    }

    // Enum check
    if (rules.enum && Array.isArray(rules.enum)) {
      if (!rules.enum.includes(value)) {
        errors.push({
          field,
          message: `${field} must be one of: ${rules.enum.join(', ')}`
        });
      }
    }

    // String length checks
    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.minLength} characters long`
        });
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push({
          field,
          message: `${field} must be at most ${rules.maxLength} characters long`
        });
      }
    }

    // Numeric min/max checks
    if (rules.type === 'number' || rules.type === 'integer') {
      const num = Number(value);
      if (rules.min !== undefined && num < rules.min) {
        errors.push({
          field,
          message: `${field} must be greater than or equal to ${rules.min}`
        });
      }
      if (rules.max !== undefined && num > rules.max) {
        errors.push({
          field,
          message: `${field} must be less than or equal to ${rules.max}`
        });
      }
    }

    // Custom validator function
    if (typeof rules.custom === 'function') {
      const customResult = rules.custom(value, data);
      if (customResult !== true) {
        errors.push({
          field,
          message: typeof customResult === 'string' ? customResult : `${field} is invalid`
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateSchema
};
