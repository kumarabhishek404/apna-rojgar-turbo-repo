import jwt from "jsonwebtoken";

/**
 * If Authorization Bearer JWT is present and valid, sets req.user = { _id }.
 * On missing/invalid/expired token, sets req.user = null and continues (never 401).
 * Matches app tokens signed with { _id } in auth.controller.js.
 */
export const optionalAuth = (req, res, next) => {
  req.user = null;
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return next();
  }
  try {
    if (!process.env.JWT_SECRET) {
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded._id ?? decoded.sub;
    if (id) {
      req.user = { _id: id };
    }
  } catch {
    req.user = null;
  }
  next();
};
