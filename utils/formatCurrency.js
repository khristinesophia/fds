function formatCurrency(num) {
    if (isNaN(num)) return 'Invalid input'
  
    // Check if the number has decimal places
    const hasDecimal = num % 1 !== 0
  
    // Convert number to string and split it into integer and decimal parts
    const parts = num.toString().split('.')
  
    // Format the integer part with spaces every three digits
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  
    // Format the decimal part
    if (hasDecimal) {
      if (parts[1]) {
        // If there are decimal places, round to 2 decimal places
        parts[1] = parts[1].padEnd(2, '0').slice(0, 2)
      } else {
        // If there are no decimal places, add '.00'
        parts[1] = '00'
      }
    } else {
      // If the number has no decimal places, set decimal part as '00'
      parts[1] = '00'
    }
  
    // Join integer and decimal parts and return the formatted number
    return parts.join('.')
}

module.exports = {
    formatCurrency
}