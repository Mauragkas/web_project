/**
 * Handles the login form submission
 * @param {Event} event - The form submission event
 */
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const username = form.querySelector("#username").value.trim();
  const password = form.querySelector("#password").value.trim();
  const messageElement = document.getElementById("loginMessage");

  // Clear previous messages
  messageElement.classList.add("hidden");
  messageElement.textContent = "";

  // Validate input
  if (!username || !password) {
    displayMessage(
      messageElement,
      "Please enter both username and password.",
      true,
    );
    return;
  }

  try {
    // Make login request
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      displayMessage(messageElement, "Login successful! Redirecting...", false);

      // Redirect to the appropriate dashboard based on user role
      setTimeout(() => {
        if (data.userRole === "student") {
          window.location.href = "/student/dashboard";
        } else if (data.userRole === "instructor") {
          window.location.href = "/instructor/dashboard";
        } else if (data.userRole === "secretariat") {
          window.location.href = "/secretariat/dashboard";
        } else {
          window.location.href = "/public/announcements";
        }
      }, 1000); // Short delay for the user to see the success message
    } else {
      displayMessage(
        messageElement,
        data.message || "Login failed. Please try again.",
        true,
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    displayMessage(
      messageElement,
      "An error occurred. Please try again later.",
      true,
    );
  }
}

/**
 * Displays a message to the user
 * @param {HTMLElement} element - The element to display the message in
 * @param {string} message - The message to display
 * @param {boolean} isError - Whether the message is an error
 */
function displayMessage(element, message, isError) {
  element.textContent = message;
  element.classList.remove("hidden", "text-green-600", "text-red-600");

  if (isError) {
    element.classList.add("text-red-600");
  } else {
    element.classList.add("text-green-600");
  }

  element.classList.remove("hidden");
}

/**
 * Handles the logout button click
 * @param {Event} event - The click event
 */
async function handleLogout(event) {
  event.preventDefault();

  try {
    const response = await fetch("/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to the public page after successful logout
      window.location.href = "/public/announcements";
    } else {
      alert("Logout failed: " + data.message);
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert("An error occurred during logout. Please try again.");
  }
}

/**
 * Toggles user dropdown menu
 */
function toggleUserMenu() {
  const userMenu = document.getElementById("userDropdown");
  if (userMenu) {
    userMenu.classList.toggle("hidden");
  }
}

/**
 * Check if user is logged in via AJAX
 */
function checkUserLoggedIn() {
  fetch("/auth/check-auth", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.isLoggedIn) {
        // User is logged in
        document.getElementById("loginButtonContainer").classList.add("hidden");

        // Update user info and show it
        document.getElementById("userDisplayName").textContent = data.username;
        document.getElementById("userRoleBadge").textContent =
          capitalizeFirstLetter(data.userRole);

        // Set correct dashboard link
        const dashboardLink = document.getElementById("dashboardLink");
        dashboardLink.href = `/${data.userRole}/dashboard`;

        // Show user info container
        document.getElementById("userInfoContainer").classList.remove("hidden");
      } else {
        // User is not logged in
        document.getElementById("userInfoContainer").classList.add("hidden");
        document
          .getElementById("loginButtonContainer")
          .classList.remove("hidden");
      }
    })
    .catch((error) => {
      console.error("Error checking authentication status:", error);
      // Default to showing login button
      document.getElementById("userInfoContainer").classList.add("hidden");
      document
        .getElementById("loginButtonContainer")
        .classList.remove("hidden");
    });
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Initializes the dashboard by showing only the first section and hiding others
 */
function initializeDashboard() {
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
 * Show the correct status-actions in Manage Thesis Work section based on thesis status
 */
async function showManageThesisActions() {
  // Hide all status-actions
  document
    .querySelectorAll(".status-actions")
    .forEach((div) => div.classList.add("hidden"));

  // Fetch thesis info
  try {
    const res = await fetch("/student/api/student/dashboard");
    const data = await res.json();
    if (!data.success || !data.thesis) return;

    const status = data.thesis.status;
    if (status === "Under Assignment") {
      const ua = document.getElementById("under-assignment-actions");
      if (ua) ua.classList.remove("hidden");
    } else if (status === "Under Examination") {
      const ue = document.getElementById("under-examination-actions");
      if (ue) ue.classList.remove("hidden");
      // Pre-fill thesisId for upload form if present
      const thesisIdInput = document.getElementById("thesisIdForUpload");
      if (thesisIdInput) thesisIdInput.value = data.thesis.thesis_id;
    } else if (status === "Completed") {
      const ca = document.getElementById("completed-actions");
      if (ca) ca.classList.remove("hidden");
    }
    // ... handle other statuses as needed
  } catch (err) {
    // Optionally handle error
  }
}

/**
 * Handle sidebar navigation for dashboards
 * @param {HTMLElement} link - The clicked navigation link
 */
function handleDashboardNavigation(link) {
  const navText = link.innerText.trim();

  // Special case for Home link - allow it to navigate to announcements
  if (navText === "Home") {
    // Don't prevent default - let it follow the href
    return true;
  }

  // Get the current dashboard type from the URL
  const dashboardType = window.location.pathname.split("/")[1]; // student, instructor, or secretariat

  // For all other links, prevent default and handle navigation
  // Map navigation text to section IDs
  let sectionMap = {};

  if (dashboardType === "student") {
    sectionMap = {
      "View Topic": "view-topic-section",
      "Edit Profile": "edit-profile-section",
      "Manage Thesis Work": "manage-thesis-section",
    };
  } else if (dashboardType === "instructor") {
    sectionMap = {
      "View & Create Topics": "topics-section",
      "Assign Topic": "assign-section",
      "View Theses": "theses-section",
      "View Invitations": "invitations-section",
      "View Statistics": "statistics-section",
    };
  } else if (dashboardType === "secretariat") {
    sectionMap = {
      "View Theses": "view-theses-section",
      "Data Import": "data-import-section",
    };
  }

  // Hide all sections
  document.querySelectorAll("main section").forEach((section) => {
    section.classList.add("hidden");
  });

  // Show the relevant section based on navigation or handle special cases
  if (navText in sectionMap) {
    const section = document.getElementById(sectionMap[navText]);
    if (section) {
      section.classList.remove("hidden");
    }

    // Student-specific actions
    if (dashboardType === "student" && navText === "Manage Thesis Work") {
      // Hide all status-actions and show the correct one based on thesis status
      showManageThesisActions();
    }

    // Secretariat-specific actions
    if (dashboardType === "secretariat") {
      // Hide thesis details when navigating
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
    // Handle logout button click
    handleLogout(event);
  }

  return false; // Prevent default
}

/**
 * Handle examination method change in student dashboard
 */
function handleExamMethodChange() {
  const examMethodSelect = document.getElementById("exam-method");
  if (examMethodSelect) {
    const inPersonDetails = document.getElementById("in-person-details");
    const onlineDetails = document.getElementById("online-details");

    if (examMethodSelect.value === "in-person") {
      inPersonDetails.classList.remove("hidden");
      onlineDetails.classList.add("hidden");
    } else {
      inPersonDetails.classList.add("hidden");
      onlineDetails.classList.remove("hidden");
    }
  }
}

/**
 * Handle thesis details viewing in secretariat dashboard
 */
function showThesisDetails() {
  const thesisDetails = document.getElementById("thesis-details");
  if (thesisDetails) {
    thesisDetails.classList.remove("hidden");

    // In a real app, you'd fetch the specific thesis details here
    // and show the correct status-actions div based on the thesis status

    // Example: Show actions for an 'Active' thesis
    const activeActions = document.getElementById("secretariat-active-actions");
    const examinationActions = document.getElementById(
      "secretariat-under-examination-actions",
    );

    if (activeActions && examinationActions) {
      activeActions.classList.remove("hidden");
      examinationActions.classList.add("hidden");
    }
  }
}

// --- Public Announcements Page Logic ---
async function loadPublicAnnouncements() {
  const listDiv = document.getElementById("announcements-list");
  if (!listDiv) return;

  // Set default dates if not already set
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

  // Get filter values
  const start = startDateInput ? startDateInput.value : "";
  const end = endDateInput ? endDateInput.value : "";

  // Try to find the announcements section to update (after h2)
  let announcementsSection = null;
  if (listDiv.querySelector("h2")) {
    announcementsSection = listDiv.querySelector("h2").nextElementSibling;
  }
  // Fallback: if not found, just use listDiv itself
  if (!announcementsSection) announcementsSection = listDiv;

  // Clear the current list content and show loading state
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

    // Create HTML for announcements
    let html = "";
    data.announcements.forEach((a) => {
      html += `
        <div class="timeline-item mb-8 pb-6">
          <div class="bg-white bg-opacity-60 p-6 rounded-md shadow-md">
            <h3 class="text-xl font-semibold text-indigo-700 mb-2">${a.thesis_title}</h3>
            <p class="text-gray-700 mt-1"><strong>Student:</strong> ${a.student_name}</p>
            <p class="text-gray-700"><strong>Supervisor:</strong> ${a.supervisor_name}</p>
            <p class="text-gray-700"><strong>Committee:</strong> ${a.committee_members || "Not assigned"}</p>
            <p class="text-gray-700 mt-3"><strong>Date:</strong> ${a.presentation_date || "Not scheduled"}</p>
            <p class="text-gray-700"><strong>Time:</strong> ${a.presentation_time || "Not scheduled"}</p>
            <p class="text-gray-700"><strong>Location/Link:</strong> ${a.presentation_location || "Not specified"}</p>
          </div>
        </div>
      `;
    });

    // Update the announcements section
    announcementsSection.innerHTML = html;
  } catch (error) {
    console.error("Error loading announcements:", error);
    announcementsSection.innerHTML = `<div class="text-red-500 text-center">Server error. Please try again later.</div>`;
  }
}

/**
 * Handle XML Feed generation
 */
function generateXmlFeed() {
  // This function is now handled inline in DOMContentLoaded for announcements page
  console.log("Generate XML Feed clicked");
}

/**
 * Handle JSON Feed generation
 */
function generateJsonFeed() {
  // This function is now handled inline in DOMContentLoaded for announcements page
  console.log("Generate JSON Feed clicked");
}

document
  .getElementById("uploadMaterialsForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.target;
    const messageDiv = document.getElementById("uploadMaterialsMessage");
    messageDiv.classList.add("hidden");
    messageDiv.textContent = "";

    const thesisId =
      window.studentThesisId ||
      document.getElementById("thesisIdForUpload").value;
    if (!thesisId) {
      messageDiv.textContent = "No thesis found.";
      messageDiv.classList.remove("hidden", "text-green-600");
      messageDiv.classList.add("text-red-600");
      return;
    }

    const formData = new FormData(form);
    formData.set("thesisId", thesisId);

    try {
      const res = await fetch("/student/api/student/thesis/materials", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        messageDiv.textContent = "Materials uploaded successfully!";
        messageDiv.classList.remove("hidden", "text-red-600");
        messageDiv.classList.add("text-green-600");
        form.reset();
      } else {
        messageDiv.textContent = data.message || "Failed to upload materials.";
        messageDiv.classList.remove("hidden", "text-green-600");
        messageDiv.classList.add("text-red-600");
      }
    } catch (err) {
      messageDiv.textContent = "Server error. Please try again.";
      messageDiv.classList.remove("hidden", "text-green-600");
      messageDiv.classList.add("text-red-600");
    }
  });

