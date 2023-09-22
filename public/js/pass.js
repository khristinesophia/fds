var passwordInput = document.getElementById("password");
    var showPasswordCheckbox = document.getElementById("showPasswordCheckbox");

    showPasswordCheckbox.addEventListener("change", function() {
        if (showPasswordCheckbox.checked) {
            passwordInput.type = "text";
        } else {
            passwordInput.type = "password";
        }
    });