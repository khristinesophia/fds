function formatDateWithTime(d){
    const date = new Date(d)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    let hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    // const seconds = date.getSeconds().toString().padStart(2, "0")

    let ampm = hours >= 12 ? 'PM' : 'AM'

     // Convert hours to 12-hour format
    hours = hours % 12;

    // Convert '0' to '12'
    hours = hours ? hours : 12;
 
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`
 
    return formattedDate
 }
 
 module.exports = formatDateWithTime