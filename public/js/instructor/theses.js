/**
 * Instructor thesis list, details modal, and related actions
 * Single Responsibility: Thesis list rendering and thesis details modal
 */

import { showLoading, showError, capitalizeFirstLetter } from "../utils/ui.js";
import { downloadFile } from "../utils/fileDownload.js";
import { setupGradingInterface } from "./grading.js";
import { showCancelActiveThesisModal } from "./cancellation.js";

// Track current thesis ID for notes context
let currentThesisDetailsId = null;

/**
 * Loads and renders the instructor's theses list with optional filters
 */
export async function loadInstructorTheses() {
  const listDiv = document.getElementById("instructor-theses-list");
  if (!listDiv) return;

  const status = document.getElementById("thesis-status-filter")?.value || "";
  const role = document.getElementById("thesis-role-filter")?.value || "";

  let url = "/instructor/api/instructor/theses";
  const params = [];
  if (status) params.push(`status=${encodeURIComponent(status)}`);
  if (role) params.push(`role=${encodeURIComponent(role)}`);
  if (params.length) url += "?" + params.join("&");

  showLoading(listDiv, "Loading theses...");

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      showError(listDiv, "Failed to load theses.");
      return;
    }

    if (!data.theses || !data.theses.length) {
      listDiv.innerHTML = `<div class="text-gray-500 text-center">No theses found.</div>`;
      return;
    }

    listDiv.innerHTML = data.theses
      .map((thesis) => {
        const borderColor =
          thesis.status === "Completed"
            ? "border-green-500"
            : thesis.status === "Cancelled"
              ? "border-red-500"
              : "border-indigo-500";

        const role = capitalizeFirstLetter(
          thesis.instructor_role ||
            (thesis.supervisor_id == window.currentUserId
              ? "supervisor"
              : "committee"),
        );

        return `
          <div class="bg-white bg-opacity-60 p-3 rounded-md mb-2 flex flex-col md:flex-row justify-between items-start md:items-center border-l-4 ${borderColor}">
            <div>
              <p class="font-semibold">${thesis.topic_title}</p>
              <p class="text-sm text-gray-500">Student: ${thesis.student_name}</p>
              <p class="text-sm text-gray-500">Status: ${thesis.status}</p>
              <p class="text-xs text-gray-400">Assigned: ${thesis.assigned_date ? new Date(thesis.assigned_date).toLocaleDateString() : "-"}</p>
              <p class="text-xs text-gray-400">Role: ${role}</p>
            </div>
            <div class="mt-2 md:mt-0">
              <button
                class="text-sm text-indigo-600 hover:underline mr-2 view-thesis-details-btn"
                data-thesis-id="${thesis.thesis_id}"
              >
                View Details
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    document.querySelectorAll(".view-thesis-details-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        showThesisDetailsModal(btn.getAttribute("data-thesis-id"));
      });
    });
  } catch (err) {
    showError(listDiv, "Server error loading theses.");
  }
}

/**
 * Initializes filter and export controls for the theses section
 */
export function initThesesControls() {
  const statusFilter = document.getElementById("thesis-status-filter");
  const roleFilter = document.getElementById("thesis-role-filter");

  if (statusFilter)
    statusFilter.addEventListener("change", loadInstructorTheses);
  if (roleFilter) roleFilter.addEventListener("change", loadInstructorTheses);

  const exportCsvBtn = document.getElementById("export-theses-csv");
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", function () {
      const status =
        document.getElementById("thesis-status-filter")?.value || "";
      const role = document.getElementById("thesis-role-filter")?.value || "";
      let url = "/instructor/api/instructor/theses?format=csv";
      if (status) url += `&status=${encodeURIComponent(status)}`;
      if (role) url += `&role=${encodeURIComponent(role)}`;
      downloadFile(url, "theses.csv");
    });
  }

  const exportJsonBtn = document.getElementById("export-theses-json");
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", function () {
      const status =
        document.getElementById("thesis-status-filter")?.value || "";
      const role = document.getElementById("thesis-role-filter")?.value || "";
      let url = "/instructor/api/instructor/theses?format=json";
      if (status) url += `&status=${encodeURIComponent(status)}`;
      if (role) url += `&role=${encodeURIComponent(role)}`;
      downloadFile(url, "theses.json");
    });
  }
}

/**
 * Renders notes into a given list element
 * @param {HTMLElement} notesList
 * @param {string|number} thesisId
 */
async function _renderNotesList(notesList, thesisId) {
  notesList.innerHTML = '<div class="text-gray-500">Loading notes...</div>';

  try {
    const res = await fetch(
      `/instructor/api/instructor/theses/${thesisId}/notes`,
    );
    const data = await res.json();

    if (!data.success) {
      notesList.innerHTML = `<div class="text-red-500">${data.message || "Failed to load notes"}</div>`;
      return;
    }

    if (!data.notes || data.notes.length === 0) {
      notesList.innerHTML = `<div class="text-gray-500">No notes yet.</div>`;
      return;
    }

    notesList.innerHTML = data.notes
      .map(
        (n) => `
        <div class="bg-gray-100 rounded p-2 text-sm">
          <span class="text-gray-700">${n.note_text}</span>
          <span class="text-xs text-gray-400 float-right">${new Date(n.created_at).toLocaleString()}</span>
        </div>
      `,
      )
      .join("");
  } catch (err) {
    console.error("Error loading notes:", err);
    notesList.innerHTML = `<div class="text-red-500">Server error loading notes.</div>`;
  }
}

/**
 * Loads notes for the static thesis-details section
 * @param {string|number} thesisId
 */
export async function loadThesisNotes(thesisId) {
  const notesList = document.getElementById("thesisNotesList");
  if (notesList) await _renderNotesList(notesList, thesisId);
}

/**
 * Loads notes for the modal notes list
 * @param {string|number} thesisId
 */
export async function loadModalThesisNotes(thesisId) {
  const notesList = document.getElementById("modalThesisNotesList");
  if (notesList) await _renderNotesList(notesList, thesisId);
}

/**
 * Handles note submission from the thesis details modal
 * @param {Event} e
 */
export async function handleNoteSubmit(e) {
  e.preventDefault();

  const noteText = document.getElementById("modalThesisNoteText")?.value.trim();
  const thesisId = currentThesisDetailsId;
  const messageDiv = document.getElementById("modalThesisNoteMessage");

  if (!messageDiv) return;
  messageDiv.textContent = "";

  if (!noteText || noteText.length > 300) {
    messageDiv.textContent = "Note must be 1-300 characters.";
    messageDiv.className = "text-red-600";
    return;
  }

  try {
    const res = await fetch(
      `/instructor/api/instructor/theses/${thesisId}/notes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteText }),
      },
    );
    const data = await res.json();

    if (data.success) {
      messageDiv.textContent = "Note recorded.";
      messageDiv.className = "text-green-600";
      const textArea = document.getElementById("modalThesisNoteText");
      if (textArea) textArea.value = "";
      loadModalThesisNotes(thesisId);
    } else {
      messageDiv.textContent = data.message || "Failed to record note.";
      messageDiv.className = "text-red-600";
    }
  } catch (err) {
    console.error("Error adding note:", err);
    messageDiv.textContent = "Server error.";
    messageDiv.className = "text-red-600";
  }
}

