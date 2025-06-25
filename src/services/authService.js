const bcrypt = require("bcrypt");
const { getOne } = require("../db/database");

class AuthService {
  /**
   * Authenticate a user with username and password
   * @param {string} username - The username
   * @param {string} password - The plaintext password
   * @returns {Promise<Object|null>} - User object if authenticated, null otherwise
   */
  async authenticateUser(username, password) {
    try {
      // Get user from database
      const user = await getOne("SELECT * FROM users WHERE username = ?", [
        username,
      ]);
      console.log("User found:", user);

      // Check if user exists
      if (!user) {
        return null;
      }

      // Compare hash
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return null;
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication failed due to a server error");
    }
  }
}

module.exports = new AuthService();
