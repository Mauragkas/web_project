/**
 * Instructor active thesis cancellation modal
 * Single Responsibility: Cancel active thesis workflow (modal + form)
 */

import { loadInstructorTheses } from "./theses.js";

/**
 * Shows the cancel active thesis modal with the given thesis info
 * @param {string|number} thesisId
 * @param {string} thesisTitle
 */
export function showCancelActiveThesisModal(thesisId, thesisTitle) {
  if (!document.getElementById("cancelActiveThesisModal")) {
    _createCancelModal();
  }

  document.getElementById("cancelThesisTitle").textContent = thesisTitle;
  document.getElementById("cancelThesisId").value = thesisId;
  document.getElementById("gaNumber").value = "";
  document.getElementById("gaYear").value = "";
  document.getElementById("cancellationReason").value = "";
  document.getElementById("cancelThesisMessage").classList.add("hidden");
  document.getElementById("cancelActiveThesisModal").classList.remove("hidden");
}

/**
 * Closes the cancel thesis modal
 */
export function closeCancelThesisModal() {
  document.getElementById("cancelActiveThesisModal")?.classList.add("hidden");
}

/**
 * Creates and appends the cancellation modal to the body
 * @private
 */
function _createCancelModal() {
  const modalHTML = `
    <div id="cancelActiveThesisModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full relative p-6">
        <button id="closeCancelThesisModal" class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        <h2 class="text-2xl font-bold mb-4 text-red-600">Cancel Active Thesis</h2>
        <p class="mb-4 text-gray-700">You're about to cancel the thesis: <span id="cancelThesisTitle" class="font-semibold"></span></p>
        <p class="mb-4 text-gray-700">This action requires General Assembly approval and can only be done after two years from the assignment date.</p>
        <form id="cancelActiveThesisForm">
          <input type="hidden" id="cancelThesisId" value="">
          <div class="mb-4">
            <label for="gaNumber" class="block text-gray-700 font-semibold mb-1">General Assembly Number <span class="text-red-500">*</span></label>
            <input type="text" id="gaNumber" name="gaNumber" class="form-input" required>
          </div>
          <div class="mb-4">
            <label for="gaYear" class="block text-gray-700 font-semibold mb-1">General Assembly Year <span class="text-red-500">*</span></label>
            <input type="text" id="gaYear" name="gaYear" class="form-input" required>
          </div>
          <div class="mb-4">
            <label for="cancellationReason" class="block text-gray-700 font-semibold mb-1">Additional Notes (Optional)</label>
            <textarea id="cancellationReason" name="cancellationReason" rows="3" class="form-input"></textarea>
          </div>
          <div id="cancelThesisMessage" class="text-center text-sm font-medium hidden mb-4"></div>
          <div class="flex justify-end space-x-4">
            <button type="button" id="cancelThesisModalClose" class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Confirm Cancellation</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const container = document.createElement("div");
  container.innerHTML = modalHTML;
  document.body.appendChild(container);

  document
    .getElementById("closeCancelThesisModal")
    ?.addEventListener("click", closeCancelThesisModal);
  document
    .getElementById("cancelThesisModalClose")
    ?.addEventListener("click", closeCancelThesisModal);
  document
    .getElementById("cancelActiveThesisForm")
    ?.addEventListener("submit", _handleCancelActiveThesisSubmit);
}

/**
 * Handles the cancel active thesis form submission
 * @private
 * @param {Event} e
 */
async function _handleCancelActiveThesisSubmit(e) {
  e.preventDefault();

  const thesisId = document.getElementById("cancelThesisId").value;
  const gaNumber = document.getElementById("gaNumber").value;
  const gaYear = document.getElementById("gaYear").value;
  const cancellationReason =
    document.getElementById("cancellationReason").value;
  const messageElement = document.getElementById("cancelThesisMessage");

  messageElement.classList.add("hidden");

  try {
    const response = await fetch(
      `/instructor/api/instructor/theses/${thesisId}/cancel-active`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gaNumber, gaYear, cancellationReason }),
      },
    );

    const data = await response.json();

    if (data.success) {
      messageElement.textContent = "Thesis cancelled successfully!";
      messageElement.classList.remove("hidden", "text-red-600");
      messageElement.classList.add("text-green-600");

      setTimeout(() => {
        closeCancelThesisModal();
        loadInstructorTheses();
      }, 1500);
    } else {
      messageElement.textContent = data.message || "Failed to cancel thesis";
      messageElement.classList.remove("hidden", "text-green-600");
      messageElement.classList.add("text-red-600");
    }
  } catch (error) {
    console.error("Error cancelling thesis:", error);
    messageElement.textContent = "Server error. Please try again.";
    messageElement.classList.remove("hidden", "text-green-600");
    messageElement.classList.add("text-red-600");
  }
}
