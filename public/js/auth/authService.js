/**
 * Authentication API service
 * Single Responsibility: All auth-related API calls
 */

import { postJSON, getJSON } from "../utils/api.js";

/**
 * Sends login credentials to the server
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, userRole?: string, message?: string}>}
 */
export async function loginRequest(username, password) {
  return postJSON("/auth/login", { username, password });
}

/**
 * Sends logout request to the server
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function logoutRequest() {
  return postJSON("/auth/logout", {});
}

/**
 * Checks current authentication status
 * @returns {Promise<{isLoggedIn: boolean, username?: string, userRole?: string, userId?: number}>}
 */
export async function checkAuthStatus() {
  return getJSON("/auth/check-auth");
}
