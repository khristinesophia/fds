const addSAModalBtn = document.getElementById('addSAModalBtn')
addSAModalBtn.addEventListener('click', ()=>{
    openModal('addSAModal')
})

const editSAModalBtn = document.getElementById('editSAModalBtn')
editSAModalBtn.addEventListener('click', ()=>{
    openModal('editSAModal')
})

const changeSAPWModalBtn = document.getElementById('changeSAPWModalBtn')
changeSAPWModalBtn.addEventListener('click', ()=>{
    openModal('changeSAPWModal')
})

const closeAddModalBtn = document.querySelector('.closeAddModalBtn')
closeAddModalBtn.addEventListener('click', ()=>{
    closeModal('addSAModal')
})
const closeEditModalBtn = document.querySelector('.closeEditModalBtn')
closeEditModalBtn.addEventListener('click', ()=>{
    closeModal('editSAModal')
})
const closeChangePWModalBtn = document.querySelector('.closeChangePWModalBtn')
closeChangePWModalBtn.addEventListener('click', ()=>{
    closeModal('changeSAPWModal')
})


function openModal(modalID) {
    var modal = document.getElementById(modalID);
    modal.classList.add('modal-active')
}

function closeModal(modalID) {
    var modal = document.getElementById(modalID);
    modal.classList.remove('modal-active')
}