const path = require("path");
const thesisService = require("./thesisService");
const studentService = require("./studentService");
const {
  findInstructors,
  executeQuery,
  getCommitteeInvitationsForInstructor,
  getCommitteeInvitationById,
  updateCommitteeInvitationStatus,
  countAcceptedCommitteeMembers,
  updateThesisStatus,
} = require("../db/database");

class InstructorService {
  async processNewTopic(instructorId, title, description, file) {
    try {
      let documentPath = null;
      if (file) {
        // Save relative path for serving
        documentPath = "/uploads/topics/" + file.filename;
      }
      const topicId = await thesisService.createThesisTopic(
        instructorId,
        title,
        description,
        documentPath,
      );
      return { success: true, topicId };
    } catch (error) {
      console.error("InstructorService error:", error);
      return { success: false, message: error.message };
    }
  }

  async getThesisTopicDetails(topicId, instructorId) {
    return thesisService.retrieveThesisTopic(topicId, instructorId);
  }

  async getTopicsByInstructor(instructorId) {
    return thesisService.getTopicsByInstructor(instructorId);
  }

  async deleteTopic(topicId, instructorId) {
    return thesisService.deleteThesisTopic(topicId, instructorId);
  }

  async getAllThesesForInstructor(instructorId, filters) {
    return thesisService.getThesesForInstructor(instructorId, filters);
  }

  async getAllInstructors(query) {
    return findInstructors(query || "");
  }

  async getCommitteeInvitations(instructorId) {
    return getCommitteeInvitationsForInstructor(instructorId);
  }

  async processTopicUpdate(topicId, instructorId, updatedData, file) {
    let documentPath = updatedData.existingDocumentPath || null;
    if (file) {
      documentPath = "/uploads/topics/" + file.filename;
    }
    const result = await thesisService.updateThesisTopic(
      topicId,
      instructorId,
      updatedData.title,
      updatedData.description,
      documentPath,
    );
    return result;
  }

  async getAvailableTopicsForAssignment(instructorId) {
    try {
      return thesisService.getAvailableTopicsForAssignment(instructorId);
    } catch (error) {
      console.error("Error getting available topics:", error);
      throw error;
    }
  }

  async assignThesisTopicTemporarily(instructorId, topicId, studentId) {
    try {
      // Verify the topic belongs to this instructor and is available
      const topic = await thesisService.getTopicById(topicId);

      if (!topic) {
        return { success: false, message: "Topic not found" };
      }

      if (topic.instructor_id != instructorId) {
        return {
          success: false,
          message: "You are not authorized to assign this topic",
        };
      }

      if (topic.status !== "Available") {
        return {
          success: false,
          message: "This topic is not available for assignment",
        };
      }

      // Verify the student exists and is a student
      const student = await studentService.getStudentById(studentId);

      if (!student) {
        return { success: false, message: "Student not found" };
      }

      if (student.role !== "student") {
        return { success: false, message: "Selected user is not a student" };
      }

      // Create the assignment
      const result = await thesisService.initiateTemporaryAssignment(
        topicId,
        studentId,
        instructorId,
      );

      return {
        success: true,
        assignmentId: result.lastID,
      };
    } catch (error) {
      console.error("Error assigning topic:", error);
      return { success: false, message: "Internal server error" };
    }
  }

  async getCurrentAssignments(instructorId) {
    try {
      return thesisService.getCurrentAssignmentsByInstructor(instructorId);
    } catch (error) {
      console.error("Error getting current assignments:", error);
      throw error;
    }
  }

  async cancelAssignment(instructorId, assignmentId) {
    try {
      // Verify the assignment is owned by this instructor
      const assignment = await thesisService.getAssignmentById(assignmentId);

      if (!assignment) {
        return { success: false, message: "Assignment not found" };
      }

      if (assignment.supervisor_id != instructorId) {
        return {
          success: false,
          message: "You are not authorized to cancel this assignment",
        };
      }

      // Cancel the assignment
      await thesisService.cancelAssignment(assignmentId);

      return { success: true };
    } catch (error) {
      console.error("Error cancelling assignment:", error);
      return { success: false, message: "Internal server error" };
    }
  }

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

  async getThesisDetailsForInstructor(thesisId, instructorId) {
    // Only allow if instructor is supervisor or committee member
    const query = `
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
        GROUP_CONCAT(cm2.full_name, ', ') as committee_members,
        u.full_name as student_name,
        u.email as student_email
      FROM theses t
      JOIN thesis_topics tt ON t.topic_id = tt.id
      JOIN users s ON t.supervisor_id = s.id
      JOIN users u ON t.student_id = u.id
      LEFT JOIN committee_members cm ON cm.thesis_id = t.id
      LEFT JOIN users cm2 ON cm2.id = cm.instructor_id
      WHERE t.id = ?
        AND (t.supervisor_id = ? OR cm.instructor_id = ?)
      GROUP BY t.id
      LIMIT 1
    `;
    const rows = await require("../db/database").executeQuery(query, [
      thesisId,
      instructorId,
      instructorId,
    ]);
    return rows[0] || null;
  }
  async respondToCommitteeInvitation(instructorId, invitationId, action) {
    // Validate action
    if (!["Accepted", "Rejected"].includes(action)) {
      return { success: false, message: "Invalid action" };
    }

    // Get invitation and check ownership
    const invitation = await getCommitteeInvitationById(
      invitationId,
      instructorId,
    );
    if (!invitation) {
      return { success: false, message: "Invitation not found" };
    }
    if (invitation.status !== "Invited") {
      return { success: false, message: "Invitation already responded to" };
    }

    // Update invitation status
    await updateCommitteeInvitationStatus(invitationId, instructorId, action);

    // If accepted, check if enough members have accepted to activate thesis
    let thesisFinalized = false;
    if (action === "Accepted") {
      const { acceptedCount } = await countAcceptedCommitteeMembers(
        invitation.thesis_id,
      );
      if (acceptedCount >= 2) {
        // Activate thesis
        await updateThesisStatus(invitation.thesis_id, "Active");
        thesisFinalized = true;
      }
    }

    return {
      success: true,
      message: `Invitation ${action.toLowerCase()} successfully`,
      thesisFinalized,
    };
  }

