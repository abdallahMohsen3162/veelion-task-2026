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
        req.validatedQuery = parsedQuery;
        try {
          req.query = parsedQuery;
        } catch {
          // Express 4 exposes req.query as a getter in some versions;
          // validated copy is already stashed above.
        }
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