/**
 * Changes thesis status to Under Examination (supervisor only)
 * @param {string|number} thesisId
 */
export async function changeThesisStatusToUnderExamination(thesisId) {
  try {
    const res = await fetch(
      `/instructor/api/instructor/theses/${thesisId}/change-status-under-examination`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );
    const data = await res.json();

    if (data.success) {
      alert("Thesis status changed to 'Under Examination'.");
      showThesisDetailsModal(thesisId);
      loadInstructorTheses();
    } else {
      alert(data.message || "Failed to change status.");
    }
  } catch (err) {
    alert("Server error. Please try again.");
  }
}

/**
 * Shows the thesis details modal for the given thesis ID
 * @param {string|number} thesisId
 */
export async function showThesisDetailsModal(thesisId) {
  const modal = document.getElementById("thesisDetailsModal");
  const content = document.getElementById("thesis-details-content");
  if (!modal || !content) return;

  modal.classList.remove("hidden");
  content.innerHTML = '<div class="text-center text-gray-500">Loading...</div>';

  currentThesisDetailsId = thesisId;

  try {
    const res = await fetch(
      `/instructor/api/instructor/theses/${thesisId}/details`,
    );
    const data = await res.json();

    if (!data.success) {
      content.innerHTML = `<div class="text-red-500 text-center">${data.message || "Failed to load thesis details."}</div>`;
      return;
    }

    const t = data.thesis;
    const assignedDate = new Date(t.assigned_date);
    const elapsedDays = Math.floor(
      (new Date() - assignedDate) / (1000 * 60 * 60 * 24),
    );
    const elapsedYears = (elapsedDays / 365).toFixed(1);

    const canCancelThesis =
      t.status === "Active" &&
      window.currentUserId == t.supervisor_id &&
      elapsedDays >= 730;

    const canChangeToUnderExamination =
      t.status === "Active" && window.currentUserId == t.supervisor_id;

    content.innerHTML = _buildThesisDetailsHTML(
      t,
      thesisId,
      elapsedDays,
      elapsedYears,
      canCancelThesis,
      canChangeToUnderExamination,
    );

    // Bind presentation events (supervisor + under examination)
    if (
      t.status === "Under Examination" &&
      window.currentUserId == t.supervisor_id
    ) {
      _bindPresentationDetailsEvents(thesisId);
      _bindGenerateAnnouncementEvent(thesisId);
    }

    // Grading interface
    if (t.status === "Under Examination") {
      await setupGradingInterface(thesisId);
    }

    // Notes (active theses only)
    if (t.status === "Active") {
      document
        .getElementById("modalThesisNoteForm")
        ?.addEventListener("submit", handleNoteSubmit);
      loadModalThesisNotes(thesisId);
    }

    // Cancel thesis button
    document
      .getElementById("cancelActiveThesisBtn")
      ?.addEventListener("click", () =>
        showCancelActiveThesisModal(thesisId, t.topic_title),
      );

    // Change to Under Examination button
    document
      .getElementById("changeToUnderExaminationBtn")
      ?.addEventListener("click", () => {
        if (
          confirm(
            "Are you sure you want to change the status to 'Under Examination'? This action cannot be undone.",
          )
        ) {
          changeThesisStatusToUnderExamination(thesisId);
        }
      });
  } catch (err) {
    console.error("Error loading thesis details:", err);
    content.innerHTML = `<div class="text-red-500 text-center">Server error loading thesis details.</div>`;
  }
}

