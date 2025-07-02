const thesisService = require("./thesisService");

class SecretariatService {
  async retrieveActiveAndUnderExaminationTheses() {
    // Use thesisService to get theses by statuses
    return thesisService.getThesesByStatuses(["Active", "Under Examination"]);
  }
}

module.exports = new SecretariatService();
