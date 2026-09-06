const ApiError = require("../utils/apiError");

function notFound(req, res, next) {  // middle ware for not found stuff
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  // Postgres constraint codes -> meaningful HTTP responses instead of 500s.
  if (err && err.code === "23505") {
    return res.status(409).json({ error: "Duplicate value violates a unique constraint" });
  }
  if (err && err.code === "23503") {
    return res.status(409).json({ error: "Record is referenced by other data" });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}

module.exports = { notFound, errorHandler };
