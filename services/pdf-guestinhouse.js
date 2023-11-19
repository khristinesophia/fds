const path = require('path')

// Import dependencies
const fs = require("fs");
const PDFDocument = require(path.join(__basedir, 'services', 'pdfkit-table'));

// Load the patients 
// const patients = require("./patients.json");

function createGuestInHouse(dataCallback, endCallback, data, summary, hotel){
    // Create The PDF document
    const doc = new PDFDocument();

    doc.on('data', dataCallback)
    doc.on('end', endCallback)

    // Pipe the PDF into a patient's file
    doc.pipe(fs.createWriteStream(`patients.pdf`));

    // Add the header - https://pspdfkit.com/blog/2019/generate-invoices-pdfkit-node/
    // doc
    //     // .image("logo.png", 50, 45, { width: 50 })
    //     .fillColor("#444444")
    //     .fontSize(20)
    //     .text("Guests Currently In-House.", 110, 57)
    //     .fontSize(10)
    //     .text("725 Fowler Avenue", 200, 65, { align: "right" })
    //     .text("Chamblee, GA 30341", 200, 80, { align: "right" })
    //     .moveDown();

    const hotellocationParts = hotel.hotellocation.split('City,')
    const hotellocation1 = hotellocationParts[0] + 'City,' 
    const hotellocation2 = hotellocationParts[1]

    doc
        // .image("logo.png", 50, 45, { width: 50 })
        .fillColor("#444444")
        .fontSize(20)
        .text('Guests In-House', 50, 45)
        .fontSize(10)
        .text(hotel.hotelname, 200, 50, { align: "right" })
        .text(hotellocation1, 200, 65, { align: "right" })
        .text(hotellocation2, 200, 80, { align: "right" })

    // Create the table - https://www.andronio.me/2017/09/02/pdfkit-tables/
    const table = {
        headers: ["Room No.", "Guest Name", "No. of Adult", "No. of Child", "Check-In Date", "Check-Out Date"],
        rows: []
    };

    // Add the patients to the table
    for (const x of data) {
        table.rows.push([x.roomnum, x.fullname, x.adultno, x.childno, x.checkindate, x.checkoutdate])
    }

    table.rows.push(['Total In-House Guest', summary.inHouse, '', '', '', '',])
    table.rows.push(['Total Number of Adults', summary.total_adultNoCount, '', '', '', '',])
    table.rows.push(['Total Number of Children', summary.total_childNoCount, '', '', '', '',])



    // Draw the table
    doc.moveDown().table(table, 10, 125, { width: 590 });

    // Finalize the PDF and end the stream
    doc.end();
}

module.exports = {
    createGuestInHouse
}