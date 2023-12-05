//- HSA MANAGEMENT MODALS
function openModal_addManager(){
  var modal = document.getElementById('addManager')
  modal.classList.add('modal-active')
}

function closeModal_addManager(){
  var modal = document.getElementById('addManager')
  modal.classList.remove('modal-active')
}

function openModal_EditHSA(clickedElement) {
  var modal = document.getElementById('editadminhsa')
  modal.classList.add('modal-active')

  //- get data from data attributes
  var userid = clickedElement.getAttribute('data-userid')
  var username = clickedElement.getAttribute('data-username')
  var email = clickedElement.getAttribute('data-email')
  var shiftid = clickedElement.getAttribute('data-shiftid')
  var onshift_mon = clickedElement.getAttribute('data-onshift_mon')
  var onshift_tues = clickedElement.getAttribute('data-onshift_tues')
  var onshift_wed = clickedElement.getAttribute('data-onshift_wed')
  var onshift_thurs = clickedElement.getAttribute('data-onshift_thurs')
  var onshift_fri = clickedElement.getAttribute('data-onshift_fri')
  var onshift_sat = clickedElement.getAttribute('data-onshift_sat')
  var onshift_sun = clickedElement.getAttribute('data-onshift_sun')

  //- form inputs
  var usernameInput = document.querySelector('#editadminhsa input[name="username"]')
  var emailInput = document.querySelector('#editadminhsa input[name="email"]')
  var shiftidSelect = document.querySelector('#editadminhsa select[name="shiftid"]')
  var onshift_monCheckbox = document.querySelector('#editadminhsa input[name="onshift_mon"]')
  var onshift_tuesCheckbox = document.querySelector('#editadminhsa input[name="onshift_tues"]')
  var onshift_wedCheckbox = document.querySelector('#editadminhsa input[name="onshift_wed"]')
  var onshift_thursCheckbox = document.querySelector('#editadminhsa input[name="onshift_thurs"]')
  var onshift_friCheckbox = document.querySelector('#editadminhsa input[name="onshift_fri"]')
  var onshift_satCheckbox = document.querySelector('#editadminhsa input[name="onshift_sat"]')
  var onshift_sunCheckbox = document.querySelector('#editadminhsa input[name="onshift_sun"]')

  if (usernameInput) {
    usernameInput.value = username || ''
  }
  if (emailInput) {
    emailInput.value = email || ''
  }

  if(shiftidSelect){ //- if shiftid SELECT exists

    if(shiftid == 0){ //- if shiftid = 0 **no shift yet
      document.getElementById('nullshiftid_hsa').selected = true
    } 
    
    else if(shiftid > 0){ //- if shiftid > 0 **there is a shift

      shiftidSelect.value = shiftid

      // shiftidSelect.options.forEach((option, i) => {
      //   if(option.value == shiftid){
      //     shiftidSelect.selectedIndex = i
      //   }
      // })

      for(var i = 0; i < shiftidSelect.options.length; i++){
        if(shiftidSelect.options[i].value == shiftid){
          shiftidSelect.selectedIndex = i
          break
        }
      }

    }
    
  }

  if (onshift_monCheckbox) { //- shift is during mon
    if(onshift_mon == "true"){
      console.log('try')
      onshift_monCheckbox.checked = true
    }
    else if(onshift_mon == "false"){
      onshift_monCheckbox.checked = false
    }
  }

  if (onshift_tuesCheckbox) { //- shift is during tues
    if(onshift_tues == "true"){
      onshift_tuesCheckbox.checked = true
    }
    else if(onshift_tues == "false"){
      onshift_tuesCheckbox.checked = false
    }
  }

  if (onshift_wedCheckbox) { //- shift is during wed
    if(onshift_wed == "true"){
      onshift_wedCheckbox.checked = true
    }
    else if(onshift_wed == "false"){
      onshift_wedCheckbox.checked = false
    }
  }

  if (onshift_thursCheckbox) { //- shift is during thurs
    if(onshift_thurs == "true"){
      onshift_thursCheckbox.checked = true
    }
    else if(onshift_thurs == "false"){
      onshift_thursCheckbox.checked = false
    }
  }

  if (onshift_friCheckbox) { //- shift is during fri
    if(onshift_fri == "true"){
      onshift_friCheckbox.checked = true
    }
    else if(onshift_fri == "false"){
      onshift_friCheckbox.checked = false
    }
  }

  if (onshift_satCheckbox) { //- shift is during sat
    if(onshift_sat == "true"){
      onshift_satCheckbox.checked = true
    }
    else if(onshift_sat == "false"){
      onshift_satCheckbox.checked = false
    }
  }

  if (onshift_sunCheckbox) { //- shift is during sun
    if(onshift_sun == "true"){
      onshift_sunCheckbox.checked = true
    }
    else if(onshift_sun == "false"){
      onshift_sunCheckbox.checked = false
    }
  }

  //- set form action of the modal
  var form = document.querySelector('#editadminhsa form')
  if (form) {
    form.action = `/users/edit/manager/${userid}`
  }
}

function closeModal_EditHSA() {
  var modal = document.getElementById('editadminhsa')
  modal.classList.remove('modal-active')
}

