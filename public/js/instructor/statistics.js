/**
 * Instructor statistics charts
 * Single Responsibility: Load data and render Chart.js charts for statistics
 */

/**
 * Loads instructor statistics and renders charts.
 * Requires Chart.js and ChartDataLabels to be loaded globally.
 */
export async function loadInstructorStatistics() {
  const ctxCompletionElem = document.getElementById("completionTimeChart");
  const ctxGradeElem = document.getElementById("gradeChart");
  const ctxTotalElem = document.getElementById("totalThesesChart");

  if (!ctxCompletionElem || !ctxGradeElem || !ctxTotalElem) return;

  // Destroy previous chart instances if present on window
  if (window.completionTimeChart) window.completionTimeChart.destroy();
  if (window.gradeChart) window.gradeChart.destroy();
  if (window.totalThesesChart) window.totalThesesChart.destroy();

  _showNoData(ctxCompletionElem, "Loading...");
  _showNoData(ctxGradeElem, "Loading...");
  _showNoData(ctxTotalElem, "Loading...");

  try {
    const res = await fetch("/instructor/api/instructor/statistics");
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || "Failed to load statistics");

    const { supervisor, committee } = data.statistics;

    const avgCompletionSupervisor = supervisor.avg_completion_time
      ? Number(supervisor.avg_completion_time)
      : null;
    const avgCompletionCommittee = committee.avg_completion_time
      ? Number(committee.avg_completion_time)
      : null;
    const avgGradeSupervisor = supervisor.avg_grade
      ? Number(supervisor.avg_grade)
      : null;
    const avgGradeCommittee = committee.avg_grade
      ? Number(committee.avg_grade)
      : null;
    const totalSupervisor = supervisor.total || 0;
    const totalCommittee = committee.total || 0;

    if (avgCompletionSupervisor === null && avgCompletionCommittee === null) {
      _showNoData(ctxCompletionElem, "No completion data");
    } else {
      window.completionTimeChart = new Chart(ctxCompletionElem, {
        type: "bar",
        data: {
          labels: ["Supervisor", "Committee Member"],
          datasets: [
            {
              label: "Avg. Completion Time (days)",
              data: [avgCompletionSupervisor ?? 0, avgCompletionCommittee ?? 0],
              backgroundColor: ["#6366f1", "#10b981"],
              borderRadius: 12,
              maxBarThickness: 48,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
            datalabels: {
              display: true,
              color: "#374151",
              font: { weight: "bold" },
              anchor: "end",
              align: "top",
              formatter: (v) => (v ? v.toFixed(1) : "–"),
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Days" },
              grid: { color: "#e5e7eb" },
            },
            x: { grid: { display: false } },
          },
        },
        plugins:
          typeof ChartDataLabels !== "undefined" ? [ChartDataLabels] : [],
      });
    }

    if (avgGradeSupervisor === null && avgGradeCommittee === null) {
      _showNoData(ctxGradeElem, "No grade data");
    } else {
      window.gradeChart = new Chart(ctxGradeElem, {
        type: "bar",
        data: {
          labels: ["Supervisor", "Committee Member"],
          datasets: [
            {
              label: "Avg. Grade",
              data: [avgGradeSupervisor ?? 0, avgGradeCommittee ?? 0],
              backgroundColor: ["#6366f1", "#10b981"],
              borderRadius: 12,
              maxBarThickness: 48,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
            datalabels: {
              display: true,
              color: "#374151",
              font: { weight: "bold" },
              anchor: "end",
              align: "top",
              formatter: (v) => (v ? v.toFixed(2) : "–"),
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Grade" },
              grid: { color: "#e5e7eb" },
            },
            x: { grid: { display: false } },
          },
        },
        plugins:
          typeof ChartDataLabels !== "undefined" ? [ChartDataLabels] : [],
      });
    }

    if (totalSupervisor === 0 && totalCommittee === 0) {
      _showNoData(ctxTotalElem, "No thesis data");
    } else {
      window.totalThesesChart = new Chart(ctxTotalElem, {
        type: "doughnut",
        data: {
          labels: ["Supervised", "Committee Member"],
          datasets: [
            {
              label: "Total Theses",
              data: [totalSupervisor, totalCommittee],
              backgroundColor: ["#6366f1", "#10b981"],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            tooltip: { enabled: true },
            datalabels: {
              display: true,
              color: "#374151",
              font: { weight: "bold" },
              formatter: (v) => (v ? v : "–"),
            },
          },
        },
        plugins:
          typeof ChartDataLabels !== "undefined" ? [ChartDataLabels] : [],
      });
    }
  } catch (err) {
    _showNoData(ctxCompletionElem, "Error loading statistics");
    _showNoData(ctxGradeElem, "Error loading statistics");
    _showNoData(ctxTotalElem, "Error loading statistics");
  }
}

/**
 * Draws a "no data" text message on a canvas element
 * @private
 * @param {HTMLCanvasElement} canvas
 * @param {string} message
 */
function _showNoData(canvas, message = "No data available") {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 18px Inter, sans-serif";
  ctx.fillStyle = "#6b7280";
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}
