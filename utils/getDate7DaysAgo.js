function getDate7DaysAgo() {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - 7)
    return currentDate
}

module.exports = getDate7DaysAgo