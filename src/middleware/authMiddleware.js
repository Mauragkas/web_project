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
      // If it's an AJAX request, API route, or JSON request, return a JSON response
      if (
        req.xhr ||
        req.headers.accept.indexOf("json") > -1 ||
        req.path.startsWith("/api/")
      ) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          redirect: "/auth/login",
        });
      }

      // For regular page requests, redirect to login
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
      // For AJAX requests, API routes, or JSON requests, return JSON
      if (
        req.xhr ||
        req.headers.accept.indexOf("json") > -1 ||
        req.path.startsWith("/api/")
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
          redirect: "/public/announcements",
        });
      }

      // For regular requests, show 404
      return res
        .status(404)
        .sendFile(path.join(__dirname, "../../public/views/404.html"));
    }

    // If all checks pass, proceed
    next();
  };
}

module.exports = { authMiddleware };
