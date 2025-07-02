const thesisService = require("./thesisService");

class SecretariatService {
  async retrieveActiveAndUnderExaminationTheses() {
    return thesisService.getThesesByStatuses(["Active", "Under Examination"]);
  }

  async retrieveThesisDetails(thesisId) {
    return thesisService.getFullThesisDetails(thesisId);
  }
}

module.exports = new SecretariatService();
