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
}

module.exports = new InstructorService();
