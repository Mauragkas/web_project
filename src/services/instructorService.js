const path = require("path");
const thesisService = require("./thesisService");
const studentService = require("./studentService");

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
}

module.exports = new InstructorService();
