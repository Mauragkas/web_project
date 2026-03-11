/**
 * Thesis grading interface for instructors/secretariat
 * Single Responsibility: All grading-related UI and API interactions
 */

/**
 * Sets up the grading interface for a thesis
 * @param {string|number} thesisId
 */
export async function setupGradingInterface(thesisId) {
  try {
    const response = await fetch(
      `/instructor/api/instructor/thesis/${thesisId}/grades`,
    );
    const data = await response.json();

    const activateBtn = document.getElementById(
      `activateGradingBtn-${thesisId}`,
    );
    const viewGradesBtn = document.getElementById(`viewGradesBtn-${thesisId}`);
    const gradesContainer = document.getElementById(
      `grades-container-${thesisId}`,
    );

    if (data.success) {
      if (data.canActivate && data.grades.length === 0 && activateBtn) {
        activateBtn.classList.remove("hidden");
        activateBtn.onclick = () => activateGrading(thesisId);
      }
      if (viewGradesBtn) {
        viewGradesBtn.onclick = () => showGradingInterface(thesisId, data);
      }
    } else {
      if (
        data.message === "Grading not activated" &&
        data.canActivate &&
        activateBtn
      ) {
        activateBtn.classList.remove("hidden");
        activateBtn.onclick = () => activateGrading(thesisId);
      } else if (gradesContainer) {
        gradesContainer.innerHTML = `<div class="text-red-500">${data.message}</div>`;
        gradesContainer.classList.remove("hidden");
      }
      if (viewGradesBtn) {
        viewGradesBtn.onclick = null;
      }
    }
  } catch (error) {
    console.error("Error setting up grading interface:", error);
  }
}

/**
 * Activates grading for a thesis (supervisor only)
 * @param {string|number} thesisId
 */
export async function activateGrading(thesisId) {
  try {
    const response = await fetch(
      `/instructor/api/instructor/thesis/${thesisId}/activate-grading`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );
    const data = await response.json();

    if (data.success) {
      alert("Grading activated successfully!");
      await setupGradingInterface(thesisId);
    } else {
      alert(data.message || "Failed to activate grading");
    }
  } catch (error) {
    console.error("Error activating grading:", error);
    alert("Server error while activating grading");
  }
}

/**
 * Renders the grading interface (form + other grades) in the container
 * @param {string|number} thesisId
 * @param {object|null} initialData
 */
export async function showGradingInterface(thesisId, initialData = null) {
  const container = document.getElementById(`grades-container-${thesisId}`);
  if (!container) return;

  if (!initialData) {
    try {
      const response = await fetch(
        `/instructor/api/instructor/thesis/${thesisId}/grades`,
      );
      initialData = await response.json();
    } catch (error) {
      console.error("Error loading grades:", error);
      return;
    }
  }

  if (!initialData.success) {
    container.innerHTML = `<div class="text-red-500">${initialData.message}</div>`;
    container.classList.remove("hidden");
    return;
  }

  const currentUserId = window.currentUserId;
  const myGrade = initialData.grades.find(
    (g) => g.instructor_id == currentUserId,
  );
  const otherGrades = initialData.grades.filter(
    (g) => g.instructor_id != currentUserId,
  );

  container.innerHTML = `
    <div class="bg-gray-50 p-4 rounded-md">
      <h5 class="font-medium mb-3">Submit Your Grade</h5>
      <form id="gradeForm-${thesisId}" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Overall Grade (0-10) <span class="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="gradeValue-${thesisId}"
              min="0"
              max="10"
              step="0.1"
              value="${myGrade ? myGrade.grade_value : ""}"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Criteria Details (JSON)
            </label>
            <textarea
              id="criteria-${thesisId}"
              rows="3"
              placeholder='{"originality": 8, "methodology": 7, "presentation": 9}'
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >${myGrade && myGrade.criteria_json ? myGrade.criteria_json : ""}</textarea>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Comments</label>
          <textarea
            id="comments-${thesisId}"
            rows="3"
            class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >${myGrade ? myGrade.comments || "" : ""}</textarea>
        </div>
        <div id="gradeMessage-${thesisId}" class="text-sm hidden"></div>
        <button
          type="submit"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
        >
          ${myGrade ? "Update Grade" : "Submit Grade"}
        </button>
      </form>
      ${
        otherGrades.length > 0
          ? `
        <div class="mt-6 pt-4 border-t">
          <h5 class="font-medium mb-3">Other Committee Members' Grades</h5>
          <div class="space-y-2">
            ${otherGrades
              .map(
                (grade) => `
              <div class="bg-white p-3 rounded border">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="font-medium">${grade.instructor_name}</span>
                    <span class="text-sm text-gray-500">(${grade.instructor_role})</span>
                  </div>
                  <span class="text-lg font-bold text-indigo-600">${grade.grade_value}/10</span>
                </div>
                ${grade.comments ? `<p class="text-sm text-gray-600 mt-1">${grade.comments}</p>` : ""}
                <p class="text-xs text-gray-400">Submitted: ${new Date(grade.created_at).toLocaleString()}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;

  container.classList.remove("hidden");

  document
    .getElementById(`gradeForm-${thesisId}`)
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitGrade(thesisId);
    });
}

/**
 * Submits a grade for a thesis
 * @param {string|number} thesisId
 */
export async function submitGrade(thesisId) {
  const messageEl = document.getElementById(`gradeMessage-${thesisId}`);
  if (messageEl) messageEl.classList.add("hidden");

  const gradeValue = parseFloat(
    document.getElementById(`gradeValue-${thesisId}`).value,
  );
  const criteriaText = document
    .getElementById(`criteria-${thesisId}`)
    .value.trim();
  const comments = document.getElementById(`comments-${thesisId}`).value.trim();

  let criteria = null;
  if (criteriaText) {
    try {
      criteria = JSON.parse(criteriaText);
    } catch (error) {
      if (messageEl) {
        messageEl.textContent = "Invalid JSON format in criteria field";
        messageEl.classList.remove("hidden");
        messageEl.className = "text-red-600 text-sm";
      }
      return;
    }
  }

  try {
    const response = await fetch(
      `/instructor/api/instructor/thesis/${thesisId}/submit-my-grade`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeValue, criteria, comments }),
      },
    );

    const data = await response.json();

    if (data.success) {
      let msg = data.message;
      if (data.allGradesSubmitted) {
        msg +=
          " All committee members have submitted their grades. Thesis is now marked as 'Graded'.";
      } else {
        msg += ` (${data.submittedCount}/${data.expectedCount} grades submitted)`;
      }

      if (messageEl) {
        messageEl.textContent = msg;
        messageEl.className = "text-green-600 text-sm";
        messageEl.classList.remove("hidden");
      }

      setTimeout(() => {
        showGradingInterface(thesisId);
      }, 2000);
    } else {
      if (messageEl) {
        messageEl.textContent = data.message || "Failed to submit grade";
        messageEl.className = "text-red-600 text-sm";
        messageEl.classList.remove("hidden");
      }
    }
  } catch (error) {
    console.error("Error submitting grade:", error);
    if (messageEl) {
      messageEl.textContent = "Server error while submitting grade";
      messageEl.className = "text-red-600 text-sm";
      messageEl.classList.remove("hidden");
    }
  }
}
