const PDFDocument = require("pdfkit")

function createInvoice(dataCallback, endCallback, invoice) {
  let doc = new PDFDocument({ size: "A4", margin: 50 })

  doc.on('data', dataCallback)
  doc.on('end', endCallback)

  generateHeader(doc, invoice)
  generateGuestInformation(doc, invoice)
  generateInvoiceTable(doc, invoice)
  generateFooter(doc)

  doc.end()
}

function generateHeader(doc, invoice) {
  const hotellocationParts = invoice.hotel.hotellocation.split('City,')
  const hotellocation1 = hotellocationParts[0] + 'City,' 
  const hotellocation2 = hotellocationParts[1]

  doc
    // .image("logo.png", 50, 45, { width: 50 })
    .fillColor("#444444")
    .fontSize(20)
    .text(invoice.hotel.hotelname, 50, 45)
    .fontSize(10)
    .text(invoice.hotel.hotelname, 200, 50, { align: "right" })
    .text(hotellocation1, 200, 65, { align: "right" })
    .text(hotellocation2, 200, 80, { align: "right" })
}

function generateGuestInformation(doc, invoice) {
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("Invoice", 50, 160)

  generateHr(doc, 185)

  const guestInformationTop = 190

  let col1X = 50
  let col2X = 150
  let col3X = 300
  let col4X = 400
  
  let lineHeight = 15

  const normalFont = 'Helvetica'
  const boldFont = 'Helvetica-Bold'
  
  // First column
  doc.fontSize(10).font(boldFont).text("Name:", col1X, guestInformationTop + lineHeight);
  doc.text("Address:", col1X, guestInformationTop + lineHeight * 2);
  doc.text("Contact Number:", col1X, guestInformationTop + lineHeight * 3);
  doc.text("Email:", col1X, guestInformationTop + lineHeight * 4);
  
  // Second column
  doc.fontSize(10).font(normalFont).text(invoice.account.fullname, col2X, guestInformationTop + lineHeight);
  doc.text(invoice.account.address, col2X, guestInformationTop + lineHeight * 2);
  doc.text(invoice.account.contactno, col2X, guestInformationTop + lineHeight * 3);
  doc.text(invoice.account.email, col2X, guestInformationTop + lineHeight * 4);
  
  // Third column
  doc.fontSize(10).font(boldFont).text("Account Number:", col3X, guestInformationTop + lineHeight);
  doc.text("Check-in Date:", col3X, guestInformationTop + lineHeight * 2);
  doc.text("Check-out Date:", col3X, guestInformationTop + lineHeight * 3);
  
  // Fourth column
  doc.fontSize(10).font(normalFont).text(invoice.account.accountid, col4X, guestInformationTop + lineHeight);
  doc.text(formatDate(invoice.account.checkindate), col4X, guestInformationTop + lineHeight * 2);
  doc.text(formatDate(invoice.account.checkoutdate), col4X, guestInformationTop + lineHeight * 3);

  generateHr(doc, 280);
}

function generateInvoiceTable(doc, invoice) {
  let i
  let j = 0 //- Initialize a new variable to keep track of the total number of rows
  const invoiceTableTop = 330
   
  doc.font("Helvetica-Bold")
  generateTableRow(
    doc,
    invoiceTableTop,
    "Code",
    "Description",
    "Price",
    "Quantity",
    "Amount"
  )
  generateHr(doc, invoiceTableTop + 20)
  
  doc.font("Helvetica")
   
  for (i = 0; i < invoice.t1.length; i++) {
    const t1 = invoice.t1[i]
    const position = invoiceTableTop + (j + 1) * 30 // Use j instead of i
    generateTableRow(
      doc,
      position,
      t1.transactionid,
      t1.description,
      t1.price,
      t1.qty,
      t1.amount
    )
    generateHr(doc, position + 20)
    j++ // Increment j after each row
  }
  for (i = 0; i < invoice.t2.length; i++) {
    const t2 = invoice.t2[i]
    const position = invoiceTableTop + (j + 1) * 30 // Use j instead of i
    generateTableRow(
      doc,
      position,
      t2.ps_code,
      t2.ancillary_desc,
      t2.price,
      t2.quantity,
      t2.amount
    )
    generateHr(doc, position + 20)
    j++ // Increment j after each row
  }
  for (i = 0; i < invoice.t3.length; i++) {
    const t3 = invoice.t3[i]
    const position = invoiceTableTop + (j + 1) * 30 // Use j instead of i
    generateTableRow(
      doc,
      position,
      t3.transactionid,
      t3.description,
      t3.price,
      t3.qty,
      t3.amount
    )
    generateHr(doc, position + 20)
    j++ // Increment j after each row
  }
   
  const subtotalPosition = invoiceTableTop + (j + 1) * 30
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "",
    "Subtotal",
    "",
    invoice.folio.subtotal
  )
   
  const discountPosition = subtotalPosition + 20
  generateTableRow(
    doc,
    discountPosition,
    "",
    "",
    "Discount",
    "",
    invoice.folio.discount + "%"
  )
   
  const taxPosition = discountPosition + 20
  generateTableRow(
    doc,
    taxPosition,
    "",
    "",
    "Tax",
    "",
    invoice.folio.tax + "%"
  )

  const totalAmountPosition = taxPosition + 20
  doc.font("Helvetica-Bold")
  generateTableRow(
    doc,
    totalAmountPosition,
    "",
    "",
    "Total Amount",
    "",
    invoice.folio.totalamount
  )
  const paidToDatePosition = totalAmountPosition + 20
  doc.font("Helvetica-Bold")
  generateTableRow(
    doc,
    paidToDatePosition,
    "",
    "",
    "Paid to Date",
    "",
    invoice.folio.paid
  )
  const balanceDuePosition = paidToDatePosition + 20
  doc.font("Helvetica-Bold")
  generateTableRow(
    doc,
    balanceDuePosition,
    "",
    "",
    "Balance Due",
    "",
    invoice.folio.balance
  )
  doc.font("Helvetica")
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Discounts and taxes are already applied during check-in.",
      50,
      780,
      { align: "center", width: 500 }
    )
}

function generateTableRow(
  doc,
  y,
  code,
  description,
  price,
  quantity,
  amount
) {
  doc
    .fontSize(10)
    .text(code, 50, y)
    .text(description, 150, y)
    .text(price, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(amount, 0, y, { align: "right" })
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke()
}

//- fixed this to php
function formatCurrency(cents) {
  return "$" + (cents / 100).toFixed(2)
}

function formatDate(date) {
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  return year + "/" + month + "/" + day;
}

module.exports = {
  createInvoice
}