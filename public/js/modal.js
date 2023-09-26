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