// --- Student Edit Profile Form Submission ---
document
  .getElementById("editProfileForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.target;
    const messageDiv = document.getElementById("profileMessage");
    messageDiv.classList.add("hidden");
    messageDiv.textContent = "";

    const data = {
      email: form.email.value.trim(),
      street: form.street.value.trim(),
      address_number: form.address_number.value.trim(),
      city: form.city.value.trim(),
      postcode: form.postcode.value.trim(),
      mobile_telephone: form.mobile_telephone.value.trim(),
      landline_telephone: form.landline_telephone.value.trim(),
    };

    // Optionally: validate fields here

    try {
      const res = await fetch("/student/api/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        messageDiv.textContent = "Profile updated successfully!";
        messageDiv.classList.remove("hidden", "text-red-600");
        messageDiv.classList.add("text-green-600");
      } else {
        messageDiv.textContent = result.message || "Failed to update profile.";
        messageDiv.classList.remove("hidden", "text-green-600");
        messageDiv.classList.add("text-red-600");
      }
    } catch (err) {
      messageDiv.textContent = "Server error. Please try again.";
      messageDiv.classList.remove("hidden", "text-green-600");
      messageDiv.classList.add("text-red-600");
    }
  });

// --- Pre-fill Edit Profile Form with Current Data ---
async function loadStudentProfile() {
  // Only run on student dashboard and if form exists
  if (!document.getElementById("editProfileForm")) return;
  try {
    const res = await fetch("/student/api/student/dashboard");
    const data = await res.json();
    if (data.success && data.thesis) {
      document.getElementById("street").value = data.thesis.street || "";
      document.getElementById("address_number").value =
        data.thesis.address_number || "";
      document.getElementById("city").value = data.thesis.city || "";
      document.getElementById("postcode").value = data.thesis.postcode || "";
      document.getElementById("email").value = data.thesis.email || "";
      document.getElementById("mobile_telephone").value =
        data.thesis.mobile_telephone || "";
      document.getElementById("landline_telephone").value =
        data.thesis.landline_telephone || "";
    }
  } catch (err) {
    // Optionally handle error
  }
}
document.addEventListener("DOMContentLoaded", loadStudentProfile);

/**
 * Load and render instructor topics in the dashboard
 */
