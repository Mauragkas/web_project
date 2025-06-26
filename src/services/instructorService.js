const path = require("path");
const thesisService = require("./thesisService");

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
}

module.exports = new InstructorService();