//- RECEPTIONIST MANAGEMENT MODALS
function openModal_EditReceptionist(clickedElement) {

  var modal = document.getElementById('editReceptionist')
  modal.classList.add('modal-active')

  //- get data from data attributes
  var userid = clickedElement.getAttribute('data-userid')
  var fullName = clickedElement.getAttribute('data-fullname')
  var username = clickedElement.getAttribute('data-username')
  var email = clickedElement.getAttribute('data-email')
  var shiftid = clickedElement.getAttribute('data-shiftid')
  var onshift_mon = clickedElement.getAttribute('data-onshift_mon')
  var onshift_tues = clickedElement.getAttribute('data-onshift_tues')
  var onshift_wed = clickedElement.getAttribute('data-onshift_wed')
  var onshift_thurs = clickedElement.getAttribute('data-onshift_thurs')
  var onshift_fri = clickedElement.getAttribute('data-onshift_fri')
  var onshift_sat = clickedElement.getAttribute('data-onshift_sat')
  var onshift_sun = clickedElement.getAttribute('data-onshift_sun')

  //- form inputs
  var nameInput = document.querySelector('#editReceptionist input[name="name"]')
  var usernameInput = document.querySelector('#editReceptionist input[name="username"]')
  var emailInput = document.querySelector('#editReceptionist input[name="email"]')
  var shiftidSelect = document.querySelector('#editReceptionist select[name="shiftid"]')
  var onshift_monCheckbox = document.querySelector('#editReceptionist input[name="onshift_mon"]')
  var onshift_tuesCheckbox = document.querySelector('#editReceptionist input[name="onshift_tues"]')
  var onshift_wedCheckbox = document.querySelector('#editReceptionist input[name="onshift_wed"]')
  var onshift_thursCheckbox = document.querySelector('#editReceptionist input[name="onshift_thurs"]')
  var onshift_friCheckbox = document.querySelector('#editReceptionist input[name="onshift_fri"]')
  var onshift_satCheckbox = document.querySelector('#editReceptionist input[name="onshift_sat"]')
  var onshift_sunCheckbox = document.querySelector('#editReceptionist input[name="onshift_sun"]')

  if (nameInput) {
    nameInput.value = fullName || ''
  }
  if (usernameInput) {
    usernameInput.value = username || ''
  }
  if (emailInput) {
    emailInput.value = email || ''
  }


  if(shiftidSelect){ //- if shiftid SELECT exists

    if(shiftid == 0){ //- if shiftid = 0 **no shift yet
      document.getElementById('nullshiftid_receptionist').selected = true
    } 
    
    else if(shiftid > 0){ //- if shiftid > 0 **there is a shift

      shiftidSelect.value = shiftid

      // shiftidSelect.options.forEach((option, i) => {
      //   if(option.value == shiftid){
      //     shiftidSelect.selectedIndex = i
      //   }
      // })

      for(var i = 0; i < shiftidSelect.options.length; i++){
        if(shiftidSelect.options[i].value == shiftid){
          shiftidSelect.selectedIndex = i
          break
        }
      }

    }
    
  }

  if (onshift_monCheckbox) { //- shift is during mon
    if(onshift_mon == "true"){
      console.log('try')
      onshift_monCheckbox.checked = true
    }
    else if(onshift_mon == "false"){
      onshift_monCheckbox.checked = false
    }
  }

  if (onshift_tuesCheckbox) { //- shift is during tues
    if(onshift_tues == "true"){
      onshift_tuesCheckbox.checked = true
    }
    else if(onshift_tues == "false"){
      onshift_tuesCheckbox.checked = false
    }
  }

  if (onshift_wedCheckbox) { //- shift is during wed
    if(onshift_wed == "true"){
      onshift_wedCheckbox.checked = true
    }
    else if(onshift_wed == "false"){
      onshift_wedCheckbox.checked = false
    }
  }

  if (onshift_thursCheckbox) { //- shift is during thurs
    if(onshift_thurs == "true"){
      onshift_thursCheckbox.checked = true
    }
    else if(onshift_thurs == "false"){
      onshift_thursCheckbox.checked = false
    }
  }

  if (onshift_friCheckbox) { //- shift is during fri
    if(onshift_fri == "true"){
      onshift_friCheckbox.checked = true
    }
    else if(onshift_fri == "false"){
      onshift_friCheckbox.checked = false
    }
  }

  if (onshift_satCheckbox) { //- shift is during sat
    if(onshift_sat == "true"){
      onshift_satCheckbox.checked = true
    }
    else if(onshift_sat == "false"){
      onshift_satCheckbox.checked = false
    }
  }

  if (onshift_sunCheckbox) { //- shift is during sun
    if(onshift_sun == "true"){
      onshift_sunCheckbox.checked = true
    }
    else if(onshift_sun == "false"){
      onshift_sunCheckbox.checked = false
    }
  }

  // Set the form action in the modal
  var form = document.querySelector('#editReceptionist form')
  if (form) {
    form.action = `/users/edit/receptionist/${userid}`
  }
}
  
function closeModal_EditReceptionist() {
  var modal = document.getElementById('editReceptionist')
  modal.classList.remove('modal-active')
}