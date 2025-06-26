const instructorService = require("../services/instructorService");
const studentService = require("../services/studentService");
const { Parser } = require("json2csv");

class InstructorController {
  async createTopic(req, res) {
    try {
      const instructorId = req.session.userId;
      const { title, description } = req.body;
      const file = req.file; // multer attaches file if uploaded

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: "Title and description are required.",
        });
      }

      const result = await instructorService.processNewTopic(
        instructorId,
        title,
        description,
        file,
      );

      if (result.success) {
        return res.status(201).json({
          success: true,
          topicId: result.topicId,
          message: "Topic created successfully.",
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.message || "Failed to create topic.",
        });
      }
    } catch (error) {
      console.error("Create topic error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }
  // GET topic details for editing
  async getTopicDetailsForEdit(req, res) {
    try {
      const instructorId = req.session.userId;
      const topicId = req.params.topicId;
      const topic = await instructorService.getThesisTopicDetails(
        topicId,
        instructorId,
      );
      if (!topic) {
        return res
          .status(404)
          .json({ success: false, message: "Topic not found" });
      }
      return res.json({ success: true, topic });
    } catch (error) {
      console.error("Get topic details error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // POST update topic
  async updateTopic(req, res) {
    try {
      const instructorId = req.session.userId;
      const topicId = req.params.topicId;
      const { title, description, existingDocumentPath } = req.body;
      const file = req.file;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: "Title and description are required.",
        });
      }

      const result = await instructorService.processTopicUpdate(
        topicId,
        instructorId,
        { title, description, existingDocumentPath },
        file,
      );

      if (result.changes > 0) {
        return res.json({
          success: true,
          message: "Topic updated successfully.",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Topic not found or no changes made.",
        });
      }
    } catch (error) {
      console.error("Update topic error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async deleteTopic(req, res) {
    try {
      const instructorId = req.session.userId;
      const topicId = req.params.topicId;
      const result = await instructorService.deleteTopic(topicId, instructorId);
      if (result.changes > 0) {
        return res.json({ success: true, message: "Topic deleted." });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Topic not found or not deleted." });
      }
    } catch (error) {
      console.error("Delete topic error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async getMyTopics(req, res) {
    try {
      const instructorId = req.session.userId;
      const topics =
        await instructorService.getTopicsByInstructor(instructorId);
      return res.json({ success: true, topics });
    } catch (error) {
      console.error("Get instructor topics error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async getAvailableTopics(req, res) {
    try {
      const instructorId = req.session.userId;
      const topics =
        await instructorService.getAvailableTopicsForAssignment(instructorId);
      return res.json({ success: true, topics });
    } catch (error) {
      console.error("Get available topics error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async searchStudent(req, res) {
    try {
      const query = req.query.query;
      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const students = await studentService.findStudentByIdOrName(query);
      return res.json({ success: true, students });
    } catch (error) {
      console.error("Student search error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async assignTopicToStudent(req, res) {
    try {
      const instructorId = req.session.userId;
      const { topicId, studentId } = req.body;

      if (!topicId || !studentId) {
        return res.status(400).json({
          success: false,
          message: "Topic ID and Student ID are required",
        });
      }

      const result = await instructorService.assignThesisTopicTemporarily(
        instructorId,
        topicId,
        studentId,
      );

      if (result.success) {
        return res.json({
          success: true,
          message: "Topic assigned successfully to student",
          assignmentId: result.assignmentId,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || "Failed to assign topic",
        });
      }
    } catch (error) {
      console.error("Assign topic error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async getCurrentAssignments(req, res) {
    try {
      const instructorId = req.session.userId;
      const assignments =
        await instructorService.getCurrentAssignments(instructorId);
      return res.json({ success: true, assignments });
    } catch (error) {
      console.error("Get current assignments error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async cancelAssignment(req, res) {
    try {
      const instructorId = req.session.userId;
      const assignmentId = req.params.assignmentId;

      const result = await instructorService.cancelAssignment(
        instructorId,
        assignmentId,
      );

      if (result.success) {
        return res.json({
          success: true,
          message: "Assignment cancelled successfully",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || "Failed to cancel assignment",
        });
      }
    } catch (error) {
      console.error("Cancel assignment error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async getThesesList(req, res) {
    try {
      const instructorId = req.session.userId;
      const { status, role, format } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (role) filters.role = role;

      const theses = await instructorService.getAllThesesForInstructor(
        instructorId,
        filters,
      );

      if (format === "csv") {
        // Convert to CSV
        const fields = [
          { label: "Thesis ID", value: "thesis_id" },
          { label: "Topic Title", value: "topic_title" },
          { label: "Student Name", value: "student_name" },
          { label: "Supervisor Name", value: "supervisor_name" },
          { label: "Committee Members", value: "committee_members" },
          { label: "Status", value: "status" },
          { label: "Assigned Date", value: "assigned_date" },
          { label: "Completion Date", value: "completion_date" },
          { label: "Grade", value: "grade" },
          { label: "AP Number", value: "ap_number" },
          { label: "Library Link", value: "library_link" },
          { label: "Role", value: "instructor_role" },
        ];
        const parser = new Parser({ fields });
        const csv = parser.parse(theses);

        res.header("Content-Type", "text/csv");
        res.attachment("theses.csv");
        return res.send(csv);
      } else if (format === "json") {
        res.header("Content-Type", "application/json");
        res.attachment("theses.json");
        return res.send(JSON.stringify(theses, null, 2));
      } else {
        // Default: JSON API
        return res.json({ success: true, theses });
      }
    } catch (error) {
      console.error("Get theses list error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
}

module.exports = new InstructorController();
