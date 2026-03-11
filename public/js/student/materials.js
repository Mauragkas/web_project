/**
 * Student materials upload and presentation details form
 * Single Responsibility: Handle student file upload and presentation form submission
 */

/**
 * Initializes the upload materials form submission handler
 */
export function initUploadMaterialsForm() {
  const form = document.getElementById("uploadMaterialsForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const messageDiv = document.getElementById("uploadMaterialsMessage");
    messageDiv.classList.add("hidden");
    messageDiv.textContent = "";

    const thesisId =
      window.studentThesisId ||
      document.getElementById("thesisIdForUpload")?.value;

    if (!thesisId) {
      messageDiv.textContent = "No thesis found.";
      messageDiv.classList.remove("hidden", "text-green-600");
      messageDiv.classList.add("text-red-600");
      return;
    }

    const formData = new FormData(form);
    formData.set("thesisId", thesisId);

    try {
      const res = await fetch("/student/api/student/thesis/materials", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        messageDiv.textContent = "Materials uploaded successfully!";
        messageDiv.classList.remove("hidden", "text-red-600");
        messageDiv.classList.add("text-green-600");
        form.reset();
      } else {
        messageDiv.textContent = data.message || "Failed to upload materials.";
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

/**
 * Initializes the presentation details form submission handler
 */
export function initPresentationDetailsForm() {
  const form = document.getElementById("presentationDetailsForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const messageDiv = document.getElementById("presentationDetailsMessage");
    messageDiv.classList.add("hidden");
    messageDiv.textContent = "";

    const thesisId =
      window.studentThesisId ||
      document.getElementById("thesisIdForPresentation")?.value;

    if (!thesisId) {
      messageDiv.textContent = "No thesis found.";
      messageDiv.classList.remove("hidden", "text-green-600");
      messageDiv.classList.add("text-red-600");
      return;
    }

    const presentationData = {
      presentationDate: form.presentationDate.value,
      presentationTime: form.presentationTime.value,
      examinationMethod: form.examinationMethod.value,
      location: form.location.value,
      connectionLink: form.connectionLink.value,
    };

    try {
      const res = await fetch(
        `/student/api/student/thesis/${thesisId}/presentation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(presentationData),
        },
      );
      const data = await res.json();

      if (data.success) {
        messageDiv.textContent = "Presentation details saved successfully!";
        messageDiv.classList.remove("hidden", "text-red-600");
        messageDiv.classList.add("text-green-600");
      } else {
        messageDiv.textContent =
          data.message || "Failed to save presentation details.";
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

/**
 * Initializes the examination method change handler (show/hide location or link)
 */
export function initExaminationMethodHandler() {
  const examMethodSelect = document.getElementById("examinationMethod");
  if (!examMethodSelect) return;

  examMethodSelect.addEventListener("change", function () {
    const locationSection = document.getElementById("locationSection");
    const connectionSection = document.getElementById("connectionSection");
    const locationInput = document.getElementById("location");
    const connectionInput = document.getElementById("connectionLink");

    if (this.value === "in-person") {
      locationSection?.classList.remove("hidden");
      connectionSection?.classList.add("hidden");
      if (locationInput) locationInput.required = true;
      if (connectionInput) {
        connectionInput.required = false;
        connectionInput.value = "";
      }
    } else {
      locationSection?.classList.add("hidden");
      connectionSection?.classList.remove("hidden");
      if (locationInput) {
        locationInput.required = false;
        locationInput.value = "";
      }
      if (connectionInput) connectionInput.required = true;
    }
  });
}

/**
 * Initializes the student edit profile form submission handler
 */
export function initEditProfileForm() {
  const form = document.getElementById("editProfileForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const messageDiv = document.getElementById("profileMessage");
    messageDiv.classList.add("hidden");
    messageDiv.textContent = "";

    const data = {
      email: form.email.value.trim(),
      street: form.street.value.trim(),
      address_number: form.address_number.value.trim(),
      city: form.city.value.trim(),
      postcode: form.postcode.value.trim(),
      mobile_telephone: form.mobile_telephone.value.trim(),
      landline_telephone: form.landline_telephone.value.trim(),
    };

    try {
      const res = await fetch("/student/api/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (result.success) {
        messageDiv.textContent = "Profile updated successfully!";
        messageDiv.classList.remove("hidden", "text-red-600");
        messageDiv.classList.add("text-green-600");
      } else {
        messageDiv.textContent = result.message || "Failed to update profile.";
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
