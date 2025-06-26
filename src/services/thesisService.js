const {
  executeRun,
  getOne,
  executeQuery,
  getThesisTopicByIdAndInstructor,
  updateThesisTopic,
} = require("../db/database");

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

  async retrieveThesisTopic(topicId, instructorId) {
    return getThesisTopicByIdAndInstructor(topicId, instructorId);
  }

  async getTopicsByInstructor(instructorId) {
    return executeQuery(
      "SELECT * FROM thesis_topics WHERE instructor_id = ? ORDER BY created_at DESC",
      [instructorId],
    );
  }

  async deleteThesisTopic(topicId, instructorId) {
    return executeRun(
      "DELETE FROM thesis_topics WHERE id = ? AND instructor_id = ?",
      [topicId, instructorId],
    );
  }

  async updateThesisTopic(
    topicId,
    instructorId,
    title,
    description,
    documentPath,
  ) {
    return updateThesisTopic(
      topicId,
      instructorId,
      title,
      description,
      documentPath,
    );
  }
}

module.exports = new ThesisService();
