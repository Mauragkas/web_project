const {
  executeRun,
  getOne,
  executeQuery,
  getThesisTopicByIdAndInstructor,
  updateThesisTopic,
  executeTransaction,
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
  async getAvailableTopicsForAssignment(instructorId) {
    try {
      return executeQuery(
        `SELECT id, title, description, document_path, created_at
         FROM thesis_topics
         WHERE instructor_id = ? AND status = 'Available'
         ORDER BY created_at DESC`,
        [instructorId],
      );
    } catch (error) {
      console.error("Error getting available topics:", error);
      throw error;
    }
  }

  async getTopicById(topicId) {
    try {
      return getOne("SELECT * FROM thesis_topics WHERE id = ?", [topicId]);
    } catch (error) {
      console.error("Error getting topic by ID:", error);
      throw error;
    }
  }

  async initiateTemporaryAssignment(topicId, studentId, supervisorId) {
    try {
      // Create a transaction to:
      // 1. Insert a new thesis record with "Under Assignment" status
      // 2. Update the topic status to "Under Assignment"
      const operations = [
        {
          query: `INSERT INTO theses (
            topic_id, student_id, supervisor_id, status
          ) VALUES (?, ?, ?, 'Under Assignment')`,
          params: [topicId, studentId, supervisorId],
        },
        {
          query: `UPDATE thesis_topics
                  SET status = 'Under Assignment'
                  WHERE id = ?`,
          params: [topicId],
        },
      ];

      const results = await executeTransaction(operations);
      return results[0]; // Return the first result (the thesis insert)
    } catch (error) {
      console.error("Error initiating temporary assignment:", error);
      throw error;
    }
  }

  async getCurrentAssignmentsByInstructor(instructorId) {
    try {
      return executeQuery(
        `SELECT t.id, t.topic_id, t.student_id, t.status, t.assigned_date,
                tt.title as topic_title,
                u.full_name as student_name
         FROM theses t
         JOIN thesis_topics tt ON t.topic_id = tt.id
         JOIN users u ON t.student_id = u.id
         WHERE t.supervisor_id = ? AND t.status = 'Under Assignment'
         ORDER BY t.assigned_date DESC`,
        [instructorId],
      );
    } catch (error) {
      console.error("Error getting current assignments:", error);
      throw error;
    }
  }

  async getAssignmentById(assignmentId) {
    try {
      return getOne("SELECT * FROM theses WHERE id = ?", [assignmentId]);
    } catch (error) {
      console.error("Error getting assignment by ID:", error);
      throw error;
    }
  }

  async cancelAssignment(assignmentId) {
    try {
      // Create a transaction to:
      // 1. Get the topic ID from the assignment
      // 2. Update the thesis status to "Cancelled"
      // 3. Update the topic status back to "Available"

      // First get the topic ID
      const assignment = await getOne(
        "SELECT topic_id FROM theses WHERE id = ?",
        [assignmentId],
      );

      if (!assignment) {
        throw new Error("Assignment not found");
      }

      const operations = [
        {
          query: `UPDATE theses
                  SET status = 'Cancelled'
                  WHERE id = ?`,
          params: [assignmentId],
        },
        {
          query: `UPDATE thesis_topics
                  SET status = 'Available'
                  WHERE id = ?`,
          params: [assignment.topic_id],
        },
      ];

      return executeTransaction(operations);
    } catch (error) {
      console.error("Error cancelling assignment:", error);
      throw error;
    }
  }
}

module.exports = new ThesisService();
