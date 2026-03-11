/**
 * Generic UI utility functions
 * Single Responsibility: DOM manipulation helpers only
 */

/**
 * Displays a message to the user in a given element
 * @param {HTMLElement} element
 * @param {string} message
 * @param {boolean} isError
 */
export function displayMessage(element, message, isError) {
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
 * Capitalizes the first letter of a string
 * @param {string} string
 * @returns {string}
 */
export function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Shows a loading message inside a container element
 * @param {HTMLElement} element
 * @param {string} [message]
 */
export function showLoading(element, message = "Loading...") {
  if (element) {
    element.innerHTML = `<div class="text-gray-500 text-center">${message}</div>`;
  }
}

/**
 * Shows an error message inside a container element
 * @param {HTMLElement} element
 * @param {string} [message]
 */
export function showError(element, message = "An error occurred.") {
  if (element) {
    element.innerHTML = `<div class="text-red-500 text-center">${message}</div>`;
  }
}

/**
 * Shows an info/empty message inside a container element
 * @param {HTMLElement} element
 * @param {string} message
 */
export function showEmpty(element, message) {
  if (element) {
    element.innerHTML = `<div class="text-gray-500 text-center">${message}</div>`;
  }
}
