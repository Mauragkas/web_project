/**
 * Dashboard core: initialization and sidebar navigation
 * Single Responsibility: Dashboard layout control and navigation routing
 */

import { handleLogout } from "../auth/authUI.js";
import { showManageThesisActions } from "../student/studentDashboard.js";

/**
 * Initializes the dashboard by showing only the first section
 */
export function initializeDashboard() {
  const sections = document.querySelectorAll("main section");
  sections.forEach((section, index) => {
    if (index === 0) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });
}

/**
 * Returns the section ID map for a given dashboard type
 * Open/Closed: extend by adding new dashboard types without modifying existing
 * @param {string} dashboardType
 * @returns {Object}
 */
function getSectionMap(dashboardType) {
  const maps = {
    student: {
      "View Topic": "view-topic-section",
      "Edit Profile": "edit-profile-section",
      "Manage Thesis Work": "manage-thesis-section",
    },
    instructor: {
      "View & Create Topics": "topics-section",
      "Assign Topic": "assign-section",
      "View Theses": "theses-section",
      "View Invitations": "invitations-section",
      "View Statistics": "statistics-section",
    },
    secretariat: {
      "View Theses": "view-theses-section",
      "Data Import": "data-import-section",
    },
  };
  return maps[dashboardType] || {};
}

/**
 * Handles sidebar navigation link clicks
 * @param {HTMLElement} link - The clicked navigation link
 * @returns {boolean} - false to prevent default, true to allow
 */
export function handleDashboardNavigation(link) {
  const navText = link.innerText.trim();

  if (navText === "Home") {
    return true;
  }

  const dashboardType = window.location.pathname.split("/")[1];
  const sectionMap = getSectionMap(dashboardType);

  // Hide all sections
  document.querySelectorAll("main section").forEach((section) => {
    section.classList.add("hidden");
  });

  if (navText in sectionMap) {
    const section = document.getElementById(sectionMap[navText]);
    if (section) {
      section.classList.remove("hidden");
    }

    if (dashboardType === "student" && navText === "Manage Thesis Work") {
      showManageThesisActions();
    }

    if (dashboardType === "secretariat") {
      const thesisDetails = document.getElementById("thesis-details");
      const activeActions = document.getElementById(
        "secretariat-active-actions",
      );
      const examinationActions = document.getElementById(
        "secretariat-under-examination-actions",
      );

      if (thesisDetails) thesisDetails.classList.add("hidden");
      if (activeActions) activeActions.classList.add("hidden");
      if (examinationActions) examinationActions.classList.add("hidden");
    }
  } else if (navText === "Logout") {
    handleLogout(event);
  }

  return false;
}

/**
 * Binds sidebar navigation links to the handler
 */
export function bindDashboardNavigation() {
  document.querySelectorAll("aside a").forEach((link) => {
    link.addEventListener("click", function (e) {
      const shouldPreventDefault = !handleDashboardNavigation(this);
      if (shouldPreventDefault) {
        e.preventDefault();
      }
    });
  });
}
