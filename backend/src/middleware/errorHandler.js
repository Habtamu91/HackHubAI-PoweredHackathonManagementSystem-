function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || error.status || 500;
  const payload = {
    success: false,
    message: error.message || "Internal server error"
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = error.stack;
  }

  if (error.name === "ValidationError") {
    payload.message = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
    return res.status(422).json(payload);
  }

  if (error.code === 11000) {
    payload.message = "Duplicate resource";
    return res.status(409).json(payload);
  }

  return res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };
