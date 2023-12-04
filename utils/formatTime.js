function formatTime(time) {
    // split the time into hours, minutes and seconds
    var timeParts = time.split(":");
    var hours = parseInt(timeParts[0]);
    var minutes = timeParts[1];
    var seconds = timeParts[2];
    
    // check if it's AM or PM
    var ampm = hours >= 12 ? "PM" : "AM";
    
    // subtract 12 from hours if it's PM
    if (hours > 12) {
     hours -= 12;
    }
    
    // set hours to 12 if it's 0
    if (hours === 0) {
     hours = 12;
    }
    
    // combine the time into a string and return it
    var newTime = `${hours}:${minutes} ${ampm}`
    return newTime;
   }

module.exports = {
    formatTime
}