const ApiError = require('../../server/utils/ApiError');

describe('ApiError static factories', () => {
  test.each([
    ['badRequest', 400, 'BAD_REQUEST'],
    ['unauthorized', 401, 'UNAUTHORIZED'],
    ['forbidden', 403, 'FORBIDDEN'],
    ['notFound', 404, 'NOT_FOUND'],
    ['conflict', 409, 'CONFLICT'],
    ['tooManyRequests', 429, 'RATE_LIMITED'],
    ['internal', 500, 'INTERNAL_ERROR'],
  ])('%s() produces status %i with default code %s', (method, status, code) => {
    const err =
      method === 'badRequest' || method === 'conflict'
        ? ApiError[method]('a message')
        : ApiError[method]();
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(status);
    expect(err.code).toBe(code);
  });

  test('badRequest carries an explicit code and details through', () => {
    const err = ApiError.badRequest('Invalid body', 'VALIDATION_ERROR', { fieldErrors: { title: ['Required'] } });
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ fieldErrors: { title: ['Required'] } });
    expect(err.message).toBe('Invalid body');
  });
});
