function openModal() {
    var modal = document.getElementById('modal');
    modal.classList.add('modal-active');
}

function closeModal() {
    var modal = document.getElementById('modal');
    modal.classList.remove('modal-active');
}

//-Add Receptionist
function openModaladdR() {
  var modal = document.getElementById('addR');
  modal.classList.add('modal-active');
}

function closeModaladdR() {
  var modal = document.getElementById('addR');
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

function openEditHotel(clickedElement){
  // get edit hotel modal
  var modal = document.getElementById('edithotel')

  // add modal-active class
  modal.classList.add('modal-active')

  // get the hotel data attributes
  var hotelid = clickedElement.getAttribute('data-hotelid')
  var hotelname = clickedElement.getAttribute('data-hotelname')
  var hotellocation = clickedElement.getAttribute('data-hotellocation')
  var hotelcontact = clickedElement.getAttribute('data-hotelcontact')
  var hotelemail = clickedElement.getAttribute('data-hotelemail')

  // Populate the form fields with the data from data attributes
  var nameInput = document.querySelector('#edithotel input[name="hotelname"]')
  var locationInput = document.querySelector('#edithotel input[name="hotellocation"]')
  var contactInput = document.querySelector('#edithotel input[name="hotelcontact"]')
  var emailInput = document.querySelector('#edithotel input[name="hotelemail"]')
  
  if (nameInput) {
    nameInput.value = hotelname || '';
  }
  if (locationInput) {
    locationInput.value = hotellocation || '';
  }
  if (contactInput) {
    contactInput.value = hotelcontact || '';
  }
  if (emailInput) {
    emailInput.value = hotelemail || '';
  }

  
  // Set the form action in the modal
  var editForm = document.querySelector('#edithotelform');
  if (editForm) {
    editForm.action = `/hotels/edit/${hotelid}`;
  }
}

function closeEditHotel(){
  var modal = document.getElementById('edithotel');
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
  //- Edit Profile
    //- Open Edit Modal for Profile
    function Edit_Profile(clickedElement) {
      var modal = document.getElementById('editprofilehsa');
      modal.classList.add('modal-active');
    
      // Get the super admin data from data attributes
      var hotelId = clickedElement.getAttribute('data-hotelid');
      var hotelName = clickedElement.getAttribute('data-hname');
      var hotelLocation = clickedElement.getAttribute('data-hlocation');
      var hotelContact = clickedElement.getAttribute('data-hcontact');
      var hotelEmail = clickedElement.getAttribute('data-hemail');
      var hotelColor = clickedElement.getAttribute('data-hotelcolor'); // Get the hotelColor
    
      // Populate the form fields with the data from data attributes
      var nameInput = document.querySelector('#editprofilehsa input[name="hotelname"]');
      var locationInput = document.querySelector('#editprofilehsa input[name="hotellocation"]');
      var contactInput = document.querySelector('#editprofilehsa input[name="hotelcontact"]');
      var emailInput = document.querySelector('#editprofilehsa input[name="hotelemail"]');
      var colorSelect = document.querySelector('#editprofilehsa select[name="hotelcolor"]'); // Get the color dropdown
    
      if (nameInput) {
        nameInput.value = hotelName || '';
      }
      if (locationInput) {
        locationInput.value = hotelLocation || '';
      }
      if (contactInput) {
        contactInput.value = hotelContact || '';
      }
      if (emailInput) {
        emailInput.value = hotelEmail || '';
      }
      if (colorSelect) {
        // Loop through the options and set the selected option based on hotelColor
        for (var i = 0; i < colorSelect.options.length; i++) {
          if (colorSelect.options[i].value === hotelColor) {
            colorSelect.options[i].selected = true;
          }
        }
      }
    
      // Set the form action in the modal
      var editForm = document.querySelector('#editprofilehsa form');
      if (editForm) {
        editForm.action = `/profile/edit/${hotelId}`;
      }
    }
    
    //- Close Edit Modal for Receptionist
    function CLose_Edit_Profile() {
      var modal = document.getElementById('editprofilehsa');
      modal.classList.remove('modal-active');
    }



//- Edit Admin
  //- Open Edit Modal for Receptionist
  function Edit_Admin_User(clickedElement) {
    var modal = document.getElementById('editadminhsa');
    modal.classList.add('modal-active');

    // Get the super admin data from data attributes
    var userId = clickedElement.getAttribute('data-userid');
    var username = clickedElement.getAttribute('data-username');
    var email = clickedElement.getAttribute('data-email');

    // Populate the form fields with the data from data attributes
    var usernameInput = document.querySelector('#editadminhsa input[name="username"]');
    var emailInput = document.querySelector('#editadminhsa input[name="email"]');

    if (usernameInput) {
      usernameInput.value = username || '';
    }
    if (emailInput) {
      emailInput.value = email || '';
    }
    // Set the form action in the modal
    var editForm = document.querySelector('#editadminhsa form');
    if (editForm) {
      editForm.action = `/users/edit/manager/${userId}`;
    }
  }
  //- Close Edit Modal for Receptionist
  function CLose_Edit_Admin_User() {
    var modal = document.getElementById('editadminhsa');
    modal.classList.remove('modal-active');
  }


//- Change password Admin
function ChangePass_Admin_User(clickedElement) {
  var modal = document.getElementById('changeAdminHSA');
  modal.classList.add('modal-active');

  var userId = clickedElement.getAttribute('data-userid');
  var changePasswordForm = document.querySelector('#changeAdminHSA form');
  var errorElement = document.getElementById('error-message-admin');

  // Reset the error message every time the modal is opened
  if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
  }

  if (changePasswordForm) {
      changePasswordForm.action = `/users/changePW/manager/${userId}`;

      changePasswordForm.addEventListener('submit', function (event) {
          event.preventDefault(); 

          var oldPassword = document.getElementById('oldpasswordAdmin').value;
          var newPassword = document.getElementById('newpasswordAdmin').value;
          var confirmPassword = document.getElementById('conpasswordAdmin').value;

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
                  if (errorElement) {
                      errorElement.textContent = data.error;
                      errorElement.style.display = 'block';
                  }
              } else {
                  Close_ChangePass_Admin_User();
              }
          })
          .catch(error => {
              console.error('Error:', error);
              // Handle other error scenarios if needed
          });
      });
  }
}

