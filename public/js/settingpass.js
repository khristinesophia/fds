// Add an event listener to your specific form
document.querySelector('#passwordChangeForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const oldPasswordInput = document.querySelector('#oldpassword');
    const newPasswordInput = document.querySelector('#newpassword');
    const confirmPasswordInput = document.querySelector('#conpassword');
    const errorMessageDiv = document.querySelector('#error-message');
    const successMessageDiv = document.querySelector('#success-message'); // Select the success message div

    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Make an AJAX request to the server
    const response = await fetch('/settings/changepw', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    });

    if (response.ok) {
        // Success: Password changed successfully
        const result = await response.json();
        console.log(result.message); // Log the success message

        // Clear the password fields
        oldPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';

        // Hide the error message box
        errorMessageDiv.style.display = 'none';

        // Display the success message
        successMessageDiv.textContent = 'Password changed successfully.';
        successMessageDiv.style.display = 'block';
    } else {
        // Error: Display the error message
        const errorData = await response.json();
        console.error(errorData.error); // Log the error message

        // Display the error message on the web page
        errorMessageDiv.textContent = errorData.error;
        errorMessageDiv.style.display = 'block';

        // Hide the success message box
        successMessageDiv.style.display = 'none';
    }
});
