/**
 * main.js - Application entry point
 *
 * Imports all modules and initializes the correct handlers
 * based on the current page/path.
 *
 * Open/Closed Principle: Add new page initializers without modifying existing ones.
 * Single Responsibility: Only routing/bootstrapping logic lives here.
 */

// --- Auth ---
import {
  handleLogin,
  handleLogout,
  toggleUserMenu,
  checkUserLoggedIn,
} from "./auth/authUI.js";
import { checkAuthStatus } from "./auth/authService.js";

// --- Session Guard ---
import { initSessionGuard } from "./dashboard/sessionGuard.js";

// --- Dashboard Core ---
import {
  initializeDashboard,
  bindDashboardNavigation,
} from "./dashboard/dashboardCore.js";

// --- Instructor ---
import { loadInstructorTopics } from "./instructor/topics.js";
import {
  loadInstructorTheses,
  initThesesControls,
  initThesisDetailsModal,
} from "./instructor/theses.js";
import { loadCommitteeInvitations } from "./instructor/invitations.js";
import { loadInstructorStatistics } from "./instructor/statistics.js";
import { initAssignTopicForm } from "./instructor/assignments.js";

// --- Student ---
import {
  loadStudentThesisInfo,
  loadStudentProfile,
} from "./student/studentDashboard.js";
import {
  initCommitteeSearch,
  initSendInvitationsButton,
} from "./student/committee.js";
import {
  initUploadMaterialsForm,
  initPresentationDetailsForm,
  initExaminationMethodHandler,
  initEditProfileForm,
} from "./student/materials.js";

// --- Public ---
import { initAnnouncementsPage } from "./public/announcements.js";

// --- Utils ---
import { downloadFile } from "./utils/fileDownload.js";

// ---------------------------------------------------------------------------
// Expose globals needed by inline scripts in HTML files
// (dashboard.html has inline scripts that call checkSessionValidity,
//  loadInstructorStatistics, etc.)
// ---------------------------------------------------------------------------
import { checkSessionValidity } from "./dashboard/sessionGuard.js";
window.checkSessionValidity = checkSessionValidity;
window.loadInstructorStatistics = loadInstructorStatistics;
window.downloadFile = downloadFile;
window.handleLogout = handleLogout;

// ---------------------------------------------------------------------------
// DOMContentLoaded - main initialization
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async function () {
  const currentPath = window.location.pathname;

  // ---- Session guard for protected pages ----
  initSessionGuard();

  // ---- Set window.currentUserId for grading UI ----
  try {
    const authData = await checkAuthStatus();
    if (authData.isLoggedIn && typeof authData.userId !== "undefined") {
      window.currentUserId = authData.userId;
    }
  } catch (_) {
    // non-critical
  }

  // ---- Logout buttons (present on all pages) ----
  document.querySelectorAll(".logout-button").forEach((button) => {
    button.addEventListener("click", handleLogout);
  });

  // ---- Login form ----
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // ---- User dropdown toggle ----
  const userMenuToggle = document.getElementById("userMenuToggle");
  if (userMenuToggle) {
    userMenuToggle.addEventListener("click", toggleUserMenu);
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", function (event) {
    const userMenu = document.getElementById("userDropdown");
    const toggle = document.getElementById("userMenuToggle");
    if (userMenu && toggle) {
      if (!userMenu.contains(event.target) && !toggle.contains(event.target)) {
        userMenu.classList.add("hidden");
      }
    }
  });

  // ---- Edit Topic Modal close button (instructor pages) ----
  const closeEditModalBtn = document.getElementById("closeEditModal");
  if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener("click", function () {
      document.getElementById("editTopicModal")?.classList.add("hidden");
    });
  }

  // ==========================================================================
  // PAGE-SPECIFIC INITIALIZATION
  // ==========================================================================

  // --- Public Announcements ---
  if (currentPath.includes("/public/announcements")) {
    checkUserLoggedIn();
    initAnnouncementsPage();
  }

  // --- Public Topics ---
  if (currentPath.includes("/public/topics")) {
    checkUserLoggedIn();
    // topics.html handles its own logic inline; checkUserLoggedIn is the only
    // shared concern needed from main.js
  }

  // --- Dashboard common setup ---
  if (currentPath.includes("/dashboard")) {
    initializeDashboard();
    bindDashboardNavigation();
  }

  // ==========================================================================
  // STUDENT DASHBOARD
  // ==========================================================================
  if (currentPath.includes("/student/")) {
    // Load thesis info for View Topic section
    loadStudentThesisInfo();

    // Load profile form data
    loadStudentProfile();

    // Committee search and invitations
    initCommitteeSearch();
    initSendInvitationsButton();

    // Materials upload form
    initUploadMaterialsForm();

    // Presentation details form
    initPresentationDetailsForm();

    // Examination method toggle
    initExaminationMethodHandler();

    // Profile edit form
    initEditProfileForm();
  }

  // ==========================================================================
  // INSTRUCTOR DASHBOARD
  // ==========================================================================
  if (currentPath.includes("/instructor/dashboard")) {
    // Topics
    loadInstructorTopics();

    // Theses list and controls
    loadInstructorTheses();
    initThesesControls();

    // Thesis details modal close
    initThesisDetailsModal();

    // Committee invitations
    loadCommitteeInvitations();

    // Assign topic form
    initAssignTopicForm();

    // Statistics (charts rendered when section is visible)
    // loadInstructorStatistics is also exposed as window.loadInstructorStatistics
    // so the inline script in dashboard.html can call it
    loadInstructorStatistics();
  }

  // ==========================================================================
  // SECRETARIAT DASHBOARD
  // ==========================================================================
  if (currentPath.includes("/secretariat/")) {
    // Secretariat-specific initializations can be added here
    // The showThesisDetails function for secretariat is called inline
  }
});
