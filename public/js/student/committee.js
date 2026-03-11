/**
 * Student committee selection and invitation sending
 * Single Responsibility: Committee member search, selection, and invitation
 */

// Module-level state for selected instructors
let selectedInstructors = [];

/**
 * Initializes committee search input listener
 */
export function initCommitteeSearch() {
  const searchInput = document.getElementById("instructor-search");
  if (!searchInput) return;

  searchInput.addEventListener("input", async function () {
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
}

/**
 * Renders the selected instructors list with remove buttons
 */
export function renderSelectedInstructors() {
  const div = document.getElementById("selected-instructors");
  if (!div) return;

  div.innerHTML = selectedInstructors
    .map(
      (i, idx) =>
        `<span class="inline-block bg-indigo-100 text-indigo-700 px-2 py-1 rounded mr-2 mb-1">
          ${i.name} <button class="remove-instructor" data-idx="${idx}">&times;</button>
        </span>`,
    )
    .join("");

  document.querySelectorAll(".remove-instructor").forEach((btn) => {
    btn.addEventListener("click", function () {
      selectedInstructors.splice(Number(this.getAttribute("data-idx")), 1);
      renderSelectedInstructors();
    });
  });

  const sendBtn = document.getElementById("send-invitations-btn");
  if (sendBtn) sendBtn.disabled = selectedInstructors.length === 0;
}

/**
 * Initializes the send invitations button
 */
export function initSendInvitationsButton() {
  const btn = document.getElementById("send-invitations-btn");
  if (!btn) return;

  btn.addEventListener("click", async function () {
    const thesisId = window.studentThesisId;
    const messageDiv = document.getElementById("committee-message");

    if (!thesisId) {
      messageDiv.classList.remove("hidden", "text-green-600");
      messageDiv.classList.add("text-red-600");
      messageDiv.textContent =
        "Error: No thesis found. Please contact support.";
      return;
    }

    const instructorIds = selectedInstructors.map((i) => i.id);
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
}
