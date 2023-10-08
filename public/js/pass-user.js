// Function to toggle password visibility
function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = document.getElementById(iconId);

    if (passwordInput && eyeIcon) {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            eyeIcon.classList.remove("fa-eye-slash");
            eyeIcon.classList.add("fa-eye");
        } else {
            passwordInput.type = "password";
            eyeIcon.classList.remove("fa-eye");
            eyeIcon.classList.add("fa-eye-slash");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Attach event listeners for changeSA modal
    const showoldPasswordToggle = document.getElementById("showoldPasswordToggle");
    const shownewPasswordToggle = document.getElementById("shownewPasswordToggle");
    const showconPasswordToggle = document.getElementById("showconPasswordToggle");
    
    if (showoldPasswordToggle && shownewPasswordToggle && showconPasswordToggle) {
        showoldPasswordToggle.addEventListener("click", () => {
            togglePasswordVisibility("oldpassword", "showoldPasswordIcon");
        });

        shownewPasswordToggle.addEventListener("click", () => {
            togglePasswordVisibility("newpassword", "shownewPasswordIcon");
        });

        showconPasswordToggle.addEventListener("click", () => {
            togglePasswordVisibility("conpassword", "showconPasswordIcon");
        });
    }

    // Attach event listeners for changeReceptionistHSA modal
    const showoldPasswordToggleReceptionist = document.getElementById("showoldPasswordToggleReceptionist");
    const shownewPasswordToggleReceptionist = document.getElementById("shownewPasswordToggleReceptionist");
    const showconPasswordToggleReceptionist = document.getElementById("showconPasswordToggleReceptionist");

    if (showoldPasswordToggleReceptionist && shownewPasswordToggleReceptionist && showconPasswordToggleReceptionist) {
        showoldPasswordToggleReceptionist.addEventListener("click", () => {
            togglePasswordVisibility("oldpasswordReceptionist", "showoldPasswordIconReceptionist");
        });

        shownewPasswordToggleReceptionist.addEventListener("click", () => {
            togglePasswordVisibility("newpasswordReceptionist", "shownewPasswordIconReceptionist");
        });

        showconPasswordToggleReceptionist.addEventListener("click", () => {
            togglePasswordVisibility("conpasswordReceptionist", "showconPasswordIconReceptionist");
        });
    }
});

// Your changeSA and changeReceptionistHSA related functions can go here.
