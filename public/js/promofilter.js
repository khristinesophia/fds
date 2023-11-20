function setSelectValuesFromURL() {
    let params = new URLSearchParams(window.location.search)
  
    //- params value
    let status = params.get('status')
    let typeid = params.get('typeid')

    //- select elements
    const statusSelect = document.getElementById('status')
    const typeidSelect = document.getElementById('typeid')

    //- null option elements
    const nullstatusOption = document.getElementById('nullstatus')
    const nulltypeidOption = document.getElementById('nulltypeid')


    if (params.has('status') && params.has('typeid')) {
        // Both 'status' and 'typeid' exist
        statusSelect.value = status
        typeidSelect.value = typeid
    } 
    else if (params.has('status') && !params.has('typeid')) {
        // Only 'status' exists
        statusSelect.value = status
        nulltypeidOption.selected = true
    } 
    else if (!params.has('status') && params.has('typeid')) {
        // Only 'typeid' exists
        nullstatusOption.selected = true
        typeidSelect.value = typeid
    } 
    else {
        // Neither 'status' nor 'typeid' exist
        nullstatusOption.selected = true
        nulltypeidOption.selected = true
    }
    
}

window.onload = setSelectValuesFromURL

// ----------------------------------------------------------------------------------------------------

// set params when status select is changed
document.getElementById('status').addEventListener('change', (event)=>{

    const url = new URL(window.location.href) //- url of current page
    const params = new URLSearchParams(url.search)  //- query string of the url

    const statusValue = event.target.value //- value of the select

    //- set params value
    if (statusValue !== 'All') {
        params.set('status', statusValue)
    }
    else if(statusValue === 'All'){
        params.delete('status')
    }

    url.search = params.toString() //- assign params to the query string of the url

    window.history.pushState({}, '', url)

    window.location.reload() //- reload page
})

// set params when typeid select is changed
document.getElementById('typeid').addEventListener('change', (event)=>{

    const url = new URL(window.location.href)
    const params = new URLSearchParams(url.search)

    const typeidValue = event.target.value

    if (typeidValue !== 'All') {
        params.set('typeid', typeidValue)
    } 
    else if(typeidValue === 'All'){
        params.delete('typeid')
    }

    url.search = params.toString()

    window.history.pushState({}, '', url)
    
    window.location.reload()
})


// ----------------------------------------------------------------------------------------------------


document.getElementById('downloadAnchor').addEventListener('click', (event) => {
    event.preventDefault()

    const urlString = window.location.search

    if(urlString.includes('?')){
        const arr = urlString.split('?')
        const queryString = arr[1]

        this.href = 'http://localhost:5000/reports/dlPromosSummary?' + queryString
        window.location.href = this.href
    } else{
        this.href = 'http://localhost:5000/reports/dlPromosSummary?'
        window.location.href = this.href
    }
    
})