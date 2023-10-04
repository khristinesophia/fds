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
  }
}

function closeChangeSAModal() {
  var modal = document.getElementById('changepassword');
  modal.classList.remove('modal-active');
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
  deleteForm.action = `/HArooms/delete/${roomnum}`;
}
function closeDeleteRoom() {
  var modal = document.getElementById('deleteroom');
  modal.classList.remove('modal-active');
}

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