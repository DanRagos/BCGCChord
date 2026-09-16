const ApiError = require('../utils/ApiError');
const { sendError } = require('../utils/ApiResponse');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error.name === 'ValidationError') {
      error = ApiError.badRequest(error.message, 'VALIDATION_ERROR');
    } else if (error.name === 'CastError') {
      error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`, 'INVALID_ID');
    } else if (error.code === 11000) {
      error = ApiError.conflict('A record with that value already exists.', 'DUPLICATE_KEY');
    } else {
      const wrapped = ApiError.internal();
      wrapped.original = err;
      error = wrapped;
    }
  }

  // Full detail server-side only; the response body (ApiResponse.sendError)
  // never includes a stack trace, DB internals, or secrets.
  if (!error.statusCode || error.statusCode >= 500) {
    console.error(err);
  }

  sendError(res, error);
}

module.exports = errorHandler;
