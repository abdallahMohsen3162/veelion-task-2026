const HttpError = require('../utils/httpError');

function formatZodIssues(issues) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);
        req.query = parsedQuery;
        // Express 4 defines req.query as a getter; assigning may throw
        // in some versions, so also stash the validated copy.
        req.validatedQuery = parsedQuery;
      }

      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      return next();
    } catch (error) {
      if (error && error.name === 'ZodError') {
        const details = formatZodIssues(error.issues || []);
        const first = details[0];
        const message = first
          ? `${first.path ? `${first.path}: ` : ''}${first.message}`
          : 'Invalid request.';
        return next(new HttpError(400, message, details));
      }

      return next(error);
    }
  };
}

module.exports = {
  validate,
};
