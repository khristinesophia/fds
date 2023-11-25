function getDate1DayAgo() {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - 1)
    return currentDate
}

function getDate7DaysAgo() {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - 7)
    return currentDate
}

function getDate30DaysAgo() {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - 30)
    return currentDate
}

function getDate365DaysAgo() {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - 365)
    return currentDate
}

module.exports = {
    getDate1DayAgo,
    getDate7DaysAgo,
    getDate30DaysAgo,
    getDate365DaysAgo
}