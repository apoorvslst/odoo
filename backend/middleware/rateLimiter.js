const ApiError = require("../utils/apiError");

/**
 * In-memory sliding rate limiter middleware (zero external npm dependencies).
 * Tracks request count per IP address within a configurable time window.
 */
function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 5, message = "Too many requests. Please try again later." } = {}) {
  const hits = new Map();

  // Periodic cleanup every windowMs to avoid unbounded memory growth.
  // .unref() ensures this timer does not prevent node process/tests from exiting.
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    }
  }, windowMs);
  if (interval.unref) interval.unref();

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const record = hits.get(ip);

    if (!record || now > record.resetTime) {
      hits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      return next(new ApiError(429, message));
    }

    record.count += 1;
    next();
  };
}

module.exports = { createRateLimiter };
