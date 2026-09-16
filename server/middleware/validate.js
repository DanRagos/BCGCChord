const ApiError = require('../utils/ApiError');

// Validates req.body against a zod schema. On success, req.body is replaced
// with the parsed (and coerced/defaulted) value.
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(ApiError.badRequest('Invalid request body.', 'VALIDATION_ERROR', result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