async function loadInstructorTopics() {
  const topicsList = document.getElementById("instructor-topics-list");
  if (!topicsList) return;

  try {
    const res = await fetch("/instructor/api/instructor/topics");
    const data = await res.json();
    if (!data.success) {
      topicsList.innerHTML = `<div class="text-red-500 text-center">Failed to load topics.</div>`;
      return;
    }
    if (!data.topics.length) {
      topicsList.innerHTML = `<div class="text-gray-500 text-center">No topics found.</div>`;
      return;
    }
    topicsList.innerHTML = data.topics
      .map(
        (topic) => `
      <div
        class="bg-white bg-opacity-60 p-3 rounded-md mb-2 flex justify-between items-center"
        data-topic-id="${topic.id}"
        data-title="${topic.title}"
        data-description="${topic.description || ""}"
        data-document-path="${topic.document_path || ""}"
      >
        <div>
          <p class="font-semibold">${topic.title}</p>
          <p class="text-sm text-gray-500">${topic.description || ""}</p>
        </div>
        <div>
          <button class="text-sm text-indigo-600 hover:underline mr-2 edit-topic-btn">Edit</button>
          <button class="text-sm text-red-500 hover:underline delete-topic-btn">Delete</button>
        </div>
      </div>
    `,
      )
      .join("");

    // Attach edit button handlers
    document.querySelectorAll(".edit-topic-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const topicDiv = btn.closest("[data-topic-id]");
        const topicId = topicDiv.getAttribute("data-topic-id");

        // Fetch topic details via AJAX
        const res = await fetch(
          `/instructor/api/instructor/topics/${topicId}/edit`,
        );
        const data = await res.json();
        if (!data.success) {
          alert(data.message || "Failed to load topic details.");
          return;
        }
        const topic = data.topic;

        // Populate modal fields
        document.getElementById("edit-topic-id").value = topic.id;
        document.getElementById("edit-title").value = topic.title;
        document.getElementById("edit-description").value =
          topic.description || "";
        document.getElementById("edit-existing-document-path").value =
          topic.document_path || "";
        if (topic.document_path) {
          document.getElementById("current-document-link").innerHTML =
            `<a href="${topic.document_path}" target="_blank" class="text-indigo-600 underline">Current PDF</a>`;
        } else {
          document.getElementById("current-document-link").innerHTML =
            "<span class='text-gray-500'>No PDF attached</span>";
        }

        // Show modal
        document.getElementById("editTopicModal").classList.remove("hidden");
      });
    });

    // Attach close modal handler
    const closeEditModalBtn = document.getElementById("closeEditModal");
    if (closeEditModalBtn) {
      closeEditModalBtn.onclick = function () {
        document.getElementById("editTopicModal").classList.add("hidden");
      };
    }

    // Attach submit handler for edit form (only once)
    const editTopicForm = document.getElementById("editTopicForm");
    if (editTopicForm && !editTopicForm.dataset.listenerAttached) {
      editTopicForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const topicId = document.getElementById("edit-topic-id").value;
        const form = e.target;
        const formData = new FormData(form);
        const messageEl = document.getElementById("editTopicMessage");
        messageEl.classList.add("hidden");
        messageEl.textContent = "";

        try {
          const response = await fetch(
            `/instructor/api/instructor/topics/${topicId}/update`,
            {
              method: "POST",
              body: formData,
            },
          );
          const data = await response.json();
          if (data.success) {
            messageEl.textContent = "Topic updated successfully!";
            messageEl.classList.remove("hidden", "text-red-600");
            messageEl.classList.add("text-green-600");

            // Optionally, update the topic in the list without reload
            setTimeout(() => window.location.reload(), 1000);
          } else {
            messageEl.textContent = data.message || "Failed to update topic.";
            messageEl.classList.remove("hidden", "text-green-600");
            messageEl.classList.add("text-red-600");
          }
        } catch (err) {
          messageEl.textContent = "Server error. Please try again.";
          messageEl.classList.remove("hidden", "text-green-600");
          messageEl.classList.add("text-red-600");
        }
      });
      editTopicForm.dataset.listenerAttached = "true";
    }

    // Attach delete button handler
    document
      .querySelectorAll("[data-topic-id] .text-red-500")
      .forEach((btn) => {
        btn.addEventListener("click", async function () {
          const topicDiv = btn.closest("[data-topic-id]");
          const topicId = topicDiv.getAttribute("data-topic-id");
          if (!confirm("Are you sure you want to delete this topic?")) return;
          try {
            const res = await fetch(
              `/instructor/api/instructor/topics/${topicId}/delete`,
              {
                method: "DELETE",
              },
            );
            const data = await res.json();
            if (data.success) {
              topicDiv.remove();
            } else {
              alert(data.message || "Failed to delete topic.");
            }
          } catch (err) {
            alert("Server error. Please try again.");
          }
        });
      });
  } catch (err) {
    topicsList.innerHTML = `<div class="text-red-500 text-center">Server error loading topics.</div>`;
  }
}

// ---- Instructor Theses List ----
async function loadInstructorTheses() {
  const listDiv = document.getElementById("instructor-theses-list");
  if (!listDiv) return;

  // Get filter values
  const status = document.getElementById("thesis-status-filter")?.value || "";
  const role = document.getElementById("thesis-role-filter")?.value || "";

  let url = "/instructor/api/instructor/theses";
  const params = [];
  if (status) params.push(`status=${encodeURIComponent(status)}`);
  if (role) params.push(`role=${encodeURIComponent(role)}`);
  if (params.length) url += "?" + params.join("&");

  listDiv.innerHTML = `<div class="text-gray-500 text-center">Loading theses...</div>`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      listDiv.innerHTML = `<div class="text-red-500 text-center">Failed to load theses.</div>`;
      return;
    }
    if (!data.theses.length) {
      listDiv.innerHTML = `<div class="text-gray-500 text-center">No theses found.</div>`;
      return;
    }
    listDiv.innerHTML = data.theses
      .map(
        (thesis) => `
      <div class="bg-white bg-opacity-60 p-3 rounded-md mb-2 flex flex-col md:flex-row justify-between items-start md:items-center border-l-4 ${
        thesis.status === "Completed"
          ? "border-green-500"
          : thesis.status === "Cancelled"
            ? "border-red-500"
            : "border-indigo-500"
      }">
        <div>
          <p class="font-semibold">${thesis.topic_title}</p>
          <p class="text-sm text-gray-500">Student: ${thesis.student_name}</p>
          <p class="text-sm text-gray-500">Status: ${thesis.status}</p>
          <p class="text-xs text-gray-400">Assigned: ${thesis.assigned_date ? new Date(thesis.assigned_date).toLocaleDateString() : "-"}</p>
          <p class="text-xs text-gray-400">Role: ${capitalizeFirstLetter(thesis.instructor_role || (thesis.supervisor_id == window.currentUserId ? "supervisor" : "committee"))}</p>
        </div>
        <div class="mt-2 md:mt-0">
          <button class="text-sm text-indigo-600 hover:underline mr-2 view-thesis-details-btn" data-thesis-id="${thesis.thesis_id}">
            View Details
          </button>
        </div>
      </div>
    `,
      )
      .join("");

    // Attach event listeners for "View Details" if needed
    document.querySelectorAll(".view-thesis-details-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const thesisId = btn.getAttribute("data-thesis-id");
        showThesisDetailsModal(thesisId);
      });
    });
  } catch (err) {
    listDiv.innerHTML = `<div class="text-red-500 text-center">Server error loading theses.</div>`;
  }
}

// ---- Modal for Instructor Thesis Details ----
// --- Notes logic start ---
async function loadThesisNotes(thesisId) {
  const notesList = document.getElementById("thesisNotesList");
  if (!notesList) return;
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
    if (!data.notes.length) {
      notesList.innerHTML = `<div class="text-gray-500">No notes yet.</div>`;
      return;
    }
    notesList.innerHTML = data.notes
      .map(
        (n) =>
          `<div class="bg-gray-100 rounded p-2 text-sm">
            <span class="text-gray-700">${n.note_text}</span>
            <span class="text-xs text-gray-400 float-right">${new Date(n.created_at).toLocaleString()}</span>
          </div>`,
      )
      .join("");
  } catch (err) {
    notesList.innerHTML = `<div class="text-red-500">Server error loading notes.</div>`;
  }
}

// We'll store the current thesisId for the modal context
let currentThesisDetailsId = null;

document
  .getElementById("addThesisNoteForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const noteText = document.getElementById("thesisNoteText").value.trim();
    const thesisId = currentThesisDetailsId;
    const messageDiv = document.getElementById("thesisNoteMessage");
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
        document.getElementById("thesisNoteText").value = "";
        loadThesisNotes(thesisId);
      } else {
        messageDiv.textContent = data.message || "Failed to record note.";
        messageDiv.className = "text-red-600";
      }
    } catch (err) {
      messageDiv.textContent = "Server error.";
      messageDiv.className = "text-red-600";
    }
  });
// --- Notes logic end ---

