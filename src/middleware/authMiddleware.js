/**
 * Middleware to check if user is authenticated and has the required role
 * @param {string|string[]} requiredRole - Role(s) required to access the route
 * @returns {Function} - Express middleware function
 */
function authMiddleware(requiredRole) {
    return (req, res, next) => {
        // Check if user is logged in
        if (!req.session || !req.session.userId) {
            return res.redirect('/auth/login');
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
            return res.status(403).send('Access forbidden: Insufficient permissions');
        }

        // If all checks pass, proceed
        next();
    };
}

module.exports = { authMiddleware };
