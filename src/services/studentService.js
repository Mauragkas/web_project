const { executeQuery, executeRun, getOne } = require("../db/database");
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
        t.draft_path,
        t.external_links,
        tt.title as topic_title,
        tt.description as topic_description,
        tt.document_path as topic_document_path,
        s.full_name as supervisor_name,
        s.email as supervisor_email,
        GROUP_CONCAT(cm2.full_name, ', ') as committee_members,
        u.email, u.street, u.address_number, u.city, u.postcode, u.mobile_telephone, u.landline_telephone
      FROM theses t
      JOIN thesis_topics tt ON t.topic_id = tt.id
      JOIN users s ON t.supervisor_id = s.id
      LEFT JOIN committee_members cm ON cm.thesis_id = t.id
      LEFT JOIN users cm2 ON cm2.id = cm.instructor_id
      JOIN users u ON t.student_id = u.id
      WHERE t.student_id = ?
      GROUP BY t.id
      ORDER BY t.assigned_date DESC
      LIMIT 1
      `,
      [studentId],
    );
    return thesis;
  }

  /**
   * Verify a thesis belongs to a student
   * @param {number} thesisId
   * @param {number} studentId
   * @returns {Promise<boolean>}
   */
  async verifyThesisBelongsToStudent(thesisId, studentId) {
    const thesis = await getOne(
      "SELECT id FROM theses WHERE id = ? AND student_id = ?",
      [thesisId, studentId],
    );
    return !!thesis; // Return true if thesis exists and belongs to student
  }

  async processCommitteeInvitations(thesisId, instructorIds) {
    // Validate: instructorIds is array, thesisId belongs to student, etc.
    if (!Array.isArray(instructorIds) || instructorIds.length === 0) {
      throw new Error("No instructors selected");
    }

    // FIXED: Verify thesis exists before attempting to create invitations
    const thesis = await getOne("SELECT id FROM theses WHERE id = ?", [
      thesisId,
    ]);
    if (!thesis) {
      throw new Error("Thesis not found");
    }

    // Insert invitations
    await thesisService.createCommitteeInvitations(thesisId, instructorIds);
    return { success: true };
  }
  async handleMaterialUpload(thesisId, draftFile, externalLinks) {
    try {
      let draftPath = null;
      if (draftFile) {
        // Save relative path for serving
        draftPath = "/uploads/thesis_drafts/" + draftFile.filename;
      }

      // Store externalLinks as string (could be JSON or newline-separated)
      let linksToStore = externalLinks;
      if (Array.isArray(externalLinks)) {
        linksToStore = externalLinks.join("\n");
      }

      // Update thesis record
      const result = await executeRun(
        `UPDATE theses SET draft_path = ?, external_links = ? WHERE id = ?`,
        [draftPath, linksToStore, thesisId],
      );

      if (result.changes > 0) {
        return { success: true };
      } else {
        return {
          success: false,
          message: "No changes made or thesis not found",
        };
      }
    } catch (error) {
      console.error("handleMaterialUpload error:", error);
      return { success: false, message: "Internal server error" };
    }
  }

  async retrievePresentationDetails(studentId, thesisId) {
    try {
      // Verify ownership first
      const thesis = await getOne(
        "SELECT id, status FROM theses WHERE id = ? AND student_id = ?",
        [thesisId, studentId],
      );

      if (!thesis) {
        throw new Error("Thesis not found or access denied");
      }

      if (thesis.status !== "Under Examination") {
        throw new Error(
          "Thesis must be Under Examination to view presentation details",
        );
      }

      // Get presentation details
      const details = await getOne(
        `SELECT
          presentation_date,
          presentation_time,
          presentation_location,
          presentation_location_type,
          connection_link
        FROM theses
        WHERE id = ?`,
        [thesisId],
      );

      return {
        presentationDate: details?.presentation_date || "",
        presentationTime: details?.presentation_time || "",
        examinationMethod: details?.presentation_location_type || "in-person",
        location: details?.presentation_location || "",
        connectionLink: details?.connection_link || "",
      };
    } catch (error) {
      console.error("Error retrieving presentation details:", error);
      throw error;
    }
  }

  async savePresentationDetails(studentId, thesisId, presentationData) {
    try {
      const {
        presentationDate,
        presentationTime,
        examinationMethod,
        location,
        connectionLink,
      } = presentationData;

      // Verify ownership and status
      const thesis = await getOne(
        "SELECT id, status FROM theses WHERE id = ? AND student_id = ?",
        [thesisId, studentId],
      );

      if (!thesis) {
        return { success: false, message: "Thesis not found or access denied" };
      }

      if (thesis.status !== "Under Examination") {
        return {
          success: false,
          message:
            "Thesis must be Under Examination to record presentation details",
        };
      }

      // Prepare location and connection link based on examination method
      const finalLocation = examinationMethod === "in-person" ? location : "";
      const finalConnectionLink =
        examinationMethod === "online" ? connectionLink : "";

      // Update presentation details
      const result = await executeRun(
        `UPDATE theses
         SET presentation_date = ?,
             presentation_time = ?,
             presentation_location = ?,
             presentation_location_type = ?,
             connection_link = ?
         WHERE id = ? AND student_id = ?`,
        [
          presentationDate,
          presentationTime,
          finalLocation,
          examinationMethod,
          finalConnectionLink,
          thesisId,
          studentId,
        ],
      );

      if (result.changes > 0) {
        return { success: true };
      } else {
        return {
          success: false,
          message: "No changes made or thesis not found",
        };
      }
    } catch (error) {
      console.error("Error saving presentation details:", error);
      return { success: false, message: "Internal server error" };
    }
  }

  async generateExaminationReport(studentId, thesisId) {
    const thesis = await getOne(
      `SELECT t.*,
                tt.title as topic_title, tt.description as topic_description, tt.document_path as topic_document_path,
                s.full_name as supervisor_name, s.email as supervisor_email,
                u.full_name as student_name, u.email as student_email,
                GROUP_CONCAT(cm2.full_name, ', ') as committee_members
         FROM theses t
         JOIN thesis_topics tt ON t.topic_id = tt.id
         JOIN users s ON t.supervisor_id = s.id
         JOIN users u ON t.student_id = u.id
         LEFT JOIN committee_members cm ON cm.thesis_id = t.id AND cm.status = 'Accepted'
         LEFT JOIN users cm2 ON cm2.id = cm.instructor_id
         WHERE t.id = ? AND t.student_id = ? AND t.status IN ('Under Examination', 'Graded', 'Completed')
         GROUP BY t.id
      `,
      [thesisId, studentId],
    );
    if (!thesis) return null;

    const grades = await executeQuery(
      `SELECT g.*,
                u.full_name as instructor_name,
                CASE WHEN t.supervisor_id = g.instructor_id THEN 'Supervisor' ELSE 'Committee Member' END as instructor_role
         FROM grades g
         JOIN users u ON g.instructor_id = u.id
         JOIN theses t ON g.thesis_id = t.id
         WHERE g.thesis_id = ?
         ORDER BY instructor_role DESC, g.created_at ASC`,
      [thesisId],
    );

    if (!grades || grades.length === 0) return null;

    const avgGrade =
      grades.reduce((sum, g) => sum + (g.grade_value || 0), 0) / grades.length;

    const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Examination Report - ${thesis.topic_title}</title>
    <link rel="stylesheet" href="/css/style.css">
    <style>
      body { background: #f9fafb; color: #222; font-family: Inter, sans-serif; }
      .report-container { max-width: 700px; margin: 2rem auto; background: #fff; border-radius: 1rem; box-shadow: 0 2px 8px #0001; padding: 2rem; }
      .report-title { font-size: 2rem; font-weight: bold; color: #4f46e5; margin-bottom: 1rem; }
      .section-title { font-size: 1.2rem; font-weight: 600; margin-top: 2rem; margin-bottom: 0.5rem; color: #4338ca; }
      .grades-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
      .grades-table th, .grades-table td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; }
      .grades-table th { background: #f3f4f6; }
      .criteria-json { font-size: 0.95em; color: #374151; background: #f9fafb; border-radius: 0.25rem; padding: 0.25rem 0.5rem; }
      .avg-grade { font-size: 1.5rem; color: #10b981; font-weight: bold; }
      .comments { color: #374151; font-style: italic; }
    </style>
  </head>
  <body>
    <div class="report-container">
      <div class="report-title">Examination Report</div>
      <div>
        <span class="section-title">Thesis Title:</span>
        <div>${thesis.topic_title}</div>
      </div>
      <div>
        <span class="section-title">Student:</span>
        <div>${thesis.student_name} (${thesis.student_email || "-"})</div>
      </div>
      <div>
        <span class="section-title">Supervisor:</span>
        <div>${thesis.supervisor_name} (${thesis.supervisor_email || "-"})</div>
      </div>
      <div>
        <span class="section-title">Status:</span>
        <div>${thesis.status}</div>
      </div>
      <div>
        <span class="section-title">Presentation Date/Time:</span>
        <div>
          ${thesis.presentation_date ? new Date(thesis.presentation_date).toLocaleDateString() : "-"}
          ${thesis.presentation_time ? "at " + thesis.presentation_time : ""}
        </div>
      </div>
      <div>
        <span class="section-title">Committee Members:</span>
        <div>${thesis.committee_members || "-"}</div>
      </div>
      <div>
        <span class="section-title">Grades:</span>
        <table class="grades-table">
          <thead>
            <tr>
              <th>Instructor</th>
              <th>Role</th>
              <th>Grade</th>
              <th>Criteria</th>
              <th>Comments</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            ${grades
              .map(
                (g) => `
              <tr>
                <td>${g.instructor_name}</td>
                <td>${g.instructor_role}</td>
                <td style="font-weight:bold; color:#4f46e5;">${g.grade_value}/10</td>
                <td>
                  ${
                    g.criteria_json
                      ? `<span class="criteria-json">${formatCriteria(g.criteria_json)}</span>`
                      : "-"
                  }
                </td>
                <td class="comments">${g.comments ? escapeHtml(g.comments) : "-"}</td>
                <td>${g.created_at ? new Date(g.created_at).toLocaleString() : "-"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div class="mt-4">
          <span class="section-title">Average Grade:</span>
          <span class="avg-grade">${avgGrade.toFixed(2)} / 10</span>
        </div>
      </div>
      <div style="margin-top:2rem;">
        <a href="#" onclick="window.close();return false;" style="color:#4f46e5;text-decoration:underline;">Close Report</a>
      </div>
    </div>
  </body>
  </html>
  `;

    return html;

    // Helper to pretty-print criteria JSON
    function formatCriteria(json) {
      try {
        const obj = JSON.parse(json);
        return Object.entries(obj)
          .map(([k, v]) => `<b>${escapeHtml(k)}:</b> ${escapeHtml(v)}`)
          .join("<br>");
      } catch {
        return escapeHtml(json);
      }
    }
    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
  }

  async saveRepositoryLink(studentId, thesisId, nemertisLink) {
    const thesis = await getOne(
      "SELECT id, status FROM theses WHERE id = ? AND student_id = ?",
      [thesisId, studentId],
    );
    if (!thesis) {
      return { success: false, message: "Thesis not found or access denied." };
    }
    if (!["Under Examination", "Graded", "Completed"].includes(thesis.status)) {
      return {
        success: false,
        message:
          "Repository link can only be recorded for theses under examination or graded.",
      };
    }

    const grades = await executeQuery(
      "SELECT COUNT(*) as cnt FROM grades WHERE thesis_id = ?",
      [thesisId],
    );
    if (!grades[0] || grades[0].cnt === 0) {
      return {
        success: false,
        message:
          "Grades must be recorded before submitting the repository link.",
      };
    }

    const result = await executeRun(
      "UPDATE theses SET library_link = ? WHERE id = ? AND student_id = ?",
      [nemertisLink, thesisId, studentId],
    );
    if (result.changes > 0) {
      return { success: true };
    } else {
      return {
        success: false,
        message: "No changes made or thesis not found.",
      };
    }
  }

  async retrieveCompletedThesisInfo(studentId, thesisId) {
    // Get thesis details (ensure status is Completed and belongs to student)
    const details = await getOne(
      `
          SELECT
              t.*,
              tt.title as topic_title,
              tt.description as topic_description,
              tt.document_path as topic_document_path,
              s.full_name as student_name,
              s.email as student_email,
              i.full_name as supervisor_name,
              i.email as supervisor_email,
              GROUP_CONCAT(cm2.full_name, ', ') as committee_members
          FROM theses t
          JOIN thesis_topics tt ON t.topic_id = tt.id
          JOIN users s ON t.student_id = s.id
          JOIN users i ON t.supervisor_id = i.id
          LEFT JOIN committee_members cm ON cm.thesis_id = t.id
          LEFT JOIN users cm2 ON cm2.id = cm.instructor_id
          WHERE t.id = ? AND t.student_id = ? AND t.status = 'Completed'
          GROUP BY t.id
          LIMIT 1
      `,
      [thesisId, studentId],
    );
    if (!details) return null;

    // Get status history
    const statusHistory = await executeQuery(
      `SELECT * FROM thesis_status_history WHERE thesis_id = ? ORDER BY changed_at ASC`,
      [thesisId],
    );

    // Get grades
    const grades = await executeQuery(
      `SELECT g.*, u.full_name as instructor_name,
                  CASE WHEN t.supervisor_id = g.instructor_id THEN 'Supervisor' ELSE 'Committee Member' END as instructor_role
           FROM grades g
           JOIN users u ON g.instructor_id = u.id
           JOIN theses t ON g.thesis_id = t.id
           WHERE g.thesis_id = ?
           ORDER BY instructor_role DESC, g.created_at ASC`,
      [thesisId],
    );

    return { details, statusHistory, grades };
  }
}

module.exports = new StudentService();
