/**
 * Generic API utility functions
 * Single Responsibility: HTTP request helpers only
 */

/**
 * Makes a GET request and returns parsed JSON
 * @param {string} url
 * @returns {Promise<any>}
 */
export async function getJSON(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
}

/**
 * Makes a POST request with JSON body and returns parsed JSON
 * @param {string} url
 * @param {object} body
 * @returns {Promise<any>}
 */
export async function postJSON(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

/**
 * Makes a DELETE request and returns parsed JSON
 * @param {string} url
 * @returns {Promise<any>}
 */
export async function deleteJSON(url) {
  const response = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
}

/**
 * Makes a POST request with FormData body and returns parsed JSON
 * @param {string} url
 * @param {FormData} formData
 * @returns {Promise<any>}
 */
export async function postFormData(url, formData) {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });
  return response.json();
}