function Close_ChangePass_Admin_User() {
  var modal = document.getElementById('changeAdminHSA');
  modal.classList.remove('modal-active');

  var oldPasswordInput = document.getElementById('oldpasswordAdmin');
  var newPasswordInput = document.getElementById('newpasswordAdmin');
  var confirmPasswordInput = document.getElementById('conpasswordAdmin');
  var errorElement = document.getElementById('error-message-admin');

  if (oldPasswordInput && newPasswordInput && confirmPasswordInput) {
      oldPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
  }

  if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
  }
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


//- Change password Receptionist 
function ChangePass_Receptionist_User(clickedElement) {
  var modal = document.getElementById('changeReceptionistHSA');
  modal.classList.add('modal-active');

  var userId = clickedElement.getAttribute('data-userid');
  var changePasswordForm = document.querySelector('#changeReceptionistHSA form');
  var errorElement = document.getElementById('error-message-receptionist');

  // Reset the error message every time the modal is opened
  if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
  }

  if (changePasswordForm) {
      changePasswordForm.action = `/users/changePW/receptionist/${userId}`;

      changePasswordForm.addEventListener('submit', function (event) {
          event.preventDefault(); 

          var oldPassword = document.getElementById('oldpasswordReceptionist').value;
          var newPassword = document.getElementById('newpasswordReceptionist').value;
          var confirmPassword = document.getElementById('conpasswordReceptionist').value;

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
                  if (errorElement) {
                      errorElement.textContent = data.error;
                      errorElement.style.display = 'block';
                  }
              } else {
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

  var oldPasswordInput = document.getElementById('oldpasswordReceptionist');
  var newPasswordInput = document.getElementById('newpasswordReceptionist');
  var confirmPasswordInput = document.getElementById('conpasswordReceptionist');
  var errorElement = document.getElementById('error-message-receptionist');

  if (oldPasswordInput && newPasswordInput && confirmPasswordInput) {
      oldPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
  }

  if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
  }
}


//- Room Type

function Edit_RoomType(clickedElement) {
  var modal = document.getElementById('editroomtype');
  modal.classList.add('modal-active');

  // Get the room type data from data attributes
  var typeId = clickedElement.getAttribute('data-typeid');
  var roomType = clickedElement.getAttribute('data-roomtype');
  var roomDescription = clickedElement.getAttribute('data-roomdescription');
  var roomCapacity = clickedElement.getAttribute('data-roomcapacity');
  var roomPrice = clickedElement.getAttribute('data-roomprice');
  var roomRate = clickedElement.getAttribute('data-rateperhour');
  // var roomFreeBreakfast = clickedElement.getAttribute('data-free_breakfast') === true;
  var roomFreeBreakfast = clickedElement.getAttribute('data-free_breakfast');

  // Populate the form fields with the data from data attributes
  var typeInput = document.querySelector('#editroomtype input[name="roomtype"]');
  var descriptionInput = document.querySelector('#editroomtype textarea[name="description"]');
  var capacityInput = document.querySelector('#editroomtype input[name="capacity"]');
  var priceInput = document.querySelector('#editroomtype input[name="price"]');
  var rateInput = document.querySelector('#editroomtype input[name="rate_perhour"]');
  var freeBreakfastInput = document.querySelector('#editroomtype input[name="free_breakfast"]');

  if (typeInput) {
    typeInput.value = roomType || '';
  }
  if (descriptionInput) {
    descriptionInput.value = roomDescription || '';
  }
  if (capacityInput) {
    capacityInput.value = roomCapacity || '';
  }
  if (priceInput) {
    priceInput.value = roomPrice || '';
  }
  if (rateInput) {
    rateInput.value = roomRate || '';
  }

  if (freeBreakfastInput) {
    if(roomFreeBreakfast === "true"){
      freeBreakfastInput.checked = true
    }
    else if(roomFreeBreakfast === "false"){
      freeBreakfastInput.checked = false
    }
  }

  // Set the form action in the modal
  var editForm = document.querySelector('#editroomtype form');
  if (editForm) {
    editForm.action = `/roomtype/edit/${typeId}`;
  }

// // Set the checkbox state after a short delay
// setTimeout(function () {
//   if (freeBreakfastInput) {
//     freeBreakfastInput.checked = roomFreeBreakfast;
//   }
// }, 0);

}

    
    //- Close Edit Modal for Receptionist
    function Close_Edit_RoomType() {
      var modal = document.getElementById('editroomtype');
      modal.classList.remove('modal-active');
    }


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


  function openDeletePromo(clickedElement) {
    var modal = document.getElementById('deletepromo');
    modal.classList.add('modal-active');
  
    // Get the hotel ID and hotel name from data attributes
    var pid = clickedElement.getAttribute('data-pid');
    var pcode = clickedElement.getAttribute('data-pcode');
    var pname = clickedElement.getAttribute('data-pname');
  
    // Set the hotel name in the modal
    var pNameElement = document.getElementById('promo-name-in-modal');
    pNameElement.value = pname; // Set the value, not textContent
  
    // Set the form action in the modal
    var deleteForm = document.getElementById('delete-user-form');
    deleteForm.action = `/pd/delete/${pid}`;
  }
  function closeDeletePromo() {
    var modal = document.getElementById('deletepromo');
    modal.classList.remove('modal-active');
  }









  


function openroomModal() {
  var modal = document.getElementById('addRoom');
  modal.classList.add('modal-active');

  const roomTypeSelect = document.querySelector('select[name="roomtype"]');
  const roomPriceInput = document.querySelector('input[name="roomprice"]');
  const capacityInput = document.querySelector('input[name="capacity"]');
  const roomNumInput = document.querySelector('input[name="roomnum"]');
  const roomFloorInput = document.querySelector('input[name="roomfloor"]');

  // Function to update the price and capacity inputs
  function updatePriceAndCapacity() {
      // Get the selected option
      const selectedOption = roomTypeSelect.options[roomTypeSelect.selectedIndex];

      // Update the price and capacity inputs
      roomPriceInput.value = selectedOption.getAttribute('data-price');
      capacityInput.value = selectedOption.getAttribute('data-capacity');
  }

  // Update the price and capacity inputs when the page loads
  updatePriceAndCapacity();

  // Update the price and capacity inputs when the room type changes
  roomTypeSelect.addEventListener('change', updatePriceAndCapacity);

  roomNumInput.addEventListener('input', function () {
      // Get the first character of the room number
      const firstDigit = this.value.charAt(0);

      // Populate and disable the roomfloor input
      roomFloorInput.value = firstDigit;
  });
// Handle the form submission
// Handle the form submission
  

}

function closeroomModal() {
  var modal = document.getElementById('addRoom');
  modal.classList.remove('modal-active');

}






//- open Add Shift
function openModalAddShift() {
  var modal = document.getElementById('addShift')
  modal.classList.add('modal-active')
}

//- close Add Shift
function closeModalAddShift() {
  var modal = document.getElementById('addShift')
  modal.classList.remove('modal-active')
}

//- open Edit Shift
function openModalEditShift(clickedElement) {
  var modal = document.getElementById('editShift')
  modal.classList.add('modal-active')

  var shiftid = clickedElement.getAttribute('data-shiftid')
  var shiftname = clickedElement.getAttribute('data-shiftname')
  var starthour = clickedElement.getAttribute('data-starthour')
  var endhour = clickedElement.getAttribute('data-endhour')

  var shiftnameInput = document.querySelector('#editShift input[name="shiftname"]')
  var starthourInput = document.querySelector('#editShift input[name="starthour"]')
  var endhourInput = document.querySelector('#editShift input[name="endhour"]')

  function convertTo24HourFormat(timeString) {
    const [time, period] = timeString.split(' ')
    let [hour, minute] = time.split(':')
    let formattedHour = parseInt(hour)

    if (period === 'PM' && formattedHour !== 12) {
      formattedHour += 12
    } else if (period === 'AM' && formattedHour === 12) {
      formattedHour = 0
    }

    return `${formattedHour.toString().padStart(2, '0')}:${minute}`
  }

  if (shiftnameInput) {
    shiftnameInput.value = shiftname || '';
  }
  if (starthourInput) {
    starthourInput.value = convertTo24HourFormat(starthour) || '';
  }
  if (endhourInput) {
    endhourInput.value = convertTo24HourFormat(endhour) || '';
  }

  const form = document.querySelector('#editShiftForm')

  if (form) {
    form.action = `/users/shift/edit/${shiftid}`
  }
}

//- close Edit Shift
function closeModalEditShift() {
  var modal = document.getElementById('editShift')
  modal.classList.remove('modal-active')
}

//- open Delete Shift
function openModalDeleteShift(clickedElement) {
  var modal = document.getElementById('deleteShift');
  modal.classList.add('modal-active');

  var shiftid = clickedElement.getAttribute('data-shiftid');
  const form = document.querySelector('#deleteShiftForm');
  const checkbox = document.getElementById('confirmCheckbox');
  const submitButton = document.getElementById('deleteShiftSubmit');

  // Reset the checkbox state and enable the submit button
  checkbox.checked = false;
  submitButton.disabled = false;

  if (form) {
      form.action = `/users/shift/delete/${shiftid}`;
  }

  // Add an event listener to the checkbox
  checkbox.addEventListener('change', function () {
      // Enable or disable the submit button based on the checkbox state
      submitButton.disabled = !checkbox.checked;
  });
}

//- close Add Shift
function closeModalDeleteShift() {
  var modal = document.getElementById('deleteShift')
  modal.classList.remove('modal-active')
}