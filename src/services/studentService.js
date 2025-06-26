const { executeQuery, getOne } = require("../db/database");
const thesisService = require("./thesisService");

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

  /**
   * Get the current thesis info for a student
   * @param {number} studentId
   * @returns {Promise<Object|null>}
   */
  async getCurrentThesisInfo(studentId) {
    // Get the most recent thesis (if any) for this student
    const thesis = await getOne(
      `
      SELECT
        t.id as thesis_id,
        t.status,
        t.assigned_date,
        t.completion_date,
        t.grade,
        t.ap_number,
        t.library_link,
        tt.title as topic_title,
        tt.description as topic_description,
        tt.document_path as topic_document_path,
        s.full_name as supervisor_name,
        s.email as supervisor_email,
        GROUP_CONCAT(cm2.full_name, ', ') as committee_members
      FROM theses t
      JOIN thesis_topics tt ON t.topic_id = tt.id
      JOIN users s ON t.supervisor_id = s.id
      LEFT JOIN committee_members cm ON cm.thesis_id = t.id
      LEFT JOIN users cm2 ON cm2.id = cm.instructor_id
      WHERE t.student_id = ?
      GROUP BY t.id
      ORDER BY t.assigned_date DESC
      LIMIT 1
      `,
      [studentId],
    );
    return thesis;
  }
  async processCommitteeInvitations(thesisId, instructorIds) {
    // Validate: instructorIds is array, thesisId belongs to student, etc.
    if (!Array.isArray(instructorIds) || instructorIds.length === 0) {
      throw new Error("No instructors selected");
    }
    // Insert invitations
    await thesisService.createCommitteeInvitations(thesisId, instructorIds);
    return { success: true };
  }
}

module.exports = new StudentService();
