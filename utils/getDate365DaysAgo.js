function getDate365DaysAgo() {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - 365)
    return currentDate
}

module.exports = getDate365DaysAgo