const passwordInput = document.getElementById("password");
const showPasswordIcon = document.getElementById("showPasswordIcon");

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
   
   const oldpasswordInput = document.getElementById("oldpassword");
    const showoldPasswordIcon = document.getElementById("showoldPasswordIcon");
    
    showoldPasswordIcon.addEventListener("click", function () {
        if (oldpasswordInput.type === "password") {
            oldpasswordInput.type = "text";
            showoldPasswordIcon.classList.remove("fa-eye-slash");
            showoldPasswordIcon.classList.add("fa-eye");
        } else {
            oldpasswordInput.type = "password";
            showoldPasswordIcon.classList.remove("fa-eye");
            showoldPasswordIcon.classList.add("fa-eye-slash");
        }
    });
    
    
    const newpasswordInput = document.getElementById("newpassword");
    const shownewPasswordIcon = document.getElementById("shownewPasswordIcon");
    
    shownewPasswordIcon.addEventListener("click", function () {
        if (newpasswordInput.type === "password") {
            newpasswordInput.type = "text";
            shownewPasswordIcon.classList.remove("fa-eye-slash");
            shownewPasswordIcon.classList.add("fa-eye");
        } else {
            newpasswordInput.type = "password";
            shownewPasswordIcon.classList.remove("fa-eye");
            shownewPasswordIcon.classList.add("fa-eye-slash");
        }
    });
    
    const conpasswordInput = document.getElementById("conpassword");
    const showconPasswordIcon = document.getElementById("showconPasswordIcon");
    
    showconPasswordIcon.addEventListener("click", function () {
        if (conpasswordInput.type === "password") {
            conpasswordInput.type = "text";
            showconPasswordIcon.classList.remove("fa-eye-slash");
            showconPasswordIcon.classList.add("fa-eye");
        } else {
            conpasswordInput.type = "password";
            showconPasswordIcon.classList.remove("fa-eye");
            showconPasswordIcon.classList.add("fa-eye-slash");
        }
    });
    