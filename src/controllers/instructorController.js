const instructorService = require("../services/instructorService");

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
}

module.exports = new InstructorController();
