const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      // Send a single readable string as well for simple frontend alerts
      const simpleMessage = formattedErrors.map(e => e.message).join(', ');

      return res.status(400).json({
        success: false,
        message: simpleMessage || 'Validation Error',
        errors: formattedErrors
      });
    }
    next(error);
  }
};

module.exports = validate;