/**
 * Builds the full HTML string for the thesis details modal content
 * @private
 */
function _buildThesisDetailsHTML(
  t,
  thesisId,
  elapsedDays,
  elapsedYears,
  canCancelThesis,
  canChangeToUnderExamination,
) {
  let html = `
    <div>
      <h3 class="text-xl font-semibold mb-2">${t.topic_title}</h3>
      <p><span class="font-semibold">Student:</span> ${t.student_name} (${t.student_email || "-"})</p>
      <p><span class="font-semibold">Supervisor:</span> ${t.supervisor_name} (${t.supervisor_email || "-"})</p>
      <p><span class="font-semibold">Committee:</span> ${t.committee_members || "-"}</p>
      <p><span class="font-semibold">Status:</span> ${t.status}</p>
      <p><span class="font-semibold">Assigned Date:</span> ${t.assigned_date ? new Date(t.assigned_date).toLocaleDateString() : "-"}</p>
      <p><span class="font-semibold">Time Elapsed:</span> ${elapsedDays} days (${elapsedYears} years)</p>
      <p><span class="font-semibold">Completion Date:</span> ${t.completion_date ? new Date(t.completion_date).toLocaleDateString() : "-"}</p>
      <p><span class="font-semibold">Grade:</span> ${t.grade || "-"}</p>
      <p><span class="font-semibold">AP Number:</span> ${t.ap_number || "-"}</p>
      <p><span class="font-semibold">Library Link:</span> ${t.library_link ? `<a href="${t.library_link}" target="_blank" class="text-indigo-600 underline">Nemertis</a>` : "-"}</p>
      <p><span class="font-semibold">Description:</span> ${t.topic_description || "-"}</p>
      <p><span class="font-semibold">Attached File:</span> ${t.topic_document_path ? `<a href="${t.topic_document_path}" target="_blank" class="text-indigo-600 underline">PDF</a>` : "No file"}</p>
  `;

  // Draft section for Under Examination
  if (t.status === "Under Examination") {
    html += `
      <div class="mt-4 p-4 bg-blue-50 rounded-md">
        <h4 class="font-semibold text-lg mb-2">Thesis Draft</h4>
        ${
          t.draft_path
            ? `<a href="${t.draft_path}" target="_blank"
                class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
                View/Download Thesis Draft
              </a>`
            : `<p class="text-gray-600">Student has not uploaded a thesis draft yet.</p>`
        }
      </div>
    `;
  }

  // Cancelled info
  if (t.status === "Cancelled") {
    html += `
      <div class="mt-4 p-4 bg-red-100 rounded-md">
        <p><span class="font-semibold">Cancellation Date:</span> ${t.cancellation_date ? new Date(t.cancellation_date).toLocaleDateString() : "-"}</p>
        <p><span class="font-semibold">GA Number:</span> ${t.ga_number || "-"}</p>
        <p><span class="font-semibold">GA Year:</span> ${t.ga_year || "-"}</p>
        <p><span class="font-semibold">Cancellation Reason:</span> ${t.cancellation_reason || "-"}</p>
      </div>
    `;
  }

  // Cancel button (supervisor, active, 2+ years)
  if (canCancelThesis) {
    html += `
      <div class="mt-6 pt-4 border-t">
        <h4 class="text-lg font-medium mb-2">Supervisor Actions</h4>
        <button id="cancelActiveThesisBtn"
          class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200">
          Cancel Active Thesis
        </button>
        <p class="mt-2 text-sm text-gray-600">
          Note: Cancellation requires General Assembly approval and can only be done after two years.
        </p>
      </div>
    `;
  }

  // Change to Under Examination button (supervisor, active)
  if (canChangeToUnderExamination) {
    html += `
      <div class="mt-6 pt-4 border-t">
        <h4 class="text-lg font-medium mb-2">Supervisor Actions</h4>
        <button id="changeToUnderExaminationBtn"
          class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200">
          Change Status to Under Examination
        </button>
        <p class="mt-2 text-sm text-gray-600">
          This will move the thesis to the examination phase.
        </p>
      </div>
    `;
  }

  // Presentation details section (Under Examination, supervisor only)
  if (
    t.status === "Under Examination" &&
    window.currentUserId == t.supervisor_id
  ) {
    const presentationMissing =
      !t.presentation_date ||
      !t.presentation_time ||
      (t.presentation_location_type === "online"
        ? !t.connection_link
        : !t.presentation_location);

    const locationLabel =
      t.presentation_location_type === "online"
        ? "Connection Link"
        : "Location";
    const locationValue =
      t.presentation_location_type === "online"
        ? t.connection_link
          ? `<a href="${t.connection_link}" target="_blank">${t.connection_link}</a>`
          : "-"
        : t.presentation_location || "-";

    html += `
      <div class="mt-6 pt-4 border-t">
        <h4 class="text-lg font-medium mb-2">Presentation Details</h4>
        <div class="mb-4 p-4 bg-blue-50 rounded-md">
          <h5 class="font-medium mb-2">Scheduled Presentation</h5>
          <p><strong>Date:</strong> ${t.presentation_date ? new Date(t.presentation_date).toLocaleDateString() : "-"}</p>
          <p><strong>Time:</strong> ${t.presentation_time || "-"}</p>
          <p><strong>${locationLabel}:</strong> ${locationValue}</p>
        </div>
        <button
          id="generateAnnouncementBtn"
          class="font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 mb-4
            ${presentationMissing ? "bg-gray-400 text-white cursor-not-allowed opacity-60" : "bg-indigo-600 hover:bg-indigo-700 text-white"}"
          ${presentationMissing ? "disabled title='Set all presentation details first'" : ""}
        >
          Generate Announcement Text
        </button>
        <div id="announcementTextContainer" class="hidden mt-4">
          <textarea
            id="announcementText"
            class="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            rows="7"
            readonly
          ></textarea>
        </div>
      </div>
    `;
  }

  // Grading section (Under Examination)
  if (t.status === "Under Examination") {
    html += `
      <div class="mt-6 pt-4 border-t">
        <h4 class="text-lg font-medium mb-2">Thesis Grading</h4>
        <div id="grading-controls-${thesisId}" class="mb-4">
          <button
            id="activateGradingBtn-${thesisId}"
            class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 mr-2 hidden"
          >
            Activate Grading
          </button>
          <button
            id="viewGradesBtn-${thesisId}"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 mr-2"
          >
            View/Submit Grades
          </button>
        </div>
        <div id="grades-container-${thesisId}" class="hidden"></div>
      </div>
    `;
  }

  // Notes section (Active only)
  if (t.status === "Active") {
    html += `
      <div class="mt-6 border-t pt-4">
        <h4 class="text-lg font-medium mb-2">Notes (Private)</h4>
        <form id="modalThesisNoteForm" class="mb-4 flex flex-col md:flex-row gap-2">
          <textarea
            id="modalThesisNoteText"
            maxlength="300"
            rows="2"
            class="border border-gray-300 p-2 rounded-md flex-1"
            placeholder="Add a note (max 300 characters)"
          ></textarea>
          <button type="submit"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md">
            Add Note
          </button>
        </form>
        <div id="modalThesisNotesList" class="space-y-2"></div>
        <div id="modalThesisNoteMessage" class="text-sm mt-2"></div>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/**
 * Binds the presentation details form submit event
 * @private
 */
function _bindPresentationDetailsEvents(thesisId) {
  const form = document.getElementById("setPresentationDetailsForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const presentationDetails = {
      presentationDate: formData.get("presentationDate"),
      presentationTime: formData.get("presentationTime"),
      presentationLocation: formData.get("presentationLocation"),
    };
    const messageEl = document.getElementById("presentationDetailsMessage");
    if (messageEl) messageEl.classList.add("hidden");

    try {
      const response = await fetch(
        `/instructor/api/instructor/theses/${thesisId}/presentation-details`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(presentationDetails),
        },
      );
      const data = await response.json();

      if (data.success) {
        if (messageEl) {
          messageEl.textContent = "Presentation details saved successfully!";
          messageEl.classList.remove("hidden", "text-red-600");
          messageEl.classList.add("text-green-600");
        }
        setTimeout(() => showThesisDetailsModal(thesisId), 1500);
      } else {
        if (messageEl) {
          messageEl.textContent =
            data.message || "Failed to save presentation details";
          messageEl.classList.remove("hidden", "text-green-600");
          messageEl.classList.add("text-red-600");
        }
      }
    } catch (error) {
      if (messageEl) {
        messageEl.textContent = "Server error. Please try again.";
        messageEl.classList.remove("hidden", "text-green-600");
        messageEl.classList.add("text-red-600");
      }
    }
  });
}

/**
 * Binds the generate announcement button click event
 * @private
 */
function _bindGenerateAnnouncementEvent(thesisId) {
  const generateBtn = document.getElementById("generateAnnouncementBtn");
  if (!generateBtn) return;

  const container = document.getElementById("announcementTextContainer");
  const textarea = document.getElementById("announcementText");

  generateBtn.onclick = async function () {
    if (generateBtn.disabled) return;
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";

    try {
      const res = await fetch(
        `/instructor/api/instructor/theses/${thesisId}/announcement-text`,
      );
      const data = await res.json();

      if (textarea) {
        textarea.value = data.success
          ? data.announcementText
          : data.message || "Failed to generate announcement.";
      }
      if (container) container.classList.remove("hidden");
    } catch (err) {
      if (textarea) textarea.value = "Server error. Please try again.";
      if (container) container.classList.remove("hidden");
    }

    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Announcement Text";
  };
}

/**
 * Initializes the thesis details modal close handlers
 */
export function initThesisDetailsModal() {
  document
    .getElementById("closeThesisDetailsModal")
    ?.addEventListener("click", function () {
      document.getElementById("thesisDetailsModal")?.classList.add("hidden");
    });

  document
    .getElementById("thesisDetailsModal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) this.classList.add("hidden");
    });
}
