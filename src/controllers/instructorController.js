const instructorService = require("../services/instructorService");

class InstructorController {
  async createTopic(req, res) {
    try {
      const instructorId = req.session.userId;
      const { title, description } = req.body;
      const file = req.file; // multer attaches file if uploaded

      if (!title || !description) {
        return res
          .status(400)
          .json({
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
        return res
          .status(201)
          .json({
            success: true,
            topicId: result.topicId,
            message: "Topic created successfully.",
          });
      } else {
        return res
          .status(500)
          .json({
            success: false,
            message: result.message || "Failed to create topic.",
          });
      }
    } catch (error) {
      console.error("Create topic error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }
}

module.exports = new InstructorController();
