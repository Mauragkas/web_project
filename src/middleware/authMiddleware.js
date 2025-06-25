const path = require("path");

/**
 * Middleware to check if user is authenticated and has the required role
 * @param {string|string[]} requiredRole - Role(s) required to access the route
 * @returns {Function} - Express middleware function
 */
function authMiddleware(requiredRole) {
  return (req, res, next) => {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
      return res.redirect("/auth/login");
    }

    // If no specific role is required, just check if logged in
    if (!requiredRole) {
      return next();
    }

    // Check if user has the required role
    const userRole = req.session.userRole;

    // Handle array of roles or single role
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.includes(userRole)
      : userRole === requiredRole;

    if (!hasRequiredRole) {
      // Instead of 403, return a 404 page
      return res
        .status(404)
        .sendFile(path.join(__dirname, "../views/404.html"));
    }

    // If all checks pass, proceed
    next();
  };
}

module.exports = { authMiddleware };
