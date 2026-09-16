// Wraps an async route/controller function so rejected promises reach the
// global error handler instead of crashing the process or hanging the request.
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
