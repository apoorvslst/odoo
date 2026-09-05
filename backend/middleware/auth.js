const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Missing or malformed Authorization header"));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, contactId: payload.contactId ?? null };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "Insufficient role"));
  }
  next();
};

module.exports = { authRequired, requireRole };
