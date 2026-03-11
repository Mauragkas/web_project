/**
 * Instructor topic assignment to students
 * Single Responsibility: Topic-to-student assignment workflow
 */

import { showError, showEmpty } from "../utils/ui.js";

/**
 * Loads available (unassigned) topics into the topic-select dropdown
 */
export async function loadAvailableTopics() {
  const topicSelect = document.getElementById("topic-select");
  if (!topicSelect) return;

  try {
    const response = await fetch("/instructor/api/instructor/available-topics");
    const data = await response.json();

    if (data.success) {
      if (data.topics.length === 0) {
        topicSelect.innerHTML = '<option value="">No available topics</option>';
      } else {
        let options = '<option value="">-- Select a topic --</option>';
        data.topics.forEach((topic) => {
          options += `<option value="${topic.id}">${topic.title}</option>`;
        });
        topicSelect.innerHTML = options;
      }
    } else {
      topicSelect.innerHTML = '<option value="">Error loading topics</option>';
    }
  } catch (error) {
    console.error("Error loading topics:", error);
    if (topicSelect) {
      topicSelect.innerHTML = '<option value="">Error loading topics</option>';
    }
  }
}

/**
 * Searches students matching a query and renders results
 */
export async function searchStudents() {
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
        resultsDiv.innerHTML = '<p class="text-gray-500">No students found</p>';
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

/**
 * Selects a student from the search results
 * @param {string} studentId
 * @param {string} studentName
 */
export function selectStudent(studentId, studentName) {
  const selectedStudentIdInput = document.getElementById("selected-student-id");
  const studentSearchInput = document.getElementById("student-search");
  const studentSearchResults = document.getElementById(
    "student-search-results",
  );
  const assignButton = document.getElementById("assign-button");

  if (selectedStudentIdInput) selectedStudentIdInput.value = studentId;
  if (studentSearchInput) studentSearchInput.value = studentName;
  if (studentSearchResults) studentSearchResults.classList.add("hidden");
  if (assignButton) assignButton.disabled = false;
}

/**
 * Handles the assign topic form submission
 * @param {Event} e
 */
export async function assignTopic(e) {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, studentId }),
    });

    const data = await response.json();

    if (data.success) {
      messageDiv.innerHTML = `<p class="text-green-500">${data.message || "Topic assigned successfully!"}</p>`;
      loadAvailableTopics();
      loadCurrentAssignments();

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

/**
 * Loads and renders the current topic assignments
 */
export async function loadCurrentAssignments() {
  const assignmentsDiv = document.getElementById("current-assignments");
  if (!assignmentsDiv) return;

  try {
    const response = await fetch(
      "/instructor/api/instructor/current-assignments",
    );
    const data = await response.json();

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

        document.querySelectorAll(".cancel-assignment-btn").forEach((el) => {
          el.addEventListener("click", function () {
            cancelAssignment(this.getAttribute("data-assignment-id"));
          });
        });
      }
    } else {
      showError(assignmentsDiv, data.message || "Error loading assignments");
    }
  } catch (error) {
    console.error("Error loading assignments:", error);
    showError(assignmentsDiv, "Server error while loading assignments");
  }
}

/**
 * Cancels a topic assignment
 * @param {string} assignmentId
 */
export async function cancelAssignment(assignmentId) {
  if (!confirm("Are you sure you want to cancel this assignment?")) return;

  try {
    const response = await fetch(
      `/instructor/api/instructor/cancel-assignment/${assignmentId}`,
      { method: "POST" },
    );
    const data = await response.json();

    if (data.success) {
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

/**
 * Initializes the assign topic form if present on the page
 */
export function initAssignTopicForm() {
  if (!document.getElementById("assignTopicForm")) return;

  loadAvailableTopics();
  loadCurrentAssignments();

  document
    .getElementById("search-student-btn")
    ?.addEventListener("click", searchStudents);

  document
    .getElementById("assignTopicForm")
    ?.addEventListener("submit", assignTopic);
}
