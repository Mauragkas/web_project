/**
 * File download utility
 * Single Responsibility: Handles file download via fetch + blob
 */

/**
 * Downloads a file from a URL using fetch (supports credentials)
 * @param {string} url
 * @param {string} filename
 */
export function downloadFile(url, filename) {
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
