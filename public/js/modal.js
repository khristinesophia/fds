function openModal() {
    var modal = document.getElementById('modal');
    modal.classList.add('modal-active');
}

function closeModal() {
    var modal = document.getElementById('modal');
    modal.classList.remove('modal-active');

}


function openDeleteHotelModal(clickedElement) {
  var modal = document.getElementById('deletehotel');
  modal.classList.add('modal-active');

  // Get the hotel ID and hotel name from data attributes
  var hotelId = clickedElement.getAttribute('data-hotelid');
  var hotelName = clickedElement.getAttribute('data-hotelname');

  // Set the hotel name in the modal
  var hotelNameElement = document.getElementById('hotel-name-in-modal');
  hotelNameElement.value = hotelName; // Set the value, not textContent

  // Set the form action in the modal
  var deleteForm = document.getElementById('delete-hotel-form');
  deleteForm.action = `/hotels/delete/${hotelId}`;
}

function closeDeleteHotelModal() {
  var modal = document.getElementById('deletehotel');
  modal.classList.remove('modal-active');
}


function openEditSAModal(clickedElement) {
  var modal = document.getElementById('editsuper');
  modal.classList.add('modal-active');

  // Get the super admin data from data attributes
  var userId = clickedElement.getAttribute('data-userid');
  var fullName = clickedElement.getAttribute('data-fullname');
  var username = clickedElement.getAttribute('data-username');

  // Populate the form fields with the data from data attributes
  var nameInput = document.querySelector('#editsuper input[name="name"]');
  var usernameInput = document.querySelector('#editsuper input[name="username"]');
  
  if (nameInput) {
    nameInput.value = fullName || '';
  }

  if (usernameInput) {
    usernameInput.value = username || '';
  }
  
  // Set the form action in the modal
  var editForm = document.querySelector('#editsuper form');
  if (editForm) {
    editForm.action = `/superadmins/edit/${userId}`;
  }
}
function closeEditSAModal() {
  var modal = document.getElementById('editsuper');
  modal.classList.remove('modal-active');
}




// JavaScript code for handling the modal and form submission

function openChangeSAModal(clickedElement) {
  var modal = document.getElementById('changepassword');
  modal.classList.add('modal-active');

  // Get the user ID and password hash from data attributes
  var userId = clickedElement.getAttribute('data-userid');
  var passwordHash = clickedElement.getAttribute('data-password');

  // Set the form action in the modal
  var changePasswordForm = document.querySelector('#changepassword form');
  if (changePasswordForm) {
    changePasswordForm.action = `/superadmins/changepassword/${userId}`;
    
    // Add a submit event listener to the form
    changePasswordForm.addEventListener('submit', function (event) {
      event.preventDefault(); // Prevent the default form submission

      // Get the old password and other form data
      var oldPassword = document.getElementById('oldpassword').value;
      var newPassword = document.getElementById('newpassword').value;
      var confirmPassword = document.getElementById('conpassword').value;

      // Reset any previous error messages
      var errorElement = document.getElementById('error-message');
      if (errorElement) {
        errorElement.textContent = '';
      }

      // Send a POST request to the server to handle password change
      fetch(this.action, {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          // Show the error message in the modal
          if (errorElement) {
            errorElement.textContent = data.error;
            errorElement.style.display = 'block'; // Show the error message
          }
        } else {
          // Password updated successfully, close the modal or perform any other actions
          closeChangeSAModal();
        }
      })
      .catch(error => {
        console.error('Error:', error);
        // Handle other error scenarios if needed
      });
    });
  }
}

function closeChangeSAModal() {
  var modal = document.getElementById('changepassword');
  modal.classList.remove('modal-active');

  // Clear the input fields
  var oldPasswordInput = document.getElementById('oldpassword');
  var newPasswordInput = document.getElementById('newpassword');
  var confirmPasswordInput = document.getElementById('conpassword');

  if (oldPasswordInput && newPasswordInput && confirmPasswordInput) {
    oldPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
  }

  // Hide the error message element
  var errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none'; // Hide the error message
  }
}




// You can call openChangeSAModal(clickedElement) to open the modal.


function openDeleteSuperModal(clickedElement) {
  var modal = document.getElementById('deletesuper');
  modal.classList.add('modal-active');

  // Get the hotel ID and hotel name from data attributes
  var userId = clickedElement.getAttribute('data-userid');
  var fullName = clickedElement.getAttribute('data-fullname');

  // Set the hotel name in the modal
  var fullNameElement = document.getElementById('full-name-in-modal');
  fullNameElement.value = fullName; // Set the value, not textContent

  // Set the form action in the modal
  var deleteForm = document.getElementById('delete-user-form');
  deleteForm.action = `/superadmins/delete/${userId}`;
}
function closeDeleteSuperModal() {
  var modal = document.getElementById('deletesuper');
  modal.classList.remove('modal-active');
}


function openDeleteRoom(clickedElement) {
  var modal = document.getElementById('deleteroom');
  modal.classList.add('modal-active');

  // Get the hotel ID and hotel name from data attributes
  var roomnum = clickedElement.getAttribute('data-roomnum');
  var roomtype = clickedElement.getAttribute('data-roomtype');

  // Set the hotel name in the modal
  var roomNumElement = document.getElementById('room-num-in-modal');
  roomNumElement.value = roomnum; // Set the value, not textContent

  // Set the form action in the modal
  var deleteForm = document.getElementById('delete-user-form');
  deleteForm.action = `/HSArooms/delete/${roomnum}`;
}
function closeDeleteRoom() {
  var modal = document.getElementById('deleteroom');
  modal.classList.remove('modal-active');
}

//- Checkbox

