function sendSuccess(res, data, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message });
}

function sendError(res, err) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = statusCode >= 500 ? 'Internal server error' : err.message;
  const body = { success: false, error: { code, message } };
  if (err.details) body.error.details = err.details;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };
