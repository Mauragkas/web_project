/**
 * Instructor topic management
 * Single Responsibility: CRUD operations and UI for instructor topics
 */

import { deleteJSON } from "../utils/api.js";
import { showLoading, showError, showEmpty } from "../utils/ui.js";

/**
 * Loads and renders the instructor's topics list
 */
export async function loadInstructorTopics() {
  const topicsList = document.getElementById("instructor-topics-list");
  if (!topicsList) return;

  showLoading(topicsList, "Loading topics...");

  try {
    const res = await fetch("/instructor/api/instructor/topics");
    const data = await res.json();

    if (!data.success) {
      showError(topicsList, "Failed to load topics.");
      return;
    }
    if (!data.topics.length) {
      showEmpty(topicsList, "No topics found.");
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

    _bindEditButtons();
    _bindDeleteButtons();
    _bindEditModalClose();
    _bindEditFormSubmit();
  } catch (err) {
    showError(topicsList, "Server error loading topics.");
  }
}

/**
 * Binds click handlers to edit topic buttons
 * @private
 */
function _bindEditButtons() {
  document.querySelectorAll(".edit-topic-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const topicDiv = btn.closest("[data-topic-id]");
      const topicId = topicDiv.getAttribute("data-topic-id");

      const res = await fetch(
        `/instructor/api/instructor/topics/${topicId}/edit`,
      );
      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Failed to load topic details.");
        return;
      }

      const topic = data.topic;
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

      document.getElementById("editTopicModal").classList.remove("hidden");
    });
  });
}

/**
 * Binds click handlers to delete topic buttons
 * @private
 */
function _bindDeleteButtons() {
  document.querySelectorAll("[data-topic-id] .text-red-500").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const topicDiv = btn.closest("[data-topic-id]");
      const topicId = topicDiv.getAttribute("data-topic-id");

      if (!confirm("Are you sure you want to delete this topic?")) return;

      try {
        const data = await deleteJSON(
          `/instructor/api/instructor/topics/${topicId}/delete`,
        );
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
}

/**
 * Binds the close button for the edit topic modal
 * @private
 */
function _bindEditModalClose() {
  const closeEditModalBtn = document.getElementById("closeEditModal");
  if (closeEditModalBtn) {
    closeEditModalBtn.onclick = function () {
      document.getElementById("editTopicModal").classList.add("hidden");
    };
  }
}

/**
 * Binds the edit topic form submission (only once via data attribute guard)
 * @private
 */
function _bindEditFormSubmit() {
  const editTopicForm = document.getElementById("editTopicForm");
  if (editTopicForm && !editTopicForm.dataset.listenerAttached) {
    editTopicForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const topicId = document.getElementById("edit-topic-id").value;
      const formData = new FormData(e.target);
      const messageEl = document.getElementById("editTopicMessage");

      messageEl.classList.add("hidden");
      messageEl.textContent = "";

      try {
        const response = await fetch(
          `/instructor/api/instructor/topics/${topicId}/update`,
          { method: "POST", body: formData },
        );
        const data = await response.json();

        if (data.success) {
          messageEl.textContent = "Topic updated successfully!";
          messageEl.classList.remove("hidden", "text-red-600");
          messageEl.classList.add("text-green-600");
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
}
