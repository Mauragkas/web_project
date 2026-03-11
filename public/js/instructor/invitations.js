/**
 * Instructor committee invitation management
 * Single Responsibility: Load and respond to committee invitations
 */

import { showLoading, showError, showEmpty } from "../utils/ui.js";

/**
 * Loads and renders the committee invitations list
 */
export async function loadCommitteeInvitations() {
  const listDiv = document.getElementById("committee-invitations-list");
  if (!listDiv) return;

  showLoading(listDiv, "Loading invitations...");

  try {
    const res = await fetch("/instructor/api/instructor/committee-invitations");
    const data = await res.json();

    if (!data.success) {
      showError(listDiv, "Failed to load invitations.");
      return;
    }
    if (!data.invitations.length) {
      showEmpty(listDiv, "No invitations found.");
      return;
    }

    listDiv.innerHTML = data.invitations
      .map((inv) => {
        let statusBadge = "";
        if (inv.invitation_status === "Invited") {
          statusBadge = `<span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Pending</span>`;
        } else if (inv.invitation_status === "Accepted") {
          statusBadge = `<span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Accepted</span>`;
        } else if (inv.invitation_status === "Rejected") {
          statusBadge = `<span class="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Rejected</span>`;
        }
        return `
          <div class="bg-white bg-opacity-60 p-3 rounded-md mb-2 flex flex-col md:flex-row justify-between items-start md:items-center border-l-4 border-indigo-500">
            <div>
              <p class="font-semibold">${inv.topic_title}</p>
              <p class="text-sm text-gray-500">Student: ${inv.student_name}</p>
              <p class="text-sm text-gray-500">Supervisor: ${inv.supervisor_name}</p>
              <p class="text-sm text-gray-500">Thesis Status: ${inv.thesis_status}</p>
              <p class="text-xs text-gray-400">Invited: ${new Date(inv.invitation_date).toLocaleDateString()}</p>
              <p class="text-xs text-gray-400">Status: ${statusBadge}</p>
            </div>
            <div class="mt-2 md:mt-0">
              ${
                inv.invitation_status === "Invited"
                  ? `
                <button class="text-sm text-green-600 hover:underline mr-2 respond-invitation-btn" data-invitation-id="${inv.invitation_id}" data-action="Accepted">Accept</button>
                <button class="text-sm text-red-600 hover:underline respond-invitation-btn" data-invitation-id="${inv.invitation_id}" data-action="Rejected">Reject</button>
              `
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

    _bindRespondButtons();
  } catch (err) {
    showError(listDiv, "Server error loading invitations.");
  }
}

/**
 * Binds respond (Accept/Reject) button click handlers
 * @private
 */
function _bindRespondButtons() {
  document.querySelectorAll(".respond-invitation-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const invitationId = btn.getAttribute("data-invitation-id");
      const action = btn.getAttribute("data-action");

      if (
        !confirm(
          `Are you sure you want to ${action.toLowerCase()} this invitation?`,
        )
      )
        return;

      try {
        const res = await fetch(
          `/instructor/api/instructor/committee-invitations/${invitationId}/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          },
        );
        const data = await res.json();

        if (data.success) {
          alert(
            data.message +
              (data.thesisFinalized
                ? "\nThesis is now Active (enough members accepted)."
                : ""),
          );
          loadCommitteeInvitations();
        } else {
          alert(data.message || "Failed to respond to invitation.");
        }
      } catch (err) {
        alert("Server error. Please try again.");
      }
    });
  });
}