function confirmDelete() {
  var checkbox = document.getElementById('confirm-checkbox');
  var errorMessage = document.getElementById('checkbox-error-message');
  
  // Check if the checkbox is checked
  if (checkbox.checked) {
      // The checkbox is checked, proceed with the delete action
      errorMessage.style.display = 'none'; // Hide the error message
      // Continue with the delete action or form submission
  } else {
      // The checkbox is not checked, show an error message
      errorMessage.style.display = 'block';
      // Prevent the form from submitting
      event.preventDefault();
  }
}


//- Hotel System Admin JS for Modal

//- Edit Receptionist
  //- Open Edit Modal for Receptionist
  function Edit_Receptionist_User(clickedElement) {
    var modal = document.getElementById('editreceptionisthsa');
    modal.classList.add('modal-active');

    // Get the super admin data from data attributes
    var userId = clickedElement.getAttribute('data-userid');
    var fullName = clickedElement.getAttribute('data-fullname');
    var username = clickedElement.getAttribute('data-username');

    // Populate the form fields with the data from data attributes
    var nameInput = document.querySelector('#editreceptionisthsa input[name="name"]');
    var usernameInput = document.querySelector('#editreceptionisthsa input[name="username"]');

    if (nameInput) {
      nameInput.value = fullName || '';
    }
    if (usernameInput) {
      usernameInput.value = username || '';
    }
    // Set the form action in the modal
    var editForm = document.querySelector('#editreceptionisthsa form');
    if (editForm) {
      editForm.action = `/users/edit/receptionist/${userId}`;
    }
  }
  //- Close Edit Modal for Receptionist
  function CLose_Edit_Receptionist_User() {
    var modal = document.getElementById('editreceptionisthsa');
    modal.classList.remove('modal-active');
  }

//- Delete Receptionist
  //- Open Delete Modal for Receptionist
  function Delete_Receptionist_User(clickedElement) {
    var modal = document.getElementById('deletereceptionisthsa');
    modal.classList.add('modal-active');
  
    // Get the hotel ID and hotel name from data attributes
    var userId = clickedElement.getAttribute('data-userid');
    var fullName = clickedElement.getAttribute('data-fullname');
  
    // Set the hotel name in the modal
    var fullNameElement = document.getElementById('full-name-in-modal');
    fullNameElement.value = fullName; 
  
    // Set the form action in the modal
    var deleteForm = document.getElementById('delete-user-form');
    deleteForm.action = `/users/delete/${userId}`;
  }
  //- Close Delete Modal for Receptionist
  function CLose_Delete_Receptionist_User() {
    var modal = document.getElementById('deletereceptionisthsa');
    modal.classList.remove('modal-active');
  }



function ChangePass_Receptionist_User(clickedElement) {
    var modal = document.getElementById('changeReceptionistHSA');
    modal.classList.add('modal-active');
  
    // Get the user ID and password hash from data attributes
    var userId = clickedElement.getAttribute('data-userid');
    var passwordHash = clickedElement.getAttribute('data-password');
  
    // Set the form action in the modal
    var changePasswordForm = document.querySelector('#changeReceptionistHSA form');
    if (changePasswordForm) {
      changePasswordForm.action = `/users/changePW/receptionist/${userId}`;
      
      // Add a submit event listener to the form
      changePasswordForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission
  
        // Get the old password and other form data
        var oldPassword = document.getElementById('oldpasswordReceptionist').value;
        var newPassword = document.getElementById('newpasswordReceptionist').value;
        var confirmPassword = document.getElementById('conpasswordReceptionist').value;
  
        // Reset any previous error messages
        var errorElement = document.getElementById('error-message-receptionist');
        if (errorElement) {
          errorElement.textContent = '';
        }
  
        // Send a POST request to the server to handle password change
        fetch(this.action, {
          method: 'POST',
          body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            // Show the error message in the modal
            if (errorElement) {
              errorElement.textContent = data.error;
              errorElement.style.display = 'block'; // Show the error message
            }
          } else {
            // Password updated successfully, close the modal or perform any other actions
            Close_ChangePass_Receptionist_User();
          }
        })
        .catch(error => {
          console.error('Error:', error);
          // Handle other error scenarios if needed
        });
      });
    }
}

function Close_ChangePass_Receptionist_User() {
    var modal = document.getElementById('changeReceptionistHSA');
    modal.classList.remove('modal-active');
  
    // Clear the input fields
    var oldPasswordInput = document.getElementById('oldpasswordReceptionist');
    var newPasswordInput = document.getElementById('newpasswordReceptionist');
    var confirmPasswordInput = document.getElementById('conpasswordReceptionist');
  
    if (oldPasswordInput && newPasswordInput && confirmPasswordInput) {
      oldPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
    }
  
    // Hide the error message element
    var errorElement = document.getElementById('error-message-receptionist');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none'; // Hide the error message
    }
}


//- Room Type
  //- Delete Room Type
  function openDeleteRoomType(clickedElement) {
    var modal = document.getElementById('deleteroomtype');
    modal.classList.add('modal-active');
  
    // Get the hotel ID and hotel name from data attributes
    var typeid = clickedElement.getAttribute('data-typeid');
    var roomtype = clickedElement.getAttribute('data-roomtype');
  
    // Set the hotel name in the modal
    var roomTypeElement = document.getElementById('room-type-in-modal');
    roomTypeElement.value = roomtype; // Set the value, not textContent
  
    // Set the form action in the modal
    var deleteForm = document.getElementById('delete-user-form');
    deleteForm.action = `/roomtype/delete/${typeid}`;
  }
  function closeDeleteRoomType() {
    var modal = document.getElementById('deleteroomtype');
    modal.classList.remove('modal-active');
  }