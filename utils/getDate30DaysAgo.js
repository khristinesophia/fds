function getDate30DaysAgo() {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - 30)
    return currentDate
}
   
module.exports = getDate30DaysAgo