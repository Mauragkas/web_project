const {
  insertCommitteeInvitations,
  countAcceptedCommittee,
  updateThesisStatus,
  executeRun,
  getOne,
  executeQuery,
  getThesisTopicByIdAndInstructor,
  updateThesisTopic,
  executeTransaction,
  insertThesisNote,
  getThesisNotesForInstructor,
  getPublicPresentationAnnouncements,
  getThesisPresentationDetailsForAnnouncement,
  getThesisGrades,
  upsertGrade,
  countSubmittedGrades,
  countExpectedGraders,
  activateThesisGrading,
  isGradingActive,
} = require("../db/database");

// Helper: parse grade to number (if needed)
function parseGrade(grade) {
  if (!grade) return null;
  const num = parseFloat(grade);
  return isNaN(num) ? null : num;
}

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

  async createCommitteeInvitations(thesisId, instructorIds) {
    // Verify thesisId is valid
    if (!thesisId) {
      throw new Error("Thesis ID is required");
    }

    // Verify thesis exists and get supervisor
    const thesis = await getOne(
      "SELECT id, status, supervisor_id FROM theses WHERE id = ?",
      [thesisId],
    );

    if (!thesis) {
      throw new Error("Thesis not found");
    }

    // Only allow invitations for Under Assignment theses
    if (thesis.status !== "Under Assignment") {
      throw new Error(
        `Cannot invite committee members for thesis with status: ${thesis.status}`,
      );
    }

    // Check if any instructorId is the supervisor
    if (instructorIds.includes(thesis.supervisor_id.toString())) {
      throw new Error(
        "Cannot invite the thesis supervisor as committee member",
      );
    }

    // Check for duplicate invitations
    const existingInvitations = await executeQuery(
      `SELECT instructor_id FROM committee_members
       WHERE thesis_id = ?`,
      [thesisId],
    );

    const existingInstructorIds = existingInvitations.map((inv) =>
      inv.instructor_id.toString(),
    );

    // Find duplicates
    const duplicates = instructorIds.filter((id) =>
      existingInstructorIds.includes(id.toString()),
    );

    if (duplicates.length > 0) {
      throw new Error(
        "Some instructors have already been invited to this committee",
      );
    }

    // Insert invitations
    await insertCommitteeInvitations(thesisId, instructorIds);

    return { success: true };
  }

  // Called when an instructor accepts an invitation
  async handleCommitteeAcceptance(thesisId) {
    const { acceptedCount } = await countAcceptedCommittee(thesisId);
    if (acceptedCount >= 2) {
      // Transition thesis to Active
      await updateThesisStatus(thesisId, "Active");
      return { status: "Active" };
    }
    return { status: "Under Assignment" };
  }

  async getPublicAvailableTopics(filters = {}) {
    try {
      let query = `
        SELECT tt.id, tt.title, tt.description, tt.document_path, tt.created_at,
               u.full_name as instructor_name, u.id as instructor_id
        FROM thesis_topics tt
        JOIN users u ON tt.instructor_id = u.id
        WHERE tt.status = 'Available'
      `;

      const params = [];

      // Add keyword filter if provided
      if (filters.keyword) {
        query += ` AND (tt.title LIKE ? OR tt.description LIKE ?)`;
        params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
      }

      // Add instructor filter if provided
      if (filters.instructorId) {
        query += ` AND tt.instructor_id = ?`;
        params.push(filters.instructorId);
      }

      query += ` ORDER BY tt.created_at DESC`;

      return await executeQuery(query, params);
    } catch (error) {
      console.error("Error getting available topics:", error);
      throw error;
    }
  }

  // In instructorService.js, add:

  async getInstructorsWithAvailableTopics() {
    try {
      const query = `
        SELECT DISTINCT u.id, u.full_name, u.email
        FROM users u
        JOIN thesis_topics tt ON u.id = tt.instructor_id
        WHERE tt.status = 'Available' AND u.role = 'instructor'
        ORDER BY u.full_name
      `;

      return await executeQuery(query, []);
    } catch (error) {
      console.error("Error getting instructors with available topics:", error);
      throw error;
    }
  }

  // For supervisor
  async getStatisticsForSupervisor(instructorId) {
    // Only completed theses
    const rows = await executeQuery(
      `SELECT
        AVG(julianday(completion_date) - julianday(assigned_date)) as avg_completion_time,
        AVG(CASE WHEN grade GLOB '*[0-9]*' THEN CAST(grade AS FLOAT) ELSE NULL END) as avg_grade,
        COUNT(*) as total
      FROM theses
      WHERE supervisor_id = ? AND status = 'Completed'`,
      [instructorId],
    );
    // Return first row or default
    return rows[0] || { avg_completion_time: null, avg_grade: null, total: 0 };
  }

  // For committee member
  async getStatisticsForCommitteeMember(instructorId) {
    const rows = await executeQuery(
      `SELECT
        AVG(julianday(t.completion_date) - julianday(t.assigned_date)) as avg_completion_time,
        AVG(CASE WHEN t.grade GLOB '*[0-9]*' THEN CAST(t.grade AS FLOAT) ELSE NULL END) as avg_grade,
        COUNT(*) as total
      FROM theses t
      JOIN committee_members cm ON t.id = cm.thesis_id
      WHERE cm.instructor_id = ? AND t.status = 'Completed'`,
      [instructorId],
    );
    return rows[0] || { avg_completion_time: null, avg_grade: null, total: 0 };
  }
  async savePrivateNote(instructorId, thesisId, noteText) {
    // Check if instructor is supervisor or committee member for this thesis and thesis is Active
    const thesis = await getOne(
      `SELECT t.id, t.status
         FROM theses t
         LEFT JOIN committee_members cm ON cm.thesis_id = t.id
         WHERE t.id = ? AND (t.supervisor_id = ? OR cm.instructor_id = ?)
         GROUP BY t.id`,
      [thesisId, instructorId, instructorId],
    );
    if (!thesis) throw new Error("Access denied or thesis not found");
    if (thesis.status !== "Active") throw new Error("Thesis is not Active");

    // Insert note
    return insertThesisNote(thesisId, instructorId, noteText);
  }

  async getPrivateNotesForInstructor(instructorId, thesisId) {
    return getThesisNotesForInstructor(thesisId, instructorId);
  }
  async getPublicPresentationAnnouncements({ startDate, endDate }) {
    // Default: show next 30 days if not specified
    const today = new Date();
    const defaultStart = startDate || today.toISOString().slice(0, 10);
    const defaultEnd =
      endDate ||
      new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    return getPublicPresentationAnnouncements({
      startDate: defaultStart,
      endDate: defaultEnd,
    });
  }

  async cancelThesisBySupervisor(
    thesisId,
    instructorId,
    gaNumber,
    gaYear,
    cancellationReason,
  ) {
    const operations = [
      {
        query: `
          UPDATE theses
          SET status = 'Cancelled',
              cancellation_reason = ?,
              ga_number = ?,
              ga_year = ?,
              cancellation_date = CURRENT_TIMESTAMP
          WHERE id = ? AND supervisor_id = ? AND status = 'Active'
        `,
        params: [cancellationReason, gaNumber, gaYear, thesisId, instructorId],
      },
      {
        query: `
          INSERT INTO thesis_status_history
          (thesis_id, old_status, new_status, changed_by, changed_at)
          VALUES (?, 'Active', 'Cancelled', ?, CURRENT_TIMESTAMP)
        `,
        params: [thesisId, `Instructor (${instructorId})`],
      },
    ];

    const results = await executeTransaction(operations);
    const updateResult = results[0];

    if (updateResult.changes === 0) {
      throw new Error(
        "Failed to cancel thesis. Please check if thesis is Active and you are the supervisor.",
      );
    }

    return { success: true };
  }

  async getThesisById(thesisId) {
    try {
      return await require("../db/database").getThesisById(thesisId);
    } catch (error) {
      console.error("Error getting thesis by ID:", error);
      throw error;
    }
  }

  async changeStatusToUnderExamination(thesisId, instructorId) {
    // Transaction: update status and insert into status history
    const operations = [
      {
        query: `
          UPDATE theses
          SET status = 'Under Examination'
          WHERE id = ? AND supervisor_id = ? AND status = 'Active'
        `,
        params: [thesisId, instructorId],
      },
      {
        query: `
          INSERT INTO thesis_status_history
          (thesis_id, old_status, new_status, changed_by, changed_at)
          VALUES (?, 'Active', 'Under Examination', ?, CURRENT_TIMESTAMP)
        `,
        params: [thesisId, `Instructor (${instructorId})`],
      },
    ];

    const results =
      await require("../db/database").executeTransaction(operations);
    const updateResult = results[0];

    if (updateResult.changes === 0) {
      return {
        success: false,
        message:
          "Failed to change status. Please check if thesis is Active and you are the supervisor.",
      };
    }

    return { success: true };
  }
  async retrievePresentationDetailsForAnnouncement(thesisId, instructorId) {
    return getThesisPresentationDetailsForAnnouncement(thesisId, instructorId);
  }

  async getThesisDraftPath(thesisId) {
    try {
      const thesis = await getOne(
        `SELECT draft_path, status FROM theses WHERE id = ?`,
        [thesisId],
      );

      if (!thesis || !thesis.draft_path) {
        return null;
      }

      return thesis.draft_path;
    } catch (error) {
      console.error("Error getting thesis draft path:", error);
      throw error;
    }
  }

  async getAllGradesForThesis(thesisId) {
    try {
      return await getThesisGrades(thesisId);
    } catch (error) {
      console.error("Error getting thesis grades:", error);
      throw error;
    }
  }

  async saveInstructorGrade(instructorId, thesisId, gradeData) {
    try {
      const { gradeValue, criteria, comments } = gradeData;

      // Validate grade value
      if (gradeValue < 0 || gradeValue > 10) {
        throw new Error("Grade must be between 0 and 10");
      }

      // Check if grading is active
      const gradingStatus = await isGradingActive(thesisId);
      if (!gradingStatus || !gradingStatus.grading_active) {
        throw new Error("Grading is not active for this thesis");
      }

      // Save the grade
      const criteriaJson = criteria ? JSON.stringify(criteria) : null;
      await upsertGrade(
        thesisId,
        instructorId,
        gradeValue,
        criteriaJson,
        comments,
      );

      // Check if all required graders have submitted
      const submittedCount = await countSubmittedGrades(thesisId);
      const expectedCount = await countExpectedGraders(thesisId);

      let allGradesSubmitted = false;
      if (submittedCount.count >= expectedCount.count) {
        // All grades submitted, update thesis status
        await executeRun(`UPDATE theses SET status = 'Graded' WHERE id = ?`, [
          thesisId,
        ]);
        allGradesSubmitted = true;
      }

      return {
        success: true,
        allGradesSubmitted,
        submittedCount: submittedCount.count,
        expectedCount: expectedCount.count,
      };
    } catch (error) {
      console.error("Error saving instructor grade:", error);
      throw error;
    }
  }

  async setThesisGradingStatus(thesisId, supervisorId, active = true) {
    try {
      const result = await activateThesisGrading(thesisId, supervisorId);
      if (result.changes === 0) {
        throw new Error(
          "Failed to activate grading. Only the supervisor can activate grading.",
        );
      }
      return { success: true };
    } catch (error) {
      console.error("Error setting grading status:", error);
      throw error;
    }
  }

  async checkGradingAccess(instructorId, thesisId) {
    try {
      // Check if instructor is supervisor or committee member
      const query = `
          SELECT
            t.id,
            t.status,
            t.grading_active,
            CASE
              WHEN t.supervisor_id = ? THEN 'supervisor'
              WHEN cm.instructor_id = ? THEN 'committee'
              ELSE NULL
            END as instructor_role
          FROM theses t
          LEFT JOIN committee_members cm ON cm.thesis_id = t.id AND cm.instructor_id = ? AND cm.status = 'Accepted'
          WHERE t.id = ?
        `;

      const access = await getOne(query, [
        instructorId,
        instructorId,
        instructorId,
        thesisId,
      ]);

      if (!access || !access.instructor_role) {
        return { hasAccess: false, reason: "Not authorized for this thesis" };
      }

      if (access.status !== "Under Examination") {
        return { hasAccess: false, reason: "Thesis is not under examination" };
      }

      if (!access.grading_active) {
        return {
          hasAccess: false,
          reason: "Grading not activated",
          canActivate: access.instructor_role === "supervisor",
        };
      }

      return {
        hasAccess: true,
        role: access.instructor_role,
        canActivate: access.instructor_role === "supervisor",
      };
    } catch (error) {
      console.error("Error checking grading access:", error);
      throw error;
    }
  }

  async updateRepositoryLink(thesisId, nemertisLink, studentId) {
    return executeRun(
      "UPDATE theses SET library_link = ? WHERE id = ? AND student_id = ?",
      [nemertisLink, thesisId, studentId],
    );
  }

  async getThesesByStatuses(statuses) {
    const placeholders = statuses.map(() => "?").join(",");
    const query = `
        SELECT
          t.*,
          s.full_name as student_name,
          s.email as student_email,
          i.full_name as supervisor_name,
          i.email as supervisor_email,
          tt.title as topic_title,
          tt.description as topic_description,
          tt.document_path as topic_document_path,
          GROUP_CONCAT(cm2.full_name, ', ') as committee_members
        FROM theses t
        JOIN users s ON t.student_id = s.id
        JOIN users i ON t.supervisor_id = i.id
        JOIN thesis_topics tt ON t.topic_id = tt.id
        LEFT JOIN committee_members cm ON cm.thesis_id = t.id
        LEFT JOIN users cm2 ON cm2.id = cm.instructor_id
        WHERE t.status IN (${placeholders})
        GROUP BY t.id
        ORDER BY t.assigned_date DESC
      `;
    return executeQuery(query, statuses);
  }

  // Returns all thesis details for secretariat view, including committee and elapsed time.
  async getFullThesisDetails(thesisId) {
    // Get thesis, topic, student, supervisor
    const thesis = await getOne(
      `
        SELECT
          t.*,
          tt.title as topic_title,
          tt.description as topic_description,
          tt.document_path as topic_document_path,
          s.full_name as student_name,
          s.email as student_email,
          i.full_name as supervisor_name,
          i.email as supervisor_email
        FROM theses t
        JOIN thesis_topics tt ON t.topic_id = tt.id
        JOIN users s ON t.student_id = s.id
        JOIN users i ON t.supervisor_id = i.id
        WHERE t.id = ?
        `,
      [thesisId],
    );
    if (!thesis) return null;

    // Get committee members
    const committee = await executeQuery(
      `
        SELECT u.full_name, u.email, cm.status
        FROM committee_members cm
        JOIN users u ON cm.instructor_id = u.id
        WHERE cm.thesis_id = ?
        `,
      [thesisId],
    );

    // Calculate elapsed time since assignment
    let elapsedDays = null,
      elapsedYears = null;
    if (thesis.assigned_date) {
      const assigned = new Date(thesis.assigned_date);
      const now = new Date();
      elapsedDays = Math.floor((now - assigned) / (1000 * 60 * 60 * 24));
      elapsedYears = (elapsedDays / 365).toFixed(1);
    }

    return {
      ...thesis,
      committee,
      elapsedDays,
      elapsedYears,
    };
  }
}

module.exports = new ThesisService();
