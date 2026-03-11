/**
 * Public announcements page logic
 * Single Responsibility: Load, filter, and render public announcements + feed downloads
 */

import { downloadFile } from "../utils/fileDownload.js";

/**
 * Loads and renders public announcements with optional date filters
 */
export async function loadPublicAnnouncements() {
  const listDiv = document.getElementById("announcements-list");
  if (!listDiv) return;

  const today = new Date();
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");

  if (startDateInput && !startDateInput.value) {
    startDateInput.value = today.toISOString().split("T")[0];
  }
  if (endDateInput && !endDateInput.value) {
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 30);
    endDateInput.value = endDate.toISOString().split("T")[0];
  }

  const start = startDateInput ? startDateInput.value : "";
  const end = endDateInput ? endDateInput.value : "";

  // Find announcements section (after h2) or fall back to listDiv
  let announcementsSection = null;
  if (listDiv.querySelector("h2")) {
    announcementsSection = listDiv.querySelector("h2").nextElementSibling;
  }
  if (!announcementsSection) announcementsSection = listDiv;

  announcementsSection.innerHTML = `<div class="text-gray-500 text-center">Loading announcements...</div>`;

  let url = "/public/api/announcements";
  const params = [];
  if (start) params.push(`start=${encodeURIComponent(start)}`);
  if (end) params.push(`end=${encodeURIComponent(end)}`);
  if (params.length) url += "?" + params.join("&");

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      announcementsSection.innerHTML = `<div class="text-red-500 text-center">Failed to load announcements.</div>`;
      return;
    }

    if (!data.announcements || data.announcements.length === 0) {
      announcementsSection.innerHTML = `<div class="text-gray-500 text-center">No announcements found for the selected date range.</div>`;
      return;
    }

    let html = "";
    data.announcements.forEach((a) => {
      let locationDisplay = "Not specified";
      if (a.presentation_location_type === "online") {
        locationDisplay = a.connection_link
          ? `<a href="${a.connection_link}" target="_blank" class="text-indigo-600 underline">${a.connection_link}</a>`
          : "Not specified";
      } else {
        locationDisplay = a.presentation_location || "Not specified";
      }

      html += `
        <div class="timeline-item mb-8 pb-6">
          <div class="bg-white bg-opacity-60 p-6 rounded-md shadow-md">
            <h3 class="text-xl font-semibold text-indigo-700 mb-2">${a.thesis_title}</h3>
            <p class="text-gray-700 mt-1"><strong>Student:</strong> ${a.student_name}</p>
            <p class="text-gray-700"><strong>Supervisor:</strong> ${a.supervisor_name}</p>
            <p class="text-gray-700"><strong>Committee:</strong> ${a.committee_members || "Not assigned"}</p>
            <p class="text-gray-700 mt-3"><strong>Date:</strong> ${a.presentation_date || "Not scheduled"}</p>
            <p class="text-gray-700"><strong>Time:</strong> ${a.presentation_time || "Not scheduled"}</p>
            <p class="text-gray-700"><strong>Location/Link:</strong> ${locationDisplay}</p>
          </div>
        </div>
      `;
    });

    announcementsSection.innerHTML = html;
  } catch (error) {
    console.error("Error loading announcements:", error);
    announcementsSection.innerHTML = `<div class="text-red-500 text-center">Server error. Please try again later.</div>`;
  }
}

/**
 * Initializes the announcements page: filter button and feed download buttons
 */
export function initAnnouncementsPage() {
  // Initial load
  loadPublicAnnouncements();

  // Filter button
  const filterButton = document.querySelector(".bg-indigo-600");
  if (filterButton) {
    filterButton.addEventListener("click", function (e) {
      e.preventDefault();
      loadPublicAnnouncements();
    });
  }

  // Feed download buttons
  const feedButtons = document.querySelectorAll(
    "#announcements-list ~ .text-center button",
  );
  if (feedButtons.length >= 2) {
    feedButtons[0].addEventListener("click", function () {
      const start = document.getElementById("start-date")?.value;
      const end = document.getElementById("end-date")?.value;
      let url = "/public/api/announcements/feed?format=xml";
      if (start) url += `&start=${encodeURIComponent(start)}`;
      if (end) url += `&end=${encodeURIComponent(end)}`;
      downloadFile(url, "announcements.xml");
    });

    feedButtons[1].addEventListener("click", function () {
      const start = document.getElementById("start-date")?.value;
      const end = document.getElementById("end-date")?.value;
      let url = "/public/api/announcements/feed?format=json";
      if (start) url += `&start=${encodeURIComponent(start)}`;
      if (end) url += `&end=${encodeURIComponent(end)}`;
      downloadFile(url, "announcements.json");
    });
  }
}