async function showThesisDetailsModal(thesisId) {
  const modal = document.getElementById("thesisDetailsModal");
  const content = document.getElementById("thesis-details-content");
  modal.classList.remove("hidden");
  content.innerHTML = '<div class="text-center text-gray-500">Loading...</div>';

  // Store the current thesisId for notes context
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

    // Calculate time elapsed since assignment
    const assignedDate = new Date(t.assigned_date);
    const currentDate = new Date();
    const elapsedTime = currentDate - assignedDate;
    const elapsedDays = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
    const elapsedYears = (elapsedDays / 365).toFixed(1);

    // Flag to check if cancel button should be shown (supervisor and active thesis)
    const canCancelThesis =
      t.status === "Active" &&
      window.currentUserId == t.supervisor_id &&
      elapsedDays >= 730; // 2 years (approx)

    // Flag to check if supervisor can change status to Under Examination
    const canChangeToUnderExamination =
      t.status === "Active" && window.currentUserId == t.supervisor_id;

    content.innerHTML = `
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

        ${
          t.status === "Cancelled"
            ? `
          <div class="mt-4 p-4 bg-red-100 rounded-md">
            <p><span class="font-semibold">Cancellation Date:</span> ${t.cancellation_date ? new Date(t.cancellation_date).toLocaleDateString() : "-"}</p>
            <p><span class="font-semibold">GA Number:</span> ${t.ga_number || "-"}</p>
            <p><span class="font-semibold">GA Year:</span> ${t.ga_year || "-"}</p>
            <p><span class="font-semibold">Cancellation Reason:</span> ${t.cancellation_reason || "-"}</p>
          </div>
        `
            : ""
        }

        ${
          canCancelThesis
            ? `
          <div class="mt-6 pt-4 border-t">
            <h4 class="text-lg font-medium mb-2">Supervisor Actions</h4>
            <button id="cancelActiveThesisBtn" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200">
              Cancel Active Thesis
            </button>
            <p class="mt-2 text-sm text-gray-600">Note: Cancellation requires General Assembly approval and can only be done after two years.</p>
          </div>
        `
            : ""
        }

        ${
          canChangeToUnderExamination
            ? `
          <div class="mt-6 pt-4 border-t">
            <h4 class="text-lg font-medium mb-2">Supervisor Actions</h4>
            <button id="changeToUnderExaminationBtn" class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200">
              Change Status to Under Examination
            </button>
            <p class="mt-2 text-sm text-gray-600">This will move the thesis to the examination phase.</p>
          </div>
        `
            : ""
        }

        ${
          t.status === "Under Examination" &&
          window.currentUserId == t.supervisor_id
            ? `
    <div class="mt-6 pt-4 border-t">
      <h4 class="text-lg font-medium mb-2">Presentation Management</h4>

      ${
        !t.presentation_date || !t.presentation_time || !t.presentation_location
          ? `
          <!-- Set Presentation Details Form -->
          <div id="presentation-details-form" class="mb-4">
            <h5 class="font-medium mb-3">Set Presentation Details</h5>
            <form id="setPresentationDetailsForm" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="presentationDate" class="block text-sm font-medium text-gray-700 mb-1">
                    Presentation Date <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="presentationDate"
                    name="presentationDate"
                    value="${t.presentation_date || ""}"
                    required
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label for="presentationTime" class="block text-sm font-medium text-gray-700 mb-1">
                    Presentation Time <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="presentationTime"
                    name="presentationTime"
                    value="${t.presentation_time || ""}"
                    required
                    class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label for="presentationLocation" class="block text-sm font-medium text-gray-700 mb-1">
                  Presentation Location <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="presentationLocation"
                  name="presentationLocation"
                  value="${t.presentation_location || ""}"
                  placeholder="e.g., Room A102, Engineering Building"
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div id="presentationDetailsMessage" class="text-sm hidden"></div>
              <button
                type="submit"
                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
              >
                Set Presentation Details
              </button>
            </form>
          </div>
          `
          : `
          <!-- Show existing presentation details -->
          <div class="mb-4 p-4 bg-blue-50 rounded-md">
            <h5 class="font-medium mb-2">Current Presentation Details</h5>
            <p><strong>Date:</strong> ${new Date(t.presentation_date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${t.presentation_time}</p>
            <p><strong>Location:</strong> ${t.presentation_location}</p>
            <button
              id="editPresentationDetailsBtn"
              class="mt-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded text-sm"
            >
              Edit Details
            </button>
          </div>

          <!-- Generate Announcement Button -->
          <button
            id="generateAnnouncementBtn"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 mb-4"
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
          `
      }
    </div>
    `
            : ""
        }
      </div>
    `;

    // Only show notes section for "Active" theses
    if (t.status === "Active") {
      const notesSection = document.createElement("div");
      notesSection.className = "mt-6 border-t pt-4";
      notesSection.innerHTML = `
        <h4 class="text-lg font-medium mb-2">Notes (Private)</h4>
        <form id="modalThesisNoteForm" class="mb-4 flex flex-col md:flex-row gap-2">
          <textarea id="modalThesisNoteText" maxlength="300" rows="2" class="border border-gray-300 p-2 rounded-md flex-1" placeholder="Add a note (max 300 characters)"></textarea>
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md">Add Note</button>
        </form>
        <div id="modalThesisNotesList" class="space-y-2"></div>
        <div id="modalThesisNoteMessage" class="text-sm mt-2"></div>
      `;
      content.appendChild(notesSection);

      // Add event listener specifically for the modal form
      document
        .getElementById("modalThesisNoteForm")
        .addEventListener("submit", handleNoteSubmit);

      // Load existing notes
      loadModalThesisNotes(thesisId);
    }

    // --- Presentation Details Form and Announcement Button Logic ---
    if (
      t.status === "Under Examination" &&
      window.currentUserId == t.supervisor_id
    ) {
      // Handle setting presentation details
      const setPresentationForm = document.getElementById(
        "setPresentationDetailsForm",
      );
      if (setPresentationForm) {
        setPresentationForm.addEventListener("submit", async function (e) {
          e.preventDefault();

          const formData = new FormData(e.target);
          const presentationDetails = {
            presentationDate: formData.get("presentationDate"),
            presentationTime: formData.get("presentationTime"),
            presentationLocation: formData.get("presentationLocation"),
          };

          const messageEl = document.getElementById(
            "presentationDetailsMessage",
          );
          messageEl.classList.add("hidden");

          try {
            const response = await fetch(
              `/instructor/api/instructor/theses/${thesisId}/presentation-details`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(presentationDetails),
              },
            );

            const data = await response.json();

            if (data.success) {
              messageEl.textContent =
                "Presentation details saved successfully!";
              messageEl.classList.remove("hidden", "text-red-600");
              messageEl.classList.add("text-green-600");

              // Refresh the modal to show the generate button
              setTimeout(() => {
                showThesisDetailsModal(thesisId);
              }, 1500);
            } else {
              messageEl.textContent =
                data.message || "Failed to save presentation details";
              messageEl.classList.remove("hidden", "text-green-600");
              messageEl.classList.add("text-red-600");
            }
          } catch (error) {
            messageEl.textContent = "Server error. Please try again.";
            messageEl.classList.remove("hidden", "text-green-600");
            messageEl.classList.add("text-red-600");
          }
        });
      }

      // Handle editing existing presentation details
      const editBtn = document.getElementById("editPresentationDetailsBtn");
      if (editBtn) {
        editBtn.addEventListener("click", function () {
          // Show the form again with current values
          showThesisDetailsModal(thesisId);
        });
      }

      // Handle generate announcement (existing code)
      const generateBtn = document.getElementById("generateAnnouncementBtn");
      if (generateBtn) {
        const container = document.getElementById("announcementTextContainer");
        const textarea = document.getElementById("announcementText");
        generateBtn.onclick = async function () {
          generateBtn.disabled = true;
          generateBtn.textContent = "Generating...";
          try {
            const res = await fetch(
              `/instructor/api/instructor/theses/${thesisId}/announcement-text`,
            );
            const data = await res.json();
            if (data.success) {
              textarea.value = data.announcementText;
              container.classList.remove("hidden");
            } else {
              textarea.value =
                data.message || "Failed to generate announcement.";
              container.classList.remove("hidden");
            }
          } catch (err) {
            textarea.value = "Server error. Please try again.";
            container.classList.remove("hidden");
          }
          generateBtn.disabled = false;
          generateBtn.textContent = "Generate Announcement Text";
        };
      }
    }

    // Add event listener for cancel button if present
    const cancelBtn = document.getElementById("cancelActiveThesisBtn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        showCancelActiveThesisModal(thesisId, t.topic_title);
      });
    }

    // Add event listener for change to Under Examination button if present
    const changeBtn = document.getElementById("changeToUnderExaminationBtn");
    if (changeBtn) {
      changeBtn.addEventListener("click", function () {
        if (
          confirm(
            "Are you sure you want to change the status to 'Under Examination'? This action cannot be undone.",
          )
        ) {
          changeThesisStatusToUnderExamination(thesisId);
        }
      });
    }
  } catch (err) {
    content.innerHTML = `<div class="text-red-500 text-center">Server error loading thesis details.</div>`;
  }
}

