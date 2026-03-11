/**
 * Authentication UI controller
 * Single Responsibility: DOM updates related to auth state
 */

import { loginRequest, logoutRequest, checkAuthStatus } from "./authService.js";
import { displayMessage, capitalizeFirstLetter } from "../utils/ui.js";

/**
 * Handles the login form submission
 * @param {Event} event
 */
export async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const username = form.querySelector("#username").value.trim();
  const password = form.querySelector("#password").value.trim();
  const messageElement = document.getElementById("loginMessage");

  messageElement.classList.add("hidden");
  messageElement.textContent = "";

  if (!username || !password) {
    displayMessage(
      messageElement,
      "Please enter both username and password.",
      true,
    );
    return;
  }

  try {
    const data = await loginRequest(username, password);

    if (data.success) {
      displayMessage(messageElement, "Login successful! Redirecting...", false);

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
      }, 1000);
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
 * Handles the logout button click
 * @param {Event} event
 */
export async function handleLogout(event) {
  event.preventDefault();

  try {
    const data = await logoutRequest();

    if (data.success) {
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
 * Toggles the user dropdown menu visibility
 */
export function toggleUserMenu() {
  const userMenu = document.getElementById("userDropdown");
  if (userMenu) {
    userMenu.classList.toggle("hidden");
  }
}

/**
 * Checks if user is logged in and updates the nav UI accordingly
 */
export async function checkUserLoggedIn() {
  try {
    const data = await checkAuthStatus();

    if (data.isLoggedIn) {
      document.getElementById("loginButtonContainer")?.classList.add("hidden");

      const displayName = document.getElementById("userDisplayName");
      const roleBadge = document.getElementById("userRoleBadge");
      const dashboardLink = document.getElementById("dashboardLink");
      const userInfoContainer = document.getElementById("userInfoContainer");

      if (displayName) displayName.textContent = data.username;
      if (roleBadge)
        roleBadge.textContent = capitalizeFirstLetter(data.userRole);
      if (dashboardLink) dashboardLink.href = `/${data.userRole}/dashboard`;
      if (userInfoContainer) userInfoContainer.classList.remove("hidden");
    } else {
      document.getElementById("userInfoContainer")?.classList.add("hidden");
      document
        .getElementById("loginButtonContainer")
        ?.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error checking authentication status:", error);
    document.getElementById("userInfoContainer")?.classList.add("hidden");
    document.getElementById("loginButtonContainer")?.classList.remove("hidden");
  }
}
