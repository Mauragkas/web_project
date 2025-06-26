const { executeQuery, getOne } = require("../db/database");

class StudentService {
  async findStudentByIdOrName(query) {
    try {
      const queryParam = `%${query}%`;
      return executeQuery(
        `SELECT id, username, email, full_name, role
         FROM users
         WHERE role = 'student' AND (username LIKE ? OR full_name LIKE ?)
         LIMIT 10`,
        [queryParam, queryParam],
      );
    } catch (error) {
      console.error("Error finding student:", error);
      throw error;
    }
  }

  async getStudentById(studentId) {
    try {
      return getOne(
        `SELECT id, username, email, full_name, role
         FROM users
         WHERE id = ?`,
        [studentId],
      );
    } catch (error) {
      console.error("Error getting student by ID:", error);
      throw error;
    }
  }
}

module.exports = new StudentService();
