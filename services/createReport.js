const PDFDocument = require("pdfkit")

function createReport(dataCallback, endCallback, pass) {
  let doc = new PDFDocument({ 
    size: "A4", 
    layout: 'landscape', 
    margin: 50 
  })

  doc.on('data', dataCallback)
  doc.on('end', endCallback)

  generateHeader(doc, pass.reportTitle, pass.hotel)
  generateOverview(doc, pass.overviewTitles, pass.overview)
  generateTable(doc, pass.data, pass.headers)
  //   generateFooter(doc)

  doc.end()
}

function generateHeader(doc, reportTitle, hotel) {
  const hotellocationParts = hotel.hotellocation.split('City,')
  const hotellocation1 = hotellocationParts[0] + 'City,' 
  const hotellocation2 = hotellocationParts[1]

  doc
    .fillColor("#444444")
    .fontSize(20)
    .text(reportTitle, 50, 45)
    .fontSize(10)
    .text(hotel.hotelname, 200, 50, { align: "right" })
    .text(hotellocation1, 200, 65, { align: "right" })
    .text(hotellocation2, 200, 80, { align: "right" })
}


function generateOverview(doc, overviewTitles, overview) {
  doc
    .fillColor("#444444")
    .fontSize(15)
    .text("Overview", 50, 120)

  // generateHr(doc, 130)

  const overviewTop = 120

  let col1X = 50
  let col2X = 250

  let lineHeight = 15

  const normalFont = 'Helvetica'
  const boldFont = 'Helvetica-Bold'
  
  // First column
  doc
    .fontSize(10)
    .font(boldFont)
  doc.text(overviewTitles.title1, col1X, overviewTop + lineHeight * 2)
  doc.text(overviewTitles.title2, col1X, overviewTop + lineHeight * 3)
  doc.text(overviewTitles.title3, col1X, overviewTop + lineHeight * 4)

  // Second column
  doc
    .fontSize(10)
    .font(normalFont)
  doc.text(overview.overview1, col2X, overviewTop + lineHeight * 2)
  doc.text(overview.overview2, col2X, overviewTop + lineHeight * 3)
  doc.text(overview.overview3, col2X, overviewTop + lineHeight * 4)

  // generateHr(doc, 200)
}


function generateTable(doc, data, headers) {
  let i
  let j = 0 //- variable to keep track of the total number of rows
  const tableTop = 220
  
  //- headers
  doc.font("Helvetica-Bold")
  generateTableRow(doc, tableTop, headers)


  //- hr
  generateHr(doc, tableTop + 20)
  

  //- data
  doc.font("Helvetica")
  data.forEach(row=>{
    const position = tableTop + (j + 1) * 30
    generateTableRow(doc, position, Object.values(row))
    generateHr(doc, position + 20)
    j++
  })

}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Discounts and taxes are already applied on the room accommodation.",
      50,
      780,
      { align: "center", width: 500 }
    )
}

function generateTableRow(doc, y, values) {
  const columnWidth = 742 / values.length //- calculate the width of each column
  let x = 50 //- initialize x to the margin
   
  values.forEach((value) => {
    doc.fontSize(10).text(value, x, y)
    x += columnWidth //- increment x by the column width for each value
  })
 }

function generateHr(doc, y) {
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(842, y)
    .stroke()
}

module.exports = {
  createReport
}