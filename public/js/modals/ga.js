// EXTEND STAY MODAL
function openExtendStay(clickedElement) {
    var modal = document.getElementById('extendStay')
    modal.classList.add('modal-active')
  
    //- get data from clicked element
    var accountid = clickedElement.getAttribute('data-accountid')
    var fullname = clickedElement.getAttribute('data-fullname')
    var roomnum = clickedElement.getAttribute('data-roomnum')
    var roomtype = clickedElement.getAttribute('data-roomtype')
    // var rate_perhour = clickedElement.getAttribute('data-rate_perhour')
    var price = clickedElement.getAttribute('data-price')
    var roomid = clickedElement.getAttribute('data-roomid')
    var folioid = clickedElement.getAttribute('data-folioid')
  
    //- set data inside modal
    document.getElementById('accountidSpan').innerText = accountid
    document.getElementById('fullnameSpan').innerText = fullname
    document.getElementById('roomnumSpan').innerText = roomnum
    document.getElementById('roomtypeSpan').innerText = roomtype
    document.getElementById('extensionSpan').innerText = price
  
    document.getElementById('daysno').setAttribute('data-price', price)
  
    //- set hidden data
    document.getElementById('price').value = price
    document.getElementById('roomid').value = roomid
    document.getElementById('folioid').value = folioid
  
    //- set form action in modal
    var form = document.getElementById('extendStayForm')
    form.action = `/ga/extend/${accountid}`;
}

function closeExtendStay() {
    //- clear fields
    document.getElementById('hoursno').value = ''
    document.getElementById('cost').value = ''

    //- remove 'modal-active' class
    var modal = document.getElementById('extendStay')
    modal.classList.remove('modal-active')
}

// CARD PAYMENT MODAL
function openModal_CardPayment() {
    var modal = document.getElementById('modal_CardPayment')
    modal.classList.add('modal-active')
  
    const subtotal = parseInt(document.querySelector('#subtotal').innerText)
    document.querySelector('#subtotal2').value = subtotal

    const totalamount = parseInt(document.querySelector('#totalamount').innerText)
    document.querySelector('#totalamount2').value = totalamount

    const paidtodate = parseInt(document.querySelector('#paidtodate').innerText)
    document.querySelector('#paidtodate2').value = paidtodate

    const balance = parseInt(document.querySelector('#balance').innerText)
    document.querySelector('#balance2').value = balance
}
  
function closeModal_CardPayment() {
    var modal = document.getElementById('modal_CardPayment')
    modal.classList.remove('modal-active')
}

// CASH PAYMENT MODAL
function openModal_CashPayment() {
    var modal = document.getElementById('modal_CashPayment')
    modal.classList.add('modal-active')
  
    const subtotal = parseInt(document.querySelector('#subtotal').innerText)
    document.querySelector('#subtotal3').value = subtotal
  
    const totalamount = parseInt(document.querySelector('#totalamount').innerText)
    document.querySelector('#totalamount3').value = totalamount
  
    const paidtodate = parseInt(document.querySelector('#paidtodate').innerText)
    document.querySelector('#paidtodate3').value = paidtodate
  
    const balance = parseInt(document.querySelector('#balance').innerText)
    document.querySelector('#balance3').value = balance
}
  
function closeModal_CashPayment() {
    var modal = document.getElementById('modal_CashPayment')
    modal.classList.remove('modal-active')
}