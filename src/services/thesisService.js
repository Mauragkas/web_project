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
  /**
   * Get all theses where the instructor is supervisor or committee member.
   * @param {number} instructorId
   * @param {object} filters - { status, role }
   * @returns {Promise<Array>}
   */
  async getThesesForInstructor(instructorId, filters = {}) {
    let params = [instructorId, instructorId];
    let whereClauses = ["(t.supervisor_id = ? OR cm.instructor_id = ?)"];

    if (filters.status) {
      whereClauses.push("t.status = ?");
      params.push(filters.status);
    }

    if (filters.role === "supervisor") {
      whereClauses = ["t.supervisor_id = ?"];
      params = [instructorId];
      if (filters.status) {
        whereClauses.push("t.status = ?");
        params.push(filters.status);
      }
    } else if (filters.role === "committee") {
      whereClauses = ["cm.instructor_id = ?"];
      params = [instructorId];
      if (filters.status) {
        whereClauses.push("t.status = ?");
        params.push(filters.status);
      }
    }

    const query = `
        SELECT
          t.id as thesis_id,
          t.topic_id,
          t.student_id,
          t.supervisor_id,
          t.status,
          t.assigned_date,
          t.completion_date,
          t.grade,
          t.ap_number,
          t.library_link,
          tt.title as topic_title,
          u.full_name as student_name,
          s.full_name as supervisor_name,
          GROUP_CONCAT(cm2.full_name, ', ') as committee_members,
          CASE
            WHEN t.supervisor_id = ? THEN 'supervisor'
            WHEN cm.instructor_id = ? THEN 'committee'
            ELSE NULL
          END as instructor_role
        FROM theses t
        JOIN thesis_topics tt ON t.topic_id = tt.id
        JOIN users u ON t.student_id = u.id
        JOIN users s ON t.supervisor_id = s.id
        LEFT JOIN committee_members cm ON cm.thesis_id = t.id
        LEFT JOIN users cm2 ON cm2.id = cm.instructor_id
        WHERE ${whereClauses.join(" AND ")}
        GROUP BY t.id
        ORDER BY t.assigned_date DESC
      `;

    // For role-specific queries, instructor_id is used twice for CASE
    const caseParams = [instructorId, instructorId];
    return executeQuery(query, [...caseParams, ...params]);
  }
}

module.exports = new ThesisService();