// AJAX function to change thesis status to Under Examination
async function changeThesisStatusToUnderExamination(thesisId) {
  const content = document.getElementById("thesis-details-content");
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
      // Optionally reload the modal or the list
      showThesisDetailsModal(thesisId);
      // Or reload the theses list
      if (typeof loadInstructorTheses === "function") {
        loadInstructorTheses();
      }
    } else {
      alert(data.message || "Failed to change status.");
    }
  } catch (err) {
    alert("Server error. Please try again.");
  }
}

// Separate function for handling note submission from the modal
async function handleNoteSubmit(e) {
  e.preventDefault(); // Prevent the form from submitting traditionally

  const noteText = document.getElementById("modalThesisNoteText").value.trim();
  const thesisId = currentThesisDetailsId;
  const messageDiv = document.getElementById("modalThesisNoteMessage");

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
      document.getElementById("modalThesisNoteText").value = "";
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

// Load notes for the modal
async function loadModalThesisNotes(thesisId) {
  const notesList = document.getElementById("modalThesisNotesList");
  if (!notesList) return;

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
        (n) =>
          `<div class="bg-gray-100 rounded p-2 text-sm">
            <span class="text-gray-700">${n.note_text}</span>
            <span class="text-xs text-gray-400 float-right">${new Date(n.created_at).toLocaleString()}</span>
          </div>`,
      )
      .join("");
  } catch (err) {
    console.error("Error loading notes:", err);
    notesList.innerHTML = `<div class="text-red-500">Server error loading notes.</div>`;
  }
}

document
  .getElementById("closeThesisDetailsModal")
  ?.addEventListener("click", function () {
    document.getElementById("thesisDetailsModal").classList.add("hidden");
  });
document
  .getElementById("thesisDetailsModal")
  ?.addEventListener("click", function (e) {
    if (e.target === this) this.classList.add("hidden");
  });

// ---- Session validity check for dashboard protection ----
function checkSessionValidity() {
  // Make a lightweight request to check session
  fetch("/auth/check-auth", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // If not logged in, redirect to login page
      if (!data.isLoggedIn) {
        window.location.href = "/auth/login";
        return;
      }

      // Check if user has the right role for this page
      const currentPath = window.location.pathname;
      const userRole = data.userRole;

      // Check if user is accessing the correct dashboard for their role
      if (currentPath.startsWith("/student/") && userRole !== "student") {
        window.location.href = `/${userRole}/dashboard`;
      } else if (
        currentPath.startsWith("/instructor/") &&
        userRole !== "instructor"
      ) {
        window.location.href = `/${userRole}/dashboard`;
      } else if (
        currentPath.startsWith("/secretariat/") &&
        userRole !== "secretariat"
      ) {
        window.location.href = `/${userRole}/dashboard`;
      }
    })
    .catch((error) => {
      console.error("Session check failed:", error);
      // On error, safest to redirect to login
      window.location.href = "/auth/login";
    });
}

