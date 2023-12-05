function setDateValuesFromURL() {
    let params = new URLSearchParams(window.location.search)
  
    //- params value
    let range = params.get('range')

    //- input elements
    const rangeSelect = document.getElementById('range')

    //- 
    const dailyOption = document.getElementById('dailyOption')


    if (params.has('range')) {
        // Both 'status' and 'typeid' exist
        rangeSelect.value = range
    } 
    else {
        // Neither 'status' nor 'typeid' exist
        dailyOption.selected = true
    }
    
}

window.onload = setDateValuesFromURL

// ----------------------------------------------------------------------------------------------------

// set params when range is changed
document.getElementById('range').addEventListener('change', (event)=>{

    const url = new URL(window.location.href) //- url of current page
    const params = new URLSearchParams(url.search)  //- query string of the url

    const rangeValue = event.target.value //- value of the date

    params.set('range', rangeValue)

    url.search = params.toString() //- assign params to the query string of the url

    window.history.pushState({}, '', url)

    window.location.reload() //- reload page
})


// ----------------------------------------------------------------------------------------------------


document.getElementById('downloadAnchor').addEventListener('click', (event) => {
    event.preventDefault()

    const urlString = window.location.search

    if(urlString.includes('?')){
        const arr = urlString.split('?')
        const queryString = arr[1]

        this.href = '/reports/dlRevenue?' + queryString
        window.location.href = this.href
    } else{
        this.href = '/reports/dlRevenue?'
        window.location.href = this.href
    }
    
})