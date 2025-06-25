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

// Initialize event listeners when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
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

  // Page specific initializations
  const currentPath = window.location.pathname;

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
});
