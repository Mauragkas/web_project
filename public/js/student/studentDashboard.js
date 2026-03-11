/**
 * Student dashboard: thesis info loading and manage thesis actions
 * Single Responsibility: Student thesis info display and status-based UI
 */

import { showLoading, showError } from "../utils/ui.js";

/**
 * Loads student thesis info and populates the View Topic section
 */
export async function loadStudentThesisInfo() {
  if (!window.location.pathname.startsWith("/student/dashboard")) return;

  const section = document.getElementById("view-topic-section");
  if (!section) return;

  const detailsDiv = section.querySelector(".mt-4");
  if (!detailsDiv) return;

  showLoading(detailsDiv, "Loading thesis info...");

  try {
    const res = await fetch("/student/api/student/dashboard");
    const data = await res.json();

    if (!data.success) {
      showError(detailsDiv, "Failed to load thesis info.");
      return;
    }

    if (!data.thesis) {
      detailsDiv.innerHTML = `<div class="text-gray-500">No thesis assigned yet.</div>`;

      const committeeSection = document.getElementById("committee-selection");
      if (committeeSection) {
        committeeSection.innerHTML = `
          <div class="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            You must have a thesis assigned before inviting committee members.
          </div>
        `;
      }
      return;
    }

    const thesis = data.thesis;

    const externalLinksTextarea = document.getElementById("externalLinks");
    if (externalLinksTextarea) {
      externalLinksTextarea.value = thesis.external_links || "";
    }

    const draftFileDiv = document.getElementById("uploadedDraftFileInfo");
    if (draftFileDiv) {
      if (thesis.draft_path) {
        draftFileDiv.innerHTML = `<a href="${thesis.draft_path}" target="_blank" class="text-indigo-600 underline">View Uploaded Draft (PDF)</a>`;
      } else {
        draftFileDiv.innerHTML = `<span class="text-gray-500">No draft uploaded yet.</span>`;
      }
    }

    detailsDiv.innerHTML = `
      <p><span class="font-semibold">Topic:</span> ${thesis.topic_title || "-"}</p>
      <p><span class="font-semibold">Description:</span> ${thesis.topic_description || "-"}</p>
      <p><span class="font-semibold">Attached File:</span> ${
        thesis.topic_document_path
          ? `<a href="${thesis.topic_document_path}" target="_blank" class="text-indigo-600 underline">PDF</a>`
          : "No file"
      }</p>
      <p><span class="font-semibold">Current Status:</span> ${thesis.status || "-"}</p>
      <p><span class="font-semibold">Supervisor:</span> ${thesis.supervisor_name || "-"} (${thesis.supervisor_email || "-"})</p>
      <p><span class="font-semibold">Committee Members:</span> ${thesis.committee_members || "-"}</p>
      <p><span class="font-semibold">Assigned Date:</span> ${
        thesis.assigned_date
          ? new Date(thesis.assigned_date).toLocaleDateString()
          : "-"
      }</p>
      <p><span class="font-semibold">Completion Date:</span> ${
        thesis.completion_date
          ? new Date(thesis.completion_date).toLocaleDateString()
          : "-"
      }</p>
      <p><span class="font-semibold">Grade:</span> ${thesis.grade || "-"}</p>
      <p><span class="font-semibold">AP Number:</span> ${thesis.ap_number || "-"}</p>
      <p><span class="font-semibold">Library Link:</span> ${
        thesis.library_link
          ? `<a href="${thesis.library_link}" target="_blank" class="text-indigo-600 underline">Nemertis</a>`
          : "-"
      }</p>
    `;

    window.studentThesisId = thesis.thesis_id;

    const committeeSection = document.getElementById("committee-selection");
    if (committeeSection) {
      if (thesis.status === "Under Assignment") {
        committeeSection.classList.remove("hidden");
      } else {
        committeeSection.innerHTML = `
          <div class="p-4 bg-blue-100 text-blue-800 rounded-md">
            Committee selection is only available when thesis is in "Under Assignment" status.
            Current status: ${thesis.status}
          </div>
        `;
      }
    }
  } catch (err) {
    showError(detailsDiv, "Server error loading thesis info.");
  }
}

/**
 * Shows the correct status-actions section in the Manage Thesis Work section
 * based on the current thesis status
 */
export async function showManageThesisActions() {
  document
    .querySelectorAll(".status-actions")
    .forEach((div) => div.classList.add("hidden"));

  try {
    const res = await fetch("/student/api/student/dashboard");
    const data = await res.json();
    if (!data.success || !data.thesis) return;

    const status = data.thesis.status;

    if (status === "Under Assignment") {
      document
        .getElementById("under-assignment-actions")
        ?.classList.remove("hidden");
    } else if (status === "Under Examination" || status === "Graded") {
      document
        .getElementById("under-examination-actions")
        ?.classList.remove("hidden");

      const thesisIdInput = document.getElementById("thesisIdForUpload");
      if (thesisIdInput) thesisIdInput.value = data.thesis.thesis_id;

      const thesisIdPresentationInput = document.getElementById(
        "thesisIdForPresentation",
      );
      if (thesisIdPresentationInput)
        thesisIdPresentationInput.value = data.thesis.thesis_id;

      loadPresentationDetails();
    } else if (status === "Completed") {
      document.getElementById("completed-actions")?.classList.remove("hidden");
    }
  } catch (err) {
    // Optionally handle error
  }
}

/**
 * Loads existing presentation details and pre-fills the form
 */
export async function loadPresentationDetails() {
  if (!window.studentThesisId) return;

  try {
    const res = await fetch(
      `/student/api/student/thesis/${window.studentThesisId}/presentation-details`,
    );
    const data = await res.json();

    if (data.success && data.details) {
      const details = data.details;

      const dateEl = document.getElementById("presentationDate");
      const timeEl = document.getElementById("presentationTime");
      const methodEl = document.getElementById("examinationMethod");
      const locationEl = document.getElementById("location");
      const linkEl = document.getElementById("connectionLink");
      const thesisIdEl = document.getElementById("thesisIdForPresentation");

      if (dateEl) dateEl.value = details.presentationDate || "";
      if (timeEl) timeEl.value = details.presentationTime || "";
      if (methodEl) methodEl.value = details.examinationMethod || "in-person";
      if (locationEl) locationEl.value = details.location || "";
      if (linkEl) linkEl.value = details.connectionLink || "";
      if (thesisIdEl) thesisIdEl.value = window.studentThesisId;

      document
        .getElementById("examinationMethod")
        ?.dispatchEvent(new Event("change"));
    }
  } catch (err) {
    console.log("No existing presentation details found or error loading them");
  }
}

/**
 * Pre-fills the student edit profile form with current data
 */
export async function loadStudentProfile() {
  if (!document.getElementById("editProfileForm")) return;

  try {
    const res = await fetch("/student/api/student/dashboard");
    const data = await res.json();

    if (data.success && data.thesis) {
      const fields = [
        "street",
        "address_number",
        "city",
        "postcode",
        "email",
        "mobile_telephone",
        "landline_telephone",
      ];
      fields.forEach((field) => {
        const el = document.getElementById(field);
        if (el) el.value = data.thesis[field] || "";
      });
    }
  } catch (err) {
    // Optionally handle error
  }
}
