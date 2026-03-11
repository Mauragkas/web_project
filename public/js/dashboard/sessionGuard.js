/**
 * Session guard / validity checker
 * Single Responsibility: Protect dashboard pages from unauthorized access
 */

import { checkAuthStatus } from "../auth/authService.js";

/**
 * Checks session validity and redirects if not authenticated
 * or if the user is on the wrong dashboard for their role.
 * Also sets window.currentUserId for grading UI.
 */
export async function checkSessionValidity() {
  try {
    const data = await checkAuthStatus();

    if (!data.isLoggedIn) {
      window.location.href = "/auth/login";
      return;
    }

    if (typeof data.userId !== "undefined") {
      window.currentUserId = data.userId;
    }

    const currentPath = window.location.pathname;
    const userRole = data.userRole;

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
  } catch (error) {
    console.error("Session check failed:", error);
    window.location.href = "/auth/login";
  }
}

/**
 * Initializes session protection on a dashboard page:
 * checks on load and on tab visibility change.
 */
export function initSessionGuard() {
  const currentPath = window.location.pathname;

  if (
    currentPath.startsWith("/student/") ||
    currentPath.startsWith("/instructor/") ||
    currentPath.startsWith("/secretariat/")
  ) {
    checkSessionValidity();

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        checkSessionValidity();
      }
    });
  }
}
