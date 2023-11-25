function getDate1DayAgo() {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - 1)
    return currentDate
}

module.exports = getDate1DayAgo