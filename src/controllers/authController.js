const authService = require("../services/authService");

class AuthController {
  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async loginUser(req, res) {
    try {
      console.log("Login request body:", req.body);
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required",
        });
      }

      // Authenticate user
      const user = await authService.authenticateUser(username, password);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
        });
      }

      // Set session variables
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.username = user.username;

      // Return success response
      return res.status(200).json({
        success: true,
        message: "Login successful",
        userRole: user.role,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during login",
      });
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logoutUser(req, res) {
    try {
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error logging out",
          });
        }

        res.clearCookie("connect.sid"); // Clear session cookie

        // Return success response
        return res.status(200).json({
          success: true,
          message: "Logout successful",
        });
      });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during logout",
      });
    }
  }

  /**
   * Check if user is authenticated
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async checkAuth(req, res) {
    try {
      if (req.session && req.session.userId) {
        return res.status(200).json({
          isLoggedIn: true,
          userId: req.session.userId,
          username: req.session.username,
          userRole: req.session.userRole,
        });
      } else {
        return res.status(200).json({
          isLoggedIn: false,
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred checking authentication status",
      });
    }
  }
}

module.exports = new AuthController();