  async retrieveInstructorStatistics(instructorId) {
    // Get stats for supervised theses
    const supervisorStats =
      await thesisService.getStatisticsForSupervisor(instructorId);
    // Get stats for committee member theses
    const committeeStats =
      await thesisService.getStatisticsForCommitteeMember(instructorId);

    return {
      supervisor: supervisorStats,
      committee: committeeStats,
    };
  }

  async recordPrivateThesisNote(instructorId, thesisId, noteText) {
    // Validate note length
    if (!noteText || noteText.length > 300)
      throw new Error("Note must be 1-300 characters");
    return thesisService.savePrivateNote(instructorId, thesisId, noteText);
  }

  async getPrivateNotesForThesis(instructorId, thesisId) {
    return thesisService.getPrivateNotesForInstructor(instructorId, thesisId);
  }

  async cancelActiveThesisBySupervisor(
    instructorId,
    thesisId,
    gaNumber,
    gaYear,
    cancellationReason,
  ) {
    try {
      // Check if the thesis exists and is Active and this instructor is the supervisor
      const thesis = await thesisService.getThesisById(thesisId);

      if (!thesis) {
        return { success: false, message: "Thesis not found" };
      }

      if (thesis.supervisor_id != instructorId) {
        return {
          success: false,
          message: "You are not authorized to cancel this thesis",
        };
      }

      if (thesis.status !== "Active") {
        return {
          success: false,
          message: "Only Active theses can be cancelled",
        };
      }

      // Check if 2 years have passed since assignment
      const assignedDate = new Date(thesis.assigned_date);
      const currentDate = new Date();
      const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;

      if (currentDate - assignedDate < twoYearsInMs) {
        return {
          success: false,
          message:
            "Thesis can only be cancelled after two years from assignment date",
        };
      }

      // Cancel the thesis
      const result = await thesisService.cancelThesisBySupervisor(
        thesisId,
        instructorId,
        gaNumber,
        gaYear,
        cancellationReason,
      );

      return { success: true };
    } catch (error) {
      console.error("Error cancelling active thesis:", error);
      return { success: false, message: "Internal server error" };
    }
  }

  async changeStatusToUnderExamination(instructorId, thesisId) {
    // Only supervisor can do this, and only if thesis is Active
    const thesis = await require("./thesisService").getThesisById(thesisId);
    if (!thesis) {
      return { success: false, message: "Thesis not found" };
    }
    if (thesis.supervisor_id != instructorId) {
      return { success: false, message: "You are not the supervisor" };
    }
    if (thesis.status !== "Active") {
      return { success: false, message: "Thesis is not Active" };
    }
    // Change status
    return require("./thesisService").changeStatusToUnderExamination(
      thesisId,
      instructorId,
    );
  }

  async preparePresentationAnnouncement(instructorId, thesisId) {
    // 1. Get thesis details and check permissions
    const thesis = await require("./thesisService").getThesisById(thesisId);
    if (!thesis) {
      return { success: false, message: "Thesis not found" };
    }
    if (thesis.supervisor_id != instructorId) {
      return {
        success: false,
        message: "You are not the supervisor of this thesis",
      };
    }
    if (thesis.status !== "Under Examination") {
      return { success: false, message: "Thesis is not under examination" };
    }

    // 2. Get presentation details (student, topic, committee, date/time/location)
    const details =
      await require("./thesisService").getPresentationDetailsForAnnouncement(
        thesisId,
      );
    if (!details) {
      return { success: false, message: "Presentation details not found" };
    }

    // 3. Validate required fields
    if (
      !details.presentation_date ||
      !details.presentation_time ||
      !details.presentation_location
    ) {
      return { success: false, message: "Presentation details are incomplete" };
    }

    // 4. Compose announcement text
    const announcement = `Thesis Presentation Announcement

  Student: ${details.student_name}
  Thesis Title: ${details.thesis_title}
  Supervisor: ${details.supervisor_name}
  Committee: ${details.committee_members || "Not assigned"}
  Date: ${details.presentation_date}
  Time: ${details.presentation_time}
  Location: ${details.presentation_location}

  You are invited to attend the thesis presentation.`;

    return { success: true, announcement };
  }
}

module.exports = new InstructorService();
