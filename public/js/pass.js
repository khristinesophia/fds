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
        // Attach event listeners for changeAdminHSA modal
    const showoldPasswordToggleAdmin = document.getElementById("showoldPasswordToggleAdmin");
    const shownewPasswordToggleAdmin = document.getElementById("shownewPasswordToggleAdmin");
    const showconPasswordToggleAdmin = document.getElementById("showconPasswordToggleAdmin");

    if (showoldPasswordToggleAdmin && shownewPasswordToggleAdmin && showconPasswordToggleAdmin) {
        showoldPasswordToggleAdmin.addEventListener("click", () => {
            togglePasswordVisibility("oldpasswordAdmin", "showoldPasswordIconAdmin");
        });

        shownewPasswordToggleAdmin.addEventListener("click", () => {
            togglePasswordVisibility("newpasswordAdmin", "shownewPasswordIconAdmin");
        });

        showconPasswordToggleAdmin.addEventListener("click", () => {
            togglePasswordVisibility("conpasswordAdmin", "showconPasswordIconAdmin");
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

    // Attach event listener for password visibility toggle in another section
    const passwordInput = document.getElementById("password");
    const showPasswordIcon = document.getElementById("showPasswordIcon");

    if (passwordInput && showPasswordIcon) {
        showPasswordIcon.addEventListener("click", function () {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                showPasswordIcon.classList.remove("fa-eye-slash");
                showPasswordIcon.classList.add("fa-eye");
            } else {
                passwordInput.type = "password";
                showPasswordIcon.classList.remove("fa-eye");
                showPasswordIcon.classList.add("fa-eye-slash");
            }
        });
    }
});

// Your changeSA and changeReceptionistHSA related functions can go here.
