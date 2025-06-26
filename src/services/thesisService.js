const { executeRun } = require("../db/database");

class ThesisService {
  async createThesisTopic(instructorId, title, description, documentPath) {
    const query = `
      INSERT INTO thesis_topics (instructor_id, title, description, document_path, status)
      VALUES (?, ?, ?, ?, 'Available')
    `;
    const params = [instructorId, title, description, documentPath];
    const result = await executeRun(query, params);
    return result.lastID;
  }
}

module.exports = new ThesisService();
