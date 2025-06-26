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
      // For demonstration, showing under-assignment-actions
      const underAssignmentActions = document.getElementById(
        "under-assignment-actions",
      );
      if (underAssignmentActions) {
        underAssignmentActions.classList.remove("hidden");
      }
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

/**
 * Public announcements page filter functionality
 */
function handleAnnouncementsFilter() {
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  console.log("Filtering from", startDate, "to", endDate);
  // Add AJAX call here to fetch announcements based on dates
}

/**
 * Handle XML Feed generation
 */
function generateXmlFeed() {
  console.log("Generate XML Feed clicked");
  // Implementation would follow
}

/**
 * Handle JSON Feed generation
 */
function generateJsonFeed() {
  console.log("Generate JSON Feed clicked");
  // Implementation would follow
}

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
async function showThesisDetailsModal(thesisId) {
  const modal = document.getElementById("thesisDetailsModal");
  const content = document.getElementById("thesis-details-content");
  modal.classList.remove("hidden");
  content.innerHTML = '<div class="text-center text-gray-500">Loading...</div>';

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
    content.innerHTML = `
      <div>
        <h3 class="text-xl font-semibold mb-2">${t.topic_title}</h3>
        <p><span class="font-semibold">Student:</span> ${t.student_name} (${t.student_email || "-"})</p>
        <p><span class="font-semibold">Supervisor:</span> ${t.supervisor_name} (${t.supervisor_email || "-"})</p>
        <p><span class="font-semibold">Committee:</span> ${t.committee_members || "-"}</p>
        <p><span class="font-semibold">Status:</span> ${t.status}</p>
        <p><span class="font-semibold">Assigned Date:</span> ${t.assigned_date ? new Date(t.assigned_date).toLocaleDateString() : "-"}</p>
        <p><span class="font-semibold">Completion Date:</span> ${t.completion_date ? new Date(t.completion_date).toLocaleDateString() : "-"}</p>
        <p><span class="font-semibold">Grade:</span> ${t.grade || "-"}</p>
        <p><span class="font-semibold">AP Number:</span> ${t.ap_number || "-"}</p>
        <p><span class="font-semibold">Library Link:</span> ${t.library_link ? `<a href="${t.library_link}" target="_blank" class="text-indigo-600 underline">Nemertis</a>` : "-"}</p>
        <p><span class="font-semibold">Description:</span> ${t.topic_description || "-"}</p>
        <p><span class="font-semibold">Attached File:</span> ${t.topic_document_path ? `<a href="${t.topic_document_path}" target="_blank" class="text-indigo-600 underline">PDF</a>` : "No file"}</p>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="text-red-500 text-center">Server error loading thesis details.</div>`;
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

  // Check if we're on the announcements page
  if (currentPath.includes("/public/announcements")) {
    checkUserLoggedIn();

    // Filter button
    const filterButton = document.querySelector(".bg-indigo-600");
    if (filterButton) {
      filterButton.addEventListener("click", handleAnnouncementsFilter);
    }

    // Feed generation buttons
    const feedButtons = document.querySelectorAll(".text-center button");
    if (feedButtons.length >= 2) {
      feedButtons[0].addEventListener("click", generateXmlFeed);
      feedButtons[1].addEventListener("click", generateJsonFeed);
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