// ---- Download file helper ----
function downloadFile(url, filename) {
  fetch(url, {
    credentials: "include",
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network error");
      return response.blob();
    })
    .then((blob) => {
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((err) => {
      alert("Failed to export: " + err.message);
    });
}

// --- Student Thesis Info AJAX ---
async function loadStudentThesisInfo() {
  // Only run on student dashboard
  if (!window.location.pathname.startsWith("/student/dashboard")) return;

  const section = document.getElementById("view-topic-section");
  if (!section) return;

  const detailsDiv = section.querySelector(".mt-4");
  if (!detailsDiv) return;
  detailsDiv.innerHTML = `<div class="text-gray-500">Loading thesis info...</div>`;

  try {
    const res = await fetch("/student/api/student/dashboard");
    const data = await res.json();

    if (!data.success) {
      detailsDiv.innerHTML = `<div class="text-red-500">Failed to load thesis info.</div>`;
      return;
    }

    if (!data.thesis) {
      detailsDiv.innerHTML = `<div class="text-gray-500">No thesis assigned yet.</div>`;

      // Hide committee selection if no thesis
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

    // Store thesisId for invitation use - CRITICAL FIX
    window.studentThesisId = thesis.thesis_id; // Note: this should match what your API returns

    // Only show committee selection if thesis is in Under Assignment status
    if (thesis.status === "Under Assignment") {
      const committeeSection = document.getElementById("committee-selection");
      if (committeeSection) {
        committeeSection.classList.remove("hidden");
      }
    } else {
      // Hide committee selection if thesis is not in Under Assignment status
      const committeeSection = document.getElementById("committee-selection");
      if (committeeSection) {
        committeeSection.innerHTML = `
          <div class="p-4 bg-blue-100 text-blue-800 rounded-md">
            Committee selection is only available when thesis is in "Under Assignment" status.
            Current status: ${thesis.status}
          </div>
        `;
      }
    }
  } catch (err) {
    detailsDiv.innerHTML = `<div class="text-red-500">Server error loading thesis info.</div>`;
  }
}

// --- Committee selection logic ---
let selectedInstructors = [];

document
  .getElementById("instructor-search")
  ?.addEventListener("input", async function () {
    const query = this.value.trim();
    if (!query) {
      document.getElementById("instructor-search-results").innerHTML = "";
      return;
    }
    const res = await fetch(
      `/student/api/student/committee/instructors?query=${encodeURIComponent(query)}`,
    );
    const data = await res.json();
    if (data.success) {
      document.getElementById("instructor-search-results").innerHTML =
        data.instructors
          .map(
            (i) =>
              `<div class="p-2 bg-gray-100 rounded mb-1 cursor-pointer instructor-result" data-id="${i.id}" data-name="${i.full_name}">${i.full_name} (${i.username})</div>`,
          )
          .join("");
      document.querySelectorAll(".instructor-result").forEach((el) => {
        el.addEventListener("click", function () {
          const id = this.getAttribute("data-id");
          const name = this.getAttribute("data-name");
          if (!selectedInstructors.find((i) => i.id == id)) {
            selectedInstructors.push({ id, name });
            renderSelectedInstructors();
          }
        });
      });
    }
  });

function renderSelectedInstructors() {
  const div = document.getElementById("selected-instructors");
  div.innerHTML = selectedInstructors
    .map(
      (i, idx) =>
        `<span class="inline-block bg-indigo-100 text-indigo-700 px-2 py-1 rounded mr-2 mb-1">${i.name} <button class="remove-instructor" data-idx="${idx}">&times;</button></span>`,
    )
    .join("");
  document.querySelectorAll(".remove-instructor").forEach((btn) => {
    btn.addEventListener("click", function () {
      selectedInstructors.splice(this.getAttribute("data-idx"), 1);
      renderSelectedInstructors();
    });
  });
  document.getElementById("send-invitations-btn").disabled =
    selectedInstructors.length === 0;
}

document
  .getElementById("send-invitations-btn")
  ?.addEventListener("click", async function () {
    // FIXED: Check if thesisId exists before sending request
    const thesisId = window.studentThesisId;
    if (!thesisId) {
      const messageDiv = document.getElementById("committee-message");
      messageDiv.classList.remove("hidden", "text-green-600");
      messageDiv.classList.add("text-red-600");
      messageDiv.textContent =
        "Error: No thesis found. Please contact support.";
      return;
    }

    const instructorIds = selectedInstructors.map((i) => i.id);
    const messageDiv = document.getElementById("committee-message");
    messageDiv.classList.add("hidden");
    messageDiv.textContent = "";

    try {
      const res = await fetch("/student/api/student/committee/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thesisId, instructorIds }),
      });
      const data = await res.json();
      if (data.success) {
        messageDiv.textContent = "Invitations sent!";
        messageDiv.classList.remove("hidden", "text-red-600");
        messageDiv.classList.add("text-green-600");
        selectedInstructors = [];
        renderSelectedInstructors();
      } else {
        messageDiv.textContent = data.message || "Failed to send invitations.";
        messageDiv.classList.remove("hidden", "text-green-600");
        messageDiv.classList.add("text-red-600");
      }
    } catch (err) {
      messageDiv.textContent = "Server error. Please try again.";
      messageDiv.classList.remove("hidden", "text-green-600");
      messageDiv.classList.add("text-red-600");
    }
  });

// ---- Load Committee Invitations ----
async function loadCommitteeInvitations() {
  const listDiv = document.getElementById("committee-invitations-list");
  if (!listDiv) return;

  listDiv.innerHTML = `<div class="text-gray-500 text-center">Loading invitations...</div>`;

  try {
    const res = await fetch("/instructor/api/instructor/committee-invitations");
    const data = await res.json();
    if (!data.success) {
      listDiv.innerHTML = `<div class="text-red-500 text-center">Failed to load invitations.</div>`;
      return;
    }
    if (!data.invitations.length) {
      listDiv.innerHTML = `<div class="text-gray-500 text-center">No invitations found.</div>`;
      return;
    }
    listDiv.innerHTML = data.invitations
      .map((inv) => {
        let statusBadge = "";
        if (inv.invitation_status === "Invited") {
          statusBadge = `<span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Pending</span>`;
        } else if (inv.invitation_status === "Accepted") {
          statusBadge = `<span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Accepted</span>`;
        } else if (inv.invitation_status === "Rejected") {
          statusBadge = `<span class="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Rejected</span>`;
        }
        return `
          <div class="bg-white bg-opacity-60 p-3 rounded-md mb-2 flex flex-col md:flex-row justify-between items-start md:items-center border-l-4 border-indigo-500">
            <div>
              <p class="font-semibold">${inv.topic_title}</p>
              <p class="text-sm text-gray-500">Student: ${inv.student_name}</p>
              <p class="text-sm text-gray-500">Supervisor: ${inv.supervisor_name}</p>
              <p class="text-sm text-gray-500">Thesis Status: ${inv.thesis_status}</p>
              <p class="text-xs text-gray-400">Invited: ${new Date(inv.invitation_date).toLocaleDateString()}</p>
              <p class="text-xs text-gray-400">Status: ${statusBadge}</p>
            </div>
            <div class="mt-2 md:mt-0">
              ${
                inv.invitation_status === "Invited"
                  ? `
                <button class="text-sm text-green-600 hover:underline mr-2 respond-invitation-btn" data-invitation-id="${inv.invitation_id}" data-action="Accepted">Accept</button>
                <button class="text-sm text-red-600 hover:underline respond-invitation-btn" data-invitation-id="${inv.invitation_id}" data-action="Rejected">Reject</button>
              `
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

    // Attach event listeners for respond buttons
    document.querySelectorAll(".respond-invitation-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const invitationId = btn.getAttribute("data-invitation-id");
        const action = btn.getAttribute("data-action");
        if (
          !confirm(
            `Are you sure you want to ${action.toLowerCase()} this invitation?`,
          )
        )
          return;
        try {
          const res = await fetch(
            `/instructor/api/instructor/committee-invitations/${invitationId}/respond`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action }),
            },
          );
          const data = await res.json();
          if (data.success) {
            alert(
              data.message +
                (data.thesisFinalized
                  ? "\nThesis is now Active (enough members accepted)."
                  : ""),
            );
            loadCommitteeInvitations();
          } else {
            alert(data.message || "Failed to respond to invitation.");
          }
        } catch (err) {
          alert("Server error. Please try again.");
        }
      });
    });
  } catch (err) {
    listDiv.innerHTML = `<div class="text-red-500 text-center">Server error loading invitations.</div>`;
  }
}

// Initialize event listeners when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // ---- Dashboard session protection ----
  const currentPath = window.location.pathname;
  if (
    currentPath.startsWith("/student/") ||
    currentPath.startsWith("/instructor/") ||
    currentPath.startsWith("/secretariat/")
  ) {
    // Check session validity on page load
    checkSessionValidity();

    // Also check session validity when tab becomes visible again
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        checkSessionValidity();
      }
    });
  }

  // Common elements across all pages
  const logoutButtons = document.querySelectorAll(".logout-button");
  logoutButtons.forEach((button) => {
    button.addEventListener("click", handleLogout);
  });

  // Login form handler
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // User dropdown toggle
  const userMenuToggle = document.getElementById("userMenuToggle");
  if (userMenuToggle) {
    userMenuToggle.addEventListener("click", toggleUserMenu);
  }

  // Close the dropdown when clicking outside
  document.addEventListener("click", function (event) {
    const userMenu = document.getElementById("userDropdown");
    const userMenuToggle = document.getElementById("userMenuToggle");

    if (
      userMenu &&
      !userMenu.contains(event.target) &&
      !userMenuToggle.contains(event.target)
    ) {
      userMenu.classList.add("hidden");
    }
  });

  // Always attach close modal handler if modal exists
  const closeEditModalBtn = document.getElementById("closeEditModal");
  if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener("click", function () {
      document.getElementById("editTopicModal").classList.add("hidden");
    });
  }

  // Page specific initializations
  // (currentPath already defined above)

  // --- Public Announcements Page Logic ---
  if (currentPath.includes("/public/announcements")) {
    checkUserLoggedIn();

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

    // Feed generation buttons
    const feedButtons = document.querySelectorAll(
      "#announcements-list ~ .text-center button",
    );
    if (feedButtons.length >= 2) {
      feedButtons[0].addEventListener("click", function () {
        // XML
        const start = document.getElementById("start-date")?.value;
        const end = document.getElementById("end-date")?.value;
        let url = "/public/api/announcements/feed?format=xml";
        if (start) url += `&start=${encodeURIComponent(start)}`;
        if (end) url += `&end=${encodeURIComponent(end)}`;
        downloadFile(url, "announcements.xml");
      });
      feedButtons[1].addEventListener("click", function () {
        // JSON
        const start = document.getElementById("start-date")?.value;
        const end = document.getElementById("end-date")?.value;
        let url = "/public/api/announcements/feed?format=json";
        if (start) url += `&start=${encodeURIComponent(start)}`;
        if (end) url += `&end=${encodeURIComponent(end)}`;
        downloadFile(url, "announcements.json");
      });
    }
  }

  // Dashboard initializations
  if (currentPath.includes("/dashboard")) {
    initializeDashboard();

    // Handle dashboard navigation
    document.querySelectorAll("aside a").forEach((link) => {
      link.addEventListener("click", function (e) {
        const shouldPreventDefault = !handleDashboardNavigation(this);
        if (shouldPreventDefault) {
          e.preventDefault();
        }
      });
    });

    // Student-specific initializations
    if (currentPath.includes("/student/")) {
      // Exam method handling
      const examMethodSelect = document.getElementById("exam-method");
      if (examMethodSelect) {
        examMethodSelect.addEventListener("change", handleExamMethodChange);
      }
    }

    // Secretariat-specific initializations
    if (currentPath.includes("/secretariat/")) {
      // Thesis details viewing
      const viewDetailsButtons = document.querySelectorAll(
        "#view-theses-section .bg-white button",
      );
      viewDetailsButtons.forEach((button) => {
        button.addEventListener("click", showThesisDetails);
      });
    }
  }

  // ---- Student Thesis Info AJAX: call on DOMContentLoaded if on student dashboard ----
  loadStudentThesisInfo();

  // Load instructor topics if on instructor dashboard
  if (window.location.pathname === "/instructor/dashboard") {
    loadInstructorTopics();
  }

  // ---- Instructor Theses List: Load and filter ----
  if (window.location.pathname === "/instructor/dashboard") {
    // Load on page load
    loadInstructorTheses();

    // Attach filter events
    const statusFilter = document.getElementById("thesis-status-filter");
    const roleFilter = document.getElementById("thesis-role-filter");
    if (statusFilter)
      statusFilter.addEventListener("change", loadInstructorTheses);
    if (roleFilter) roleFilter.addEventListener("change", loadInstructorTheses);

    // Export CSV
    const exportCsvBtn = document.getElementById("export-theses-csv");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", function () {
        // Get current filters
        const status =
          document.getElementById("thesis-status-filter")?.value || "";
        const role = document.getElementById("thesis-role-filter")?.value || "";
        let url = "/instructor/api/instructor/theses?format=csv";
        if (status) url += `&status=${encodeURIComponent(status)}`;
        if (role) url += `&role=${encodeURIComponent(role)}`;
        downloadFile(url, "theses.csv");
      });
    }

    // Export JSON
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

    // ---- Load Committee Invitations ----
    loadCommitteeInvitations();
  }

  async function loadAvailableTopics() {
    try {
      const response = await fetch(
        "/instructor/api/instructor/available-topics",
      );
      const data = await response.json();

      const topicSelect = document.getElementById("topic-select");

      if (data.success) {
        if (data.topics.length === 0) {
          topicSelect.innerHTML =
            '<option value="">No available topics</option>';
        } else {
          let options = '<option value="">-- Select a topic --</option>';
          data.topics.forEach((topic) => {
            options += `<option value="${topic.id}">${topic.title}</option>`;
          });
          topicSelect.innerHTML = options;
        }
      } else {
        topicSelect.innerHTML =
          '<option value="">Error loading topics</option>';
      }
    } catch (error) {
      console.error("Error loading topics:", error);
      document.getElementById("topic-select").innerHTML =
        '<option value="">Error loading topics</option>';
    }
  }

  async function searchStudents() {
    const query = document.getElementById("student-search").value.trim();
    const resultsDiv = document.getElementById("student-search-results");

    if (!query) {
      resultsDiv.innerHTML =
        '<p class="text-red-500">Please enter a student ID or name</p>';
      resultsDiv.classList.remove("hidden");
      return;
    }

    try {
      const response = await fetch(
        `/instructor/api/instructor/student-search?query=${encodeURIComponent(query)}`,
      );
      const data = await response.json();

      if (data.success) {
        if (data.students.length === 0) {
          resultsDiv.innerHTML =
            '<p class="text-gray-500">No students found</p>';
        } else {
          let resultsHtml = '<div class="space-y-2">';
          data.students.forEach((student) => {
            resultsHtml += `
                          <div class="p-3 bg-white rounded-md shadow-sm hover:bg-gray-50 cursor-pointer student-result"
                               data-student-id="${student.id}" data-student-name="${student.full_name}">
                              <p class="font-medium">${student.full_name}</p>
                              <p class="text-sm text-gray-500">${student.email || "No email"}</p>
                          </div>
                      `;
          });
          resultsHtml += "</div>";
          resultsDiv.innerHTML = resultsHtml;

          // Add click events to results
          document.querySelectorAll(".student-result").forEach((el) => {
            el.addEventListener("click", function () {
              selectStudent(
                this.getAttribute("data-student-id"),
                this.getAttribute("data-student-name"),
              );
            });
          });
        }
      } else {
        resultsDiv.innerHTML = `<p class="text-red-500">${data.message || "Error searching for students"}</p>`;
      }

      resultsDiv.classList.remove("hidden");
    } catch (error) {
      console.error("Error searching students:", error);
      resultsDiv.innerHTML =
        '<p class="text-red-500">Server error while searching for students</p>';
      resultsDiv.classList.remove("hidden");
    }
  }

  function selectStudent(studentId, studentName) {
    document.getElementById("selected-student-id").value = studentId;
    document.getElementById("student-search").value = studentName;
    document.getElementById("student-search-results").classList.add("hidden");

    // Enable the assign button
    document.getElementById("assign-button").disabled = false;
  }

  async function assignTopic(e) {
    e.preventDefault();

    const topicId = document.getElementById("topic-select").value;
    const studentId = document.getElementById("selected-student-id").value;
    const messageDiv = document.getElementById("assignment-message");

    if (!topicId || !studentId) {
      messageDiv.innerHTML =
        '<p class="text-red-500">Please select both a topic and a student</p>';
      messageDiv.classList.remove("hidden");
      return;
    }

    try {
      const response = await fetch("/instructor/api/instructor/assign-topic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topicId, studentId }),
      });

      const data = await response.json();

      if (data.success) {
        messageDiv.innerHTML = `<p class="text-green-500">${data.message || "Topic assigned successfully!"}</p>`;

        // Refresh the available topics and current assignments
        loadAvailableTopics();
        loadCurrentAssignments();

        // Reset form
        document.getElementById("topic-select").value = "";
        document.getElementById("student-search").value = "";
        document.getElementById("selected-student-id").value = "";
        document.getElementById("assign-button").disabled = true;
      } else {
        messageDiv.innerHTML = `<p class="text-red-500">${data.message || "Failed to assign topic"}</p>`;
      }

      messageDiv.classList.remove("hidden");
    } catch (error) {
      console.error("Error assigning topic:", error);
      messageDiv.innerHTML =
        '<p class="text-red-500">Server error while assigning topic</p>';
      messageDiv.classList.remove("hidden");
    }
  }

  async function loadCurrentAssignments() {
    try {
      const response = await fetch(
        "/instructor/api/instructor/current-assignments",
      );
      const data = await response.json();

      const assignmentsDiv = document.getElementById("current-assignments");

      if (data.success) {
        if (data.assignments.length === 0) {
          assignmentsDiv.innerHTML =
            '<p class="text-gray-500 text-center">No current assignments</p>';
        } else {
          let assignmentsHtml = "";
          data.assignments.forEach((assignment) => {
            assignmentsHtml += `
                          <div class="bg-white p-4 rounded-md shadow border-l-4 border-indigo-500">
                              <div class="flex justify-between items-start">
                                  <div>
                                      <h3 class="font-semibold text-lg">${assignment.topic_title}</h3>
                                      <p class="text-sm text-gray-600">Assigned to: ${assignment.student_name}</p>
                                      <p class="text-sm text-gray-600">Status: ${assignment.status}</p>
                                      <p class="text-xs text-gray-500">Assigned on: ${new Date(assignment.assigned_date).toLocaleDateString()}</p>
                                  </div>
                                  <button class="text-red-500 hover:text-red-700 cancel-assignment-btn"
                                          data-assignment-id="${assignment.id}">
                                      Cancel
                                  </button>
                              </div>
                          </div>
                      `;
          });
          assignmentsDiv.innerHTML = assignmentsHtml;

          // Add click events to cancel buttons
          document.querySelectorAll(".cancel-assignment-btn").forEach((el) => {
            el.addEventListener("click", function () {
              cancelAssignment(this.getAttribute("data-assignment-id"));
            });
          });
        }
      } else {
        assignmentsDiv.innerHTML = `<p class="text-red-500 text-center">${data.message || "Error loading assignments"}</p>`;
      }
    } catch (error) {
      console.error("Error loading assignments:", error);
      document.getElementById("current-assignments").innerHTML =
        '<p class="text-red-500 text-center">Server error while loading assignments</p>';
    }
  }

  async function cancelAssignment(assignmentId) {
    if (!confirm("Are you sure you want to cancel this assignment?")) {
      return;
    }

    try {
      const response = await fetch(
        `/instructor/api/instructor/cancel-assignment/${assignmentId}`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (data.success) {
        // Refresh the lists
        loadAvailableTopics();
        loadCurrentAssignments();
      } else {
        alert(data.message || "Failed to cancel assignment");
      }
    } catch (error) {
      console.error("Error cancelling assignment:", error);
      alert("Server error while cancelling assignment");
    }
  }

  // ---- Assign Topic Integration (from assign-topic.html) ----
  if (document.getElementById("assignTopicForm")) {
    loadAvailableTopics();
    loadCurrentAssignments();

    document
      .getElementById("search-student-btn")
      .addEventListener("click", searchStudents);

    document
      .getElementById("assignTopicForm")
      .addEventListener("submit", assignTopic);
  }
});

// --- Instructor Statistics ---
// Chart.js chart instances (to allow updating/destroying)
let completionTimeChart, gradeChart, totalThesesChart;

async function loadInstructorStatistics() {
  // Get canvas contexts
  const ctxCompletionElem = document.getElementById("completionTimeChart");
  const ctxGradeElem = document.getElementById("gradeChart");
  const ctxTotalElem = document.getElementById("totalThesesChart");

  if (!ctxCompletionElem || !ctxGradeElem || !ctxTotalElem) return;

  // Destroy previous charts if any
  if (window.completionTimeChart) window.completionTimeChart.destroy();
  if (window.gradeChart) window.gradeChart.destroy();
  if (window.totalThesesChart) window.totalThesesChart.destroy();

  // Helper: Show "No data" message on a canvas
  function showNoData(canvas, message = "No data available") {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  }

  // Show loading
  showNoData(ctxCompletionElem, "Loading...");
  showNoData(ctxGradeElem, "Loading...");
  showNoData(ctxTotalElem, "Loading...");

  try {
    const res = await fetch("/instructor/api/instructor/statistics");
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || "Failed to load statistics");

    const { supervisor, committee } = data.statistics;

    // Prepare data (handle nulls)
    const avgCompletionSupervisor = supervisor.avg_completion_time
      ? Number(supervisor.avg_completion_time)
      : null;
    const avgCompletionCommittee = committee.avg_completion_time
      ? Number(committee.avg_completion_time)
      : null;
    const avgGradeSupervisor = supervisor.avg_grade
      ? Number(supervisor.avg_grade)
      : null;
    const avgGradeCommittee = committee.avg_grade
      ? Number(committee.avg_grade)
      : null;
    const totalSupervisor = supervisor.total || 0;
    const totalCommittee = committee.total || 0;

    // --- Chart 1: Average Completion Time ---
    if (avgCompletionSupervisor === null && avgCompletionCommittee === null) {
      showNoData(ctxCompletionElem, "No completion data");
    } else {
      window.completionTimeChart = new Chart(ctxCompletionElem, {
        type: "bar",
        data: {
          labels: ["Supervisor", "Committee Member"],
          datasets: [
            {
              label: "Avg. Completion Time (days)",
              data: [avgCompletionSupervisor ?? 0, avgCompletionCommittee ?? 0],
              backgroundColor: ["#6366f1", "#10b981"],
              borderRadius: 12,
              maxBarThickness: 48,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
            datalabels: {
              display: true,
              color: "#374151",
              font: { weight: "bold" },
              anchor: "end",
              align: "top",
              formatter: (v) => (v ? v.toFixed(1) : "–"),
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Days" },
              grid: { color: "#e5e7eb" },
            },
            x: {
              grid: { display: false },
            },
          },
        },
        plugins: [ChartDataLabels],
      });
    }

    // --- Chart 2: Average Grade ---
    if (avgGradeSupervisor === null && avgGradeCommittee === null) {
      showNoData(ctxGradeElem, "No grade data");
    } else {
      window.gradeChart = new Chart(ctxGradeElem, {
        type: "bar",
        data: {
          labels: ["Supervisor", "Committee Member"],
          datasets: [
            {
              label: "Avg. Grade",
              data: [avgGradeSupervisor ?? 0, avgGradeCommittee ?? 0],
              backgroundColor: ["#6366f1", "#10b981"],
              borderRadius: 12,
              maxBarThickness: 48,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
            datalabels: {
              display: true,
              color: "#374151",
              font: { weight: "bold" },
              anchor: "end",
              align: "top",
              formatter: (v) => (v ? v.toFixed(2) : "–"),
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Grade" },
              grid: { color: "#e5e7eb" },
            },
            x: {
              grid: { display: false },
            },
          },
        },
        plugins: [ChartDataLabels],
      });
    }

    // --- Chart 3: Total Number of Theses ---
    if (totalSupervisor === 0 && totalCommittee === 0) {
      showNoData(ctxTotalElem, "No thesis data");
    } else {
      window.totalThesesChart = new Chart(ctxTotalElem, {
        type: "doughnut",
        data: {
          labels: ["Supervised", "Committee Member"],
          datasets: [
            {
              label: "Total Theses",
              data: [totalSupervisor, totalCommittee],
              backgroundColor: ["#6366f1", "#10b981"],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            tooltip: { enabled: true },
            datalabels: {
              display: true,
              color: "#374151",
              font: { weight: "bold" },
              formatter: (v) => (v ? v : "–"),
            },
          },
        },
        plugins: [ChartDataLabels],
      });
    }
  } catch (err) {
    showNoData(ctxCompletionElem, "Error loading statistics");
    showNoData(ctxGradeElem, "Error loading statistics");
    showNoData(ctxTotalElem, "Error loading statistics");
  }
}

function showCancelActiveThesisModal(thesisId, thesisTitle) {
  // Create modal if it doesn't exist
  if (!document.getElementById("cancelActiveThesisModal")) {
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

    // Append modal to body
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Add event listeners
    document
      .getElementById("closeCancelThesisModal")
      .addEventListener("click", closeCancelThesisModal);
    document
      .getElementById("cancelThesisModalClose")
      .addEventListener("click", closeCancelThesisModal);
    document
      .getElementById("cancelActiveThesisForm")
      .addEventListener("submit", handleCancelActiveThesisSubmit);
  }

  // Update modal content and show it
  document.getElementById("cancelThesisTitle").textContent = thesisTitle;
  document.getElementById("cancelThesisId").value = thesisId;
  document.getElementById("gaNumber").value = "";
  document.getElementById("gaYear").value = "";
  document.getElementById("cancellationReason").value = "";
  document.getElementById("cancelThesisMessage").classList.add("hidden");

  document.getElementById("cancelActiveThesisModal").classList.remove("hidden");
}

function closeCancelThesisModal() {
  document.getElementById("cancelActiveThesisModal").classList.add("hidden");
}

async function handleCancelActiveThesisSubmit(e) {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gaNumber, gaYear, cancellationReason }),
      },
    );

    const data = await response.json();

    if (data.success) {
      messageElement.textContent = "Thesis cancelled successfully!";
      messageElement.classList.remove("hidden", "text-red-600");
      messageElement.classList.add("text-green-600");

      // Refresh the theses list or update UI
      setTimeout(() => {
        closeCancelThesisModal();
        // Reload the data
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